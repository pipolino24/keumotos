import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { Moto } from "@/lib/models/moto";
import { requireAuth } from "@/lib/auth/api-guards";
import { emitNotification } from "@/lib/notifications/emit";

export const dynamic = "force-dynamic";

const TIPOS_VALIDOS = [
  "visualizou",
  "simulou_financiamento",
  "enviou_lead",
  "solicitou_aluguel",
  "solicitou_compra",
  "favoritou",
] as const;

/**
 * POST /api/interesses
 * Cliente registra uma ação (visualização, simulação, etc.) sobre uma moto.
 * Endpoint acessível anonimamente (pra tracking de views) mas se autenticado,
 * inclui dados do cliente automaticamente.
 *
 * Body: { motoId, tipo, simulacao?, mensagem? }
 */
export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const data = await req.json();

    if (!data.motoId || !mongoose.Types.ObjectId.isValid(data.motoId)) {
      return NextResponse.json({ error: "motoId inválido" }, { status: 400 });
    }
    if (!TIPOS_VALIDOS.includes(data.tipo)) {
      return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
    }

    const moto = await Moto.findById(data.motoId)
      .select("modelo marca valorAnunciado vendedorResponsavel")
      .lean();
    if (!moto) {
      return NextResponse.json(
        { error: "Moto não encontrada" },
        { status: 404 }
      );
    }

    // Cliente autenticado opcional
    const auth = await requireAuth();
    const cliente = auth.ok && auth.role === "cliente"
      ? { clienteId: auth.userId, clienteEmail: auth.email }
      : {};

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      undefined;

    const interesse = await Interesse.create({
      ...cliente,
      clienteNome: data.clienteNome,
      clienteTelefone: data.clienteTelefone,
      motoId: moto._id,
      motoModelo: moto.modelo,
      motoMarca: moto.marca,
      motoValor: moto.valorAnunciado,
      tipo: data.tipo,
      simulacao: data.simulacao,
      mensagem: data.mensagem,
      origem: data.origem || "site",
      afiliadoCodigo: data.afiliadoCodigo,
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    // Cria notificação pra staff — só se há cliente identificado ou nome/contato
    const eventosVisiveis: typeof data.tipo[] = [
      "simulou_financiamento",
      "enviou_lead",
      "solicitou_aluguel",
      "solicitou_compra",
      "favoritou",
    ];
    const visivel = eventosVisiveis.includes(data.tipo) ||
      (data.tipo === "visualizou" && cliente.clienteId);

    if (visivel) {
      const nomeQuem = data.clienteNome || cliente.clienteEmail || "Visitante";
      const verbos: Record<string, string> = {
        visualizou: "visualizou",
        simulou_financiamento: "simulou financiamento de",
        enviou_lead: "enviou um lead sobre",
        solicitou_aluguel: "solicitou aluguel de",
        solicitou_compra: "solicitou compra de",
        favoritou: "favoritou",
      };
      const motoLabel = `${moto.marca ?? ""} ${moto.modelo}`.trim();
      const titulo = `${nomeQuem} ${verbos[data.tipo]} ${motoLabel}`;
      const prioridade =
        data.tipo === "solicitou_compra" || data.tipo === "solicitou_aluguel"
          ? "alta"
          : data.tipo === "enviou_lead" || data.tipo === "simulou_financiamento"
          ? "alta"
          : "normal";

      await emitNotification({
        tipo: "interesse",
        titulo,
        descricao: data.mensagem,
        clienteId: cliente.clienteId,
        clienteNome: nomeQuem,
        origemTipo: "interesse",
        origemId: interesse._id.toString(),
        link: `/dashboard/motos/${moto._id}`,
        prioridade,
        vendedorIdEspecifico: moto.vendedorResponsavel,
      });
    }

    return NextResponse.json({ ok: true, interesse: { id: interesse._id } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/interesses
 * Lista interesses — staff vê tudo; cliente só os próprios.
 * Filtros: ?motoId, ?clienteId, ?tipo, ?resultado, ?desde
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const query: Record<string, unknown> = {};

    if (auth.role === "cliente") {
      query.clienteId = auth.userId;
    } else if (auth.role === "vendedor" || auth.role === "afiliado") {
      const clienteIdParam = searchParams.get("clienteId");
      const motoIdParam = searchParams.get("motoId");
      if (clienteIdParam) query.clienteId = clienteIdParam;
      if (motoIdParam) query.motoId = motoIdParam;
    } else if (auth.role === "admin") {
      const clienteIdParam = searchParams.get("clienteId");
      const motoIdParam = searchParams.get("motoId");
      if (clienteIdParam) query.clienteId = clienteIdParam;
      if (motoIdParam) query.motoId = motoIdParam;
    } else {
      return NextResponse.json({ interesses: [] });
    }

    const tipo = searchParams.get("tipo");
    if (tipo && TIPOS_VALIDOS.includes(tipo as typeof TIPOS_VALIDOS[number])) {
      query.tipo = tipo;
    }
    const resultado = searchParams.get("resultado");
    if (resultado && ["convertido", "perdido", "em-atendimento"].includes(resultado)) {
      query.resultado = resultado;
    }
    const desde = searchParams.get("desde");
    if (desde) query.createdAt = { $gte: new Date(desde) };

    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const interesses = await Interesse.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ interesses });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
