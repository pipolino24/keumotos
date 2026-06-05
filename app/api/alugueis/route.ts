import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Moto } from "@/lib/models/moto";
import { Notification } from "@/lib/models/notification";
import { Interesse } from "@/lib/models/interesse";
import { aluguelCreateSchema } from "@/lib/schemas";
import { requireAuth, requireRole } from "@/lib/auth/api-guards";
import { gerarParcelasLocacao } from "@/lib/aluguel/parcelas";
import { emitAuditLog } from "@/lib/audit/emit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  // Defesa em profundidade: bloqueia se userId sumir do payload por algum
  // motivo. Sem isso, query falha para `{ clienteId: undefined }` que
  // casaria com docs sem clienteId (vazamento de aluguéis órfãos).
  if (!auth.userId || typeof auth.userId !== "string") {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const vendedorIdParam = searchParams.get("vendedorId");
    const status = searchParams.get("status");
    const clienteIdParam = searchParams.get("clienteId");
    const motoId = searchParams.get("motoId");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const query: Record<string, unknown> = {};
    if (auth.role === "admin") {
      if (vendedorIdParam) query.vendedorId = vendedorIdParam;
      if (clienteIdParam) query.clienteId = clienteIdParam;
    } else if (auth.role === "vendedor") {
      query.vendedorId = auth.userId;
    } else if (auth.role === "cliente") {
      query.clienteId = auth.userId;
    } else {
      return NextResponse.json({ alugueis: [] });
    }
    if (status) query.status = status;
    if (motoId) query.motoId = motoId;
    if (dataInicio || dataFim) {
      const range: Record<string, Date> = {};
      if (dataInicio) range.$gte = new Date(dataInicio);
      if (dataFim) range.$lte = new Date(dataFim);
      query.dataInicio = range;
    }

    const alugueis = await Aluguel.find(query)
      .sort({ dataInicio: -1 })
      .limit(500)
      .lean()
      .maxTimeMS(15_000);
    return NextResponse.json({ alugueis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const raw = await req.json();
    const parsed = aluguelCreateSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validação: ${issues}` },
        { status: 400 }
      );
    }

    // Verifica disponibilidade da moto antes de criar — evita double-booking.
    const motoIdStr = String(parsed.data.motoId);
    if (!mongoose.Types.ObjectId.isValid(motoIdStr)) {
      return NextResponse.json({ error: "motoId inválido" }, { status: 400 });
    }

    // Vendedor só pode criar locação em nome próprio
    if (auth.role !== "admin") {
      parsed.data.vendedorId = auth.userId;
    }

    // Lock atômico: tenta marcar moto como "alugada" se está disponivel OU
    // reservada (reservada também é elegível pra fechar aluguel).
    const lock = await Moto.findOneAndUpdate(
      { _id: motoIdStr, status: { $in: ["disponivel", "reservada"] } },
      { $set: { status: "alugada" } },
      { new: false }
    )
      .select("status modelo marca")
      .lean();
    if (!lock) {
      // Verifica se moto existe pra mensagem amigável
      const existe = await Moto.exists({ _id: motoIdStr });
      if (!existe) {
        return NextResponse.json(
          { error: "Moto não encontrada" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Moto não está disponível no momento" },
        { status: 409 }
      );
    }

    // === Geração de parcelas ===
    // Quando valorParcela + numeroParcelas + (cicloDias OU frequenciaParcela)
    // chegam preenchidos, geramos automaticamente a lista detalhada de
    // cobranças. Isso evita que o backend dependa do front pra calcular
    // vencimentos (mais consistente + permite locação criada via API direta).
    const dadosAluguel: Record<string, unknown> = { ...parsed.data };
    const cicloDias =
      parsed.data.cicloDias ??
      (parsed.data.frequenciaParcela === "semanal"
        ? 7
        : parsed.data.frequenciaParcela === "quinzenal"
          ? 15
          : parsed.data.frequenciaParcela === "mensal"
            ? 30
            : undefined);

    if (
      typeof parsed.data.valorParcela === "number" &&
      parsed.data.valorParcela > 0 &&
      typeof parsed.data.numeroParcelas === "number" &&
      parsed.data.numeroParcelas > 0 &&
      cicloDias &&
      cicloDias > 0
    ) {
      const inicio = new Date(parsed.data.dataInicio as string | Date);
      if (!isNaN(inicio.getTime())) {
        dadosAluguel.parcelasLocacao = gerarParcelasLocacao({
          dataInicio: inicio,
          numParcelas: parsed.data.numeroParcelas,
          cicloDias,
          valorParcela: parsed.data.valorParcela,
        });
        dadosAluguel.cicloDias = cicloDias;
        // Próxima parcela = primeira gerada (vence em dataInicio + cicloDias)
        const primeira = (dadosAluguel.parcelasLocacao as Array<{ vencimento: Date }>)[0];
        if (primeira) {
          dadosAluguel.proximaParcelaEm = primeira.vencimento;
        }
      }
    }

    let aluguel;
    try {
      aluguel = await Aluguel.create(dadosAluguel);
    } catch (createErr) {
      // Reverte lock se a criação falhou — best-effort
      await Moto.updateOne(
        { _id: motoIdStr, status: "alugada" },
        { $set: { status: "disponivel" } }
      ).catch(() => {});
      throw createErr;
    }

    // Notifica o cliente que tem aluguel ativo
    if (aluguel.clienteId) {
      const fim = new Date(aluguel.dataFim).toLocaleDateString("pt-BR");
      // Entrada é opcional. Só mostra a linha se >0 pra não exibir
      // "Entrada: R$ 0" no app/email do cliente. Campo `caucao` no DB é
      // o nome legado — semanticamente vira "entrada" pra cliente.
      const caucaoNum =
        typeof aluguel.caucao === "number" ? aluguel.caucao : 0;
      const linhaCaucao =
        caucaoNum > 0
          ? ` Entrada: ${caucaoNum.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}.`
          : "";
      Notification.create({
        destinatarioId: aluguel.clienteId,
        tipo: "aluguel",
        titulo: `Aluguel confirmado — ${aluguel.motoMarca ?? ""} ${aluguel.motoModelo}`.trim(),
        descricao: `Devolução prevista para ${fim}.${linhaCaucao}`,
        origemTipo: "aluguel",
        origemId: aluguel._id.toString(),
        link: "/dashboard",
        prioridade: "alta",
        lido: false,
        arquivado: false,
      }).catch(() => {});

      // Auto-converte Interesses pendentes do cliente nessa moto → "convertido"
      Interesse.updateMany(
        {
          clienteId: aluguel.clienteId,
          motoId: aluguel.motoId,
          resultado: { $ne: "convertido" },
        },
        {
          $set: {
            resultado: "convertido",
            vendedorAtendeu: parsed.data.vendedorId,
            atendidoEm: new Date(),
          },
        }
      ).catch(() => {});
    }

    emitAuditLog({
      acao: "aluguel.create",
      ator: auth.userId,
      atorRole: auth.role,
      alvoTipo: "aluguel",
      alvoId: String(aluguel._id),
      alvoLabel: `${aluguel.clienteNome ?? "?"} · ${aluguel.motoMarca ?? ""} ${
        aluguel.motoModelo ?? ""
      }`.trim(),
      estadoNovo: {
        status: aluguel.status,
        valorTotal: aluguel.valorTotal,
        dataInicio: aluguel.dataInicio,
        dataFim: aluguel.dataFim,
      },
    });
    return NextResponse.json({ aluguel }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao registrar locação";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
