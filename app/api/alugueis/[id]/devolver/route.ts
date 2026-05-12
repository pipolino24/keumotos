import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Moto } from "@/lib/models/moto";
import { Notification } from "@/lib/models/notification";
import { aluguelDevolucaoSchema } from "@/lib/schemas";
import { requireRole } from "@/lib/auth/api-guards";
import { emitAuditLog } from "@/lib/audit/emit";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/alugueis/[id]/devolver
 *
 * Registra a devolução de uma moto alugada — atualização ATÔMICA de
 * aluguel + moto via sessão Mongo (Atlas é replica set, tem transação).
 * Se a sessão não estiver disponível por algum motivo, faz fallback
 * com rollback manual best-effort.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const raw = await req.json();
    const parsed = aluguelDevolucaoSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validação: ${issues}` },
        { status: 400 }
      );
    }

    const aluguel = await Aluguel.findById(id);
    if (!aluguel) {
      return NextResponse.json(
        { error: "Aluguel não encontrado" },
        { status: 404 }
      );
    }
    if (aluguel.status === "concluido") {
      return NextResponse.json(
        { error: "Aluguel já foi devolvido" },
        { status: 409 }
      );
    }
    // Pool compartilhado: qualquer staff pode concluir qualquer contrato.

    const data = parsed.data;
    const custoTotalAvarias = data.avarias.reduce(
      (s, a) => s + (a.custoEstimado ?? 0),
      0
    );
    const multaAtraso = data.multaAtraso ?? 0;
    const valorAReceberCaucao = Math.max(
      0,
      aluguel.caucao - custoTotalAvarias - multaAtraso
    );
    const novoStatusMoto =
      data.avarias.length > 0 ? "manutencao" : "disponivel";

    const aluguelUpdate = {
      km_final: data.km_final,
      fotosFim: data.fotosFim,
      observacoesFim: data.observacoesFim,
      avarias: data.avarias.map((a) => ({
        ...a,
        registradoEm: new Date(),
      })),
      custoTotalAvarias,
      multaAtraso,
      valorAReceberCaucao,
      dataDevolucao: data.dataDevolucao
        ? new Date(data.dataDevolucao)
        : new Date(),
      status: "concluido" as const,
    };

    const motoUpdate = {
      status: novoStatusMoto,
      km: data.km_final,
    };

    // Caminho preferido: transação Mongo (Atlas é replica set)
    let session: mongoose.ClientSession | undefined;
    try {
      session = await mongoose.startSession();
      const sess = session;
      await session.withTransaction(async () => {
        await Aluguel.updateOne({ _id: id }, aluguelUpdate, { session: sess });
        await Moto.updateOne(
          { _id: aluguel.motoId },
          motoUpdate,
          { session: sess }
        );
      });
    } catch (txErr) {
      // Fallback (cluster standalone): rollback manual em caso de falha
      if (session) await session.endSession().catch(() => {});
      session = undefined;
      const statusAnterior = aluguel.status;
      Object.assign(aluguel, aluguelUpdate);
      await aluguel.save();
      try {
        await Moto.findByIdAndUpdate(aluguel.motoId, motoUpdate, {
          runValidators: true,
        });
      } catch (motoErr) {
        // Reverte aluguel se moto falhou — best-effort
        aluguel.status = statusAnterior;
        await aluguel.save().catch(() => {});
        throw motoErr;
      }
      // Se chegou aqui, conseguiu fora da transação — segue
      void txErr;
    } finally {
      if (session) await session.endSession().catch(() => {});
    }

    const aluguelFinal = await Aluguel.findById(id).lean();

    // Notifica cliente que a devolução foi confirmada (com resumo financeiro)
    if (aluguel.clienteId) {
      const valorRetorno = valorAReceberCaucao;
      const descricao = custoTotalAvarias > 0
        ? `Avarias: R$ ${custoTotalAvarias}. Caução a devolver: R$ ${valorRetorno}.`
        : `Sem avarias. Caução integral a devolver: R$ ${valorRetorno}.`;
      Notification.create({
        destinatarioId: aluguel.clienteId,
        tipo: "aluguel",
        titulo: `Devolução confirmada — ${aluguel.motoMarca ?? ""} ${aluguel.motoModelo}`.trim(),
        descricao,
        origemTipo: "aluguel",
        origemId: aluguel._id.toString(),
        link: "/dashboard",
        prioridade: "normal",
        lido: false,
        arquivado: false,
      }).catch(() => {});
    }

    // Audit trail — devolução com refund é evento financeiro sensível
    emitAuditLog({
      acao: "aluguel.devolver",
      ator: auth.userId,
      atorRole: auth.role,
      alvoTipo: "aluguel",
      alvoId: id,
      alvoLabel: `${aluguel.motoMarca ?? ""} ${aluguel.motoModelo}`.trim() || id,
      estadoNovo: {
        custoTotalAvarias,
        multaAtraso,
        valorAReceberCaucao,
        novoStatusMoto,
      },
    });

    return NextResponse.json({
      aluguel: aluguelFinal,
      resumoFinanceiro: {
        custoTotalAvarias,
        multaAtraso,
        caucao: aluguel.caucao,
        valorAReceberCaucao,
      },
      motoNovoStatus: novoStatusMoto,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao registrar devolução";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
