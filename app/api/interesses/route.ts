import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { Moto } from "@/lib/models/moto";
import { requireAuth } from "@/lib/auth/api-guards";
import { emitNotification } from "@/lib/notifications/emit";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const TIPOS_VALIDOS = [
  "visualizou",
  "simulou_financiamento",
  "enviou_lead",
  "solicitou_aluguel",
  "solicitou_compra",
  "favoritou",
  "agendar_visita",
] as const;

const ORIGENS_VALIDAS = new Set([
  "site",
  "instagram",
  "whatsapp",
  "afiliado",
]);

/**
 * POST /api/interesses
 * Cliente registra uma ação (visualização, simulação, etc.) sobre uma moto.
 * Endpoint acessível anonimamente (pra tracking de views) mas se autenticado,
 * inclui dados do cliente automaticamente.
 *
 * Body: { motoId, tipo, simulacao?, mensagem? }
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // Visualizações: 30/min por IP. Tipos engajados (lead/solicitação): mais
  // restrito porque cada um gera Notification.
  const rl = rateLimit({
    key: `interesses-post:${ip}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde alguns segundos." },
      { status: 429 }
    );
  }
  try {
    await connectMongo();
    const data = await req.json();

    if (!data.motoId || !mongoose.Types.ObjectId.isValid(data.motoId)) {
      return NextResponse.json({ error: "motoId inválido" }, { status: 400 });
    }
    if (!TIPOS_VALIDOS.includes(data.tipo)) {
      return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
    }
    if (data.origem && !ORIGENS_VALIDAS.has(data.origem)) {
      return NextResponse.json({ error: "origem inválida" }, { status: 400 });
    }
    if (data.afiliadoCodigo && String(data.afiliadoCodigo).length > 64) {
      return NextResponse.json(
        { error: "afiliadoCodigo muito longo" },
        { status: 400 }
      );
    }
    if (data.mensagem && String(data.mensagem).length > 2000) {
      return NextResponse.json(
        { error: "mensagem muito longa" },
        { status: 400 }
      );
    }

    // Rate limit extra pra tipos "quentes" — leads/solicitações: 5/hora/IP
    const tiposQuentes: typeof data.tipo[] = [
      "enviou_lead",
      "solicitou_aluguel",
      "solicitou_compra",
      "simulou_financiamento",
    ];
    if (tiposQuentes.includes(data.tipo)) {
      const rlHot = rateLimit({
        key: `interesses-quentes:${ip}`,
        limit: 5,
        windowMs: 60 * 60 * 1000,
      });
      if (!rlHot.ok) {
        return NextResponse.json(
          { error: "Muitas solicitações. Tente novamente mais tarde." },
          { status: 429 }
        );
      }
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

    // Cliente autenticado opcional. clienteEmail vem SEMPRE do auth.email
    // (never confia em body) pra evitar spoof.
    const auth = await requireAuth();
    const cliente = auth.ok && auth.role === "cliente"
      ? { clienteId: auth.userId, clienteEmail: auth.email }
      : {};

    // Incrementa contador de views da moto pra ranking (não bloqueia)
    if (data.tipo === "visualizou") {
      Moto.updateOne(
        { _id: moto._id },
        { $inc: { viewCount: 1 } }
      ).catch(() => {});
    }

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
      ip: ip === "unknown" ? undefined : ip,
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

    // Validador local pra ObjectId — evita NoSQL operator injection via param
    const validarObjectId = (v: string | null): string | undefined => {
      if (!v || typeof v !== "string") return undefined;
      return mongoose.Types.ObjectId.isValid(v) ? v : undefined;
    };
    // clienteId pode ser UUID Supabase (string), só limitamos tamanho
    const sanitizarClienteId = (v: string | null): string | undefined => {
      if (!v || typeof v !== "string") return undefined;
      if (v.length > 64) return undefined;
      return v;
    };

    if (auth.role === "cliente") {
      query.clienteId = auth.userId;
    } else if (auth.role === "vendedor" || auth.role === "afiliado") {
      const clienteIdParam = sanitizarClienteId(searchParams.get("clienteId"));
      const motoIdParam = validarObjectId(searchParams.get("motoId"));
      if (clienteIdParam) query.clienteId = clienteIdParam;
      if (motoIdParam) query.motoId = motoIdParam;
    } else if (auth.role === "admin") {
      const clienteIdParam = sanitizarClienteId(searchParams.get("clienteId"));
      const motoIdParam = validarObjectId(searchParams.get("motoId"));
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
    if (desde) {
      const d = new Date(desde);
      if (!isNaN(d.getTime())) query.createdAt = { $gte: d };
    }

    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const skip = Math.max(0, Number(searchParams.get("skip")) || 0);

    const [interesses, total] = await Promise.all([
      Interesse.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(12_000),
      // Conta total só quando paginação é usada — economiza um round-trip
      skip > 0 || searchParams.get("withCount") === "1"
        ? Interesse.countDocuments(query).maxTimeMS(10_000)
        : Promise.resolve(undefined),
    ]);

    return NextResponse.json({
      interesses,
      ...(total !== undefined ? { total, hasMore: skip + limit < total } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
