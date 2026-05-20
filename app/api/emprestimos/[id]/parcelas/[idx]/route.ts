import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Emprestimo, recalcularStatus } from "@/lib/models/emprestimo";
import { requireRole } from "@/lib/auth/api-guards";
import { emitAuditLog } from "@/lib/audit/emit";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string; idx: string }>;
}

/**
 * PATCH /api/emprestimos/[id]/parcelas/[idx]
 *
 * Ações suportadas (action no body):
 *   - "pagar":     { action: "pagar", valorPago?: number, pagoEm?: ISO, observacao? }
 *   - "estornar":  { action: "estornar" }    → volta pra pendente
 *   - "postergar": { action: "postergar", novaData: ISO, observacao? }
 *
 * `idx` é o índice 0-based do array parcelas (não o numero da parcela 1..N).
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id, idx } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const parcelaIdx = parseInt(idx, 10);
    if (!Number.isFinite(parcelaIdx) || parcelaIdx < 0) {
      return NextResponse.json({ error: "Índice de parcela inválido" }, { status: 400 });
    }

    const body = await req.json();
    const action = String(body.action ?? "");
    if (!["pagar", "estornar", "postergar"].includes(action)) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    const doc = await Emprestimo.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Empréstimo não encontrado" }, { status: 404 });
    }
    if (parcelaIdx >= doc.parcelas.length) {
      return NextResponse.json({ error: "Parcela não encontrada" }, { status: 404 });
    }
    if (doc.status === "cancelado") {
      return NextResponse.json(
        { error: "Empréstimo cancelado — reative antes de mexer nas parcelas" },
        { status: 409 }
      );
    }

    const parcela = doc.parcelas[parcelaIdx];
    const before = { ...parcela };

    if (action === "pagar") {
      if (parcela.status === "paga") {
        return NextResponse.json(
          { error: "Parcela já paga — use estornar primeiro" },
          { status: 409 }
        );
      }
      const valorPago = Number.isFinite(Number(body.valorPago))
        ? Number(body.valorPago)
        : parcela.valor;
      const pagoEm = body.pagoEm ? new Date(body.pagoEm) : new Date();
      if (Number.isNaN(pagoEm.getTime())) {
        return NextResponse.json({ error: "Data de pagamento inválida" }, { status: 400 });
      }
      parcela.status = "paga";
      parcela.pagoEm = pagoEm;
      parcela.valorPago = valorPago;
      if (body.observacao) parcela.observacao = String(body.observacao).slice(0, 500);
      parcela.registradoPor = auth.userId;
    } else if (action === "estornar") {
      if (parcela.status !== "paga") {
        return NextResponse.json(
          { error: "Só faz sentido estornar parcela paga" },
          { status: 409 }
        );
      }
      parcela.status = "pendente";
      parcela.pagoEm = undefined;
      parcela.valorPago = undefined;
      parcela.registradoPor = auth.userId;
    } else if (action === "postergar") {
      const novaData = new Date(body.novaData);
      if (Number.isNaN(novaData.getTime())) {
        return NextResponse.json({ error: "Nova data inválida" }, { status: 400 });
      }
      if (parcela.status === "paga") {
        return NextResponse.json(
          { error: "Parcela paga não pode ser postergada — estorne primeiro" },
          { status: 409 }
        );
      }
      // Preserva data original na primeira postergação
      if (!parcela.vencimentoOriginal) {
        parcela.vencimentoOriginal = parcela.vencimento;
      }
      parcela.vencimento = novaData;
      parcela.status = "postergada";
      if (body.observacao) parcela.observacao = String(body.observacao).slice(0, 500);
      parcela.registradoPor = auth.userId;
    }

    // Marca parcelas vencidas (mantém "paga" e "postergada" intactas)
    const agora = new Date();
    for (const p of doc.parcelas) {
      if (p.status === "pendente" && p.vencimento < agora) {
        p.status = "atrasada";
      }
    }

    doc.status = recalcularStatus(doc);
    doc.markModified("parcelas");
    await doc.save();

    emitAuditLog({
      acao: `emprestimo.parcela.${action}`,
      ator: auth.userId,
      atorNome: auth.email,
      atorRole: "admin",
      alvoTipo: "emprestimo",
      alvoId: id,
      alvoLabel: `${doc.clienteNome} · parcela ${parcela.numero}/${doc.totalParcelas}`,
      estadoAnterior: before,
      estadoNovo: parcela,
    });

    return NextResponse.json({ emprestimo: doc.toObject() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
