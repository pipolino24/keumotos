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
 *   - "postergar": { action: "postergar", novaData: ISO, observacao?,
 *                    acrescimo?: number, motivoAcrescimo?: string }
 *                  → opcionalmente soma juros/multa naquela parcela.
 *                  Valor extra acumula em `acrescimo` (suporta postergações
 *                  múltiplas). `valorTotal` do empréstimo é recalculado.
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
    // before/snapshot pro audit log — `as Record` faz o cast pro tipo do
    // emitAuditLog (IParcelaDoc tem campos opcionais mas o audit aceita unknown).
    const before = { ...parcela } as Record<string, unknown>;

    if (action === "pagar") {
      if (parcela.status === "paga") {
        return NextResponse.json(
          { error: "Parcela já paga — use estornar primeiro" },
          { status: 409 }
        );
      }
      const valorPagoRaw = Number(body.valorPago);
      const valorPago = Number.isFinite(valorPagoRaw)
        ? valorPagoRaw
        : parcela.valor;
      // Pagamento parcial é OK (valorPago < valor), pagamento extra também
      // (cliente pagou juros de mora), mas valor <= 0 é erro de input.
      if (!Number.isFinite(valorPago) || valorPago < 0) {
        return NextResponse.json(
          { error: "Valor pago deve ser >= 0" },
          { status: 400 }
        );
      }
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
      // Postergar pra data passada não faz sentido (já estaria atrasada
      // imediatamente). Antecipar tem outro fluxo — pagar a parcela.
      const novaDataDia = new Date(novaData);
      novaDataDia.setHours(0, 0, 0, 0);
      const hojeD = new Date();
      hojeD.setHours(0, 0, 0, 0);
      if (novaDataDia < hojeD) {
        return NextResponse.json(
          { error: "Nova data não pode ser anterior a hoje" },
          { status: 400 }
        );
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

      // Acréscimo opcional (juros/multa por adiamento)
      const acrescimoRaw = Number(body.acrescimo);
      if (Number.isFinite(acrescimoRaw) && acrescimoRaw > 0) {
        // Snapshot do valor pré-acréscimo na primeira vez
        if (parcela.valorOriginal === undefined || parcela.valorOriginal === null) {
          parcela.valorOriginal = parcela.valor;
        }
        // Soma cumulativa — postergações múltiplas empilham acréscimo
        const acrescimoAtual = parcela.acrescimo ?? 0;
        const novoAcrescimo = Math.round((acrescimoAtual + acrescimoRaw) * 100) / 100;
        parcela.acrescimo = novoAcrescimo;
        parcela.valor =
          Math.round(((parcela.valorOriginal ?? 0) + novoAcrescimo) * 100) / 100;
        if (body.motivoAcrescimo) {
          parcela.motivoAcrescimo = String(body.motivoAcrescimo).slice(0, 300);
        }
      }
    }

    // Marca parcelas vencidas (mantém "paga" e "postergada" intactas)
    const agora = new Date();
    for (const p of doc.parcelas) {
      if (p.status === "pendente" && p.vencimento < agora) {
        p.status = "atrasada";
      }
    }

    // Recalcula totais do empréstimo a partir das parcelas (qualquer acréscimo
    // em parcela vira aumento de valorTotal + juros denormalizados).
    const novoTotal =
      Math.round(doc.parcelas.reduce((acc, p) => acc + p.valor, 0) * 100) / 100;
    doc.valorTotal = novoTotal;
    doc.juros = Math.round((novoTotal - doc.valorEmprestado) * 100) / 100;
    doc.taxa =
      doc.valorEmprestado > 0
        ? Math.round((doc.juros / doc.valorEmprestado) * 10000) / 100
        : 0;

    doc.status = recalcularStatus(doc);
    doc.markModified("parcelas");
    await doc.save();

    // Mapeia action pra literal AcaoAudit (template literal não infere union)
    const acaoMap = {
      pagar: "emprestimo.parcela.pagar",
      estornar: "emprestimo.parcela.estornar",
      postergar: "emprestimo.parcela.postergar",
    } as const;
    emitAuditLog({
      acao: acaoMap[action as keyof typeof acaoMap],
      ator: auth.userId,
      atorNome: auth.email,
      atorRole: "admin",
      alvoTipo: "emprestimo",
      alvoId: id,
      alvoLabel: `${doc.clienteNome} · parcela ${parcela.numero}/${doc.totalParcelas}`,
      estadoAnterior: before,
      estadoNovo: { ...parcela } as Record<string, unknown>,
    });

    return NextResponse.json({ emprestimo: doc.toObject() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
