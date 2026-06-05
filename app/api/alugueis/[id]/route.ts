import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Moto } from "@/lib/models/moto";
import { Notification } from "@/lib/models/notification";
import { requireAuth, requireRole } from "@/lib/auth/api-guards";
import { emitAuditLog } from "@/lib/audit/emit";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const aluguel = await Aluguel.findById(id).lean();
    if (!aluguel) {
      return NextResponse.json(
        { error: "Locação não encontrada" },
        { status: 404 }
      );
    }
    // cliente só vê os próprios; vendedor só os que originou; admin vê tudo
    if (auth.role === "cliente" && aluguel.clienteId !== auth.userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (auth.role === "vendedor" && aluguel.vendedorId !== auth.userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    return NextResponse.json({ aluguel });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Campos que vendedor pode editar (sem mexer em clienteId, motoId, comissões…)
const CAMPOS_EDITAVEIS = [
  "dataInicio",
  "dataFim",
  "dataDevolucao",
  "valorDiariaUsada",
  "valorSemanalUsada",
  "valorMensalUsada",
  "modalidadeAplicada",
  "diasContratados",
  "valorTotal",
  "caucao",
  "km_inicial",
  "km_final",
  "fotosInicio",
  "fotosFim",
  "observacoesInicio",
  "observacoesFim",
  "avarias",
  "custoTotalAvarias",
  "valorAReceberCaucao",
  "multaAtraso",
  "status",
  "observacoes",
] as const;

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const data = await req.json();

    // Whitelist
    const update: Record<string, unknown> = {};
    for (const k of CAMPOS_EDITAVEIS) {
      if (data[k] !== undefined) update[k] = data[k];
    }

    // Se km_final veio, marca dataDevolucao agora (compatibilidade legada)
    if (update.km_final && !update.dataDevolucao) {
      update.dataDevolucao = new Date();
    }
    if (update.status === "concluido" && !update.dataDevolucao) {
      update.dataDevolucao = new Date();
    }

    // vendedor só altera os próprios aluguéis
    const filter: Record<string, unknown> = { _id: id };
    if (auth.role === "vendedor") filter.vendedorId = auth.userId;

    // Pega estado anterior pra detectar transições que requerem sync de moto
    const antes = await Aluguel.findOne(filter).lean();
    if (!antes) {
      return NextResponse.json(
        { error: "Locação não encontrada" },
        { status: 404 }
      );
    }

    const aluguel = await Aluguel.findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!aluguel) {
      return NextResponse.json(
        { error: "Locação não encontrada" },
        { status: 404 }
      );
    }

    // Se status mudou pra cancelado ou concluido E estava ativo/atrasado,
    // libera a moto de volta pra "disponivel".
    const liberouMoto =
      (update.status === "cancelado" || update.status === "concluido") &&
      (antes.status === "ativo" || antes.status === "atrasado");
    if (liberouMoto) {
      await Moto.updateOne(
        { _id: aluguel.motoId, status: { $in: ["alugada", "reservada"] } },
        { $set: { status: "disponivel" } }
      ).catch(() => {});

      // Notifica cliente do cancelamento se foi cancelado
      if (update.status === "cancelado" && aluguel.clienteId) {
        Notification.create({
          destinatarioId: aluguel.clienteId,
          tipo: "aluguel",
          titulo: `Aluguel cancelado — ${aluguel.motoMarca ?? ""} ${aluguel.motoModelo}`.trim(),
          descricao: "Sua locação foi cancelada. Em caso de dúvidas, fale com o vendedor.",
          origemTipo: "aluguel",
          origemId: aluguel._id.toString(),
          link: "/dashboard",
          prioridade: "alta",
          lido: false,
          arquivado: false,
        }).catch(() => {});
      }
    }

    // Audit log: registra mudança no aluguel pra rastreabilidade.
    // Quando status mudou (concluído/cancelado/devolvido), as ações
    // específicas (cancelar/devolver/reativar) já têm seus próprios endpoints
    // dedicados — esse PATCH é o "outros editar" e fica como aluguel.update.
    emitAuditLog({
      acao: "aluguel.update",
      ator: auth.userId,
      atorRole: auth.role,
      alvoTipo: "aluguel",
      alvoId: String(id),
      alvoLabel: `${aluguel.clienteNome ?? "?"} · ${aluguel.motoMarca ?? ""} ${aluguel.motoModelo ?? ""}`.trim(),
      estadoAnterior: {
        status: antes.status,
        observacoes: antes.observacoes,
      },
      estadoNovo: update,
    });
    return NextResponse.json({ aluguel });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(["admin"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;

    // Pega o aluguel antes de deletar pra saber se precisa liberar a moto.
    const aluguel = await Aluguel.findByIdAndDelete(id).lean();
    if (!aluguel) {
      return NextResponse.json(
        { error: "Locação não encontrada" },
        { status: 404 }
      );
    }

    // Se a moto estava marcada como alugada por esse aluguel, libera.
    if (aluguel.status === "ativo" || aluguel.status === "atrasado") {
      await Moto.updateOne(
        { _id: aluguel.motoId, status: { $in: ["alugada", "reservada"] } },
        { $set: { status: "disponivel" } }
      ).catch(() => {});
    }

    // Delete-físico de aluguel é raro — usamos o mesmo audit type
    // "aluguel.cancelar" porque semanticamente é um cancelamento extremo.
    emitAuditLog({
      acao: "aluguel.cancelar",
      ator: auth.userId,
      atorRole: auth.role,
      alvoTipo: "aluguel",
      alvoId: String(id),
      alvoLabel: `${aluguel.clienteNome ?? "?"} · ${aluguel.motoMarca ?? ""} ${aluguel.motoModelo ?? ""}`.trim(),
      motivo: "delete físico (raro — admin removeu do banco)",
      estadoAnterior: {
        status: aluguel.status,
        valorTotal: aluguel.valorTotal,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
