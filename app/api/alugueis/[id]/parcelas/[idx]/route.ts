import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { requireRole } from "@/lib/auth/api-guards";
import { calcularMultaJuros } from "@/lib/aluguel/parcelas";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["paga", "pendente"]).optional(),
  valorPago: z.number().min(0).optional(),
  formaPagamento: z
    .enum(["pix", "dinheiro", "transferencia", "cartao", "outro"])
    .optional(),
  pagoEm: z.union([z.string(), z.date()]).optional(),
  observacao: z.string().max(500).optional(),
});

interface Ctx {
  params: Promise<{ id: string; idx: string }>;
}

/**
 * PATCH /api/alugueis/[id]/parcelas/[idx]
 *
 * Marca uma parcela como paga (idx é 1-based — corresponde a parcela.numero).
 * Recalcula multa+juros server-side baseado em vencimento vs hoje pra
 * impedir cliente burlar valor enviando multa: 0 no body.
 *
 * Quando todas as parcelas estão pagas, atualiza parcelasPagas counter
 * e move proximaParcelaEm pra próxima pendente.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;

  try {
    await connectMongo();
    const { id, idx } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const numero = Number(idx);
    if (!Number.isInteger(numero) || numero < 1) {
      return NextResponse.json(
        { error: "número de parcela inválido" },
        { status: 400 }
      );
    }

    const raw = await req.json();
    const parsed = patchSchema.safeParse(raw);
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
    // Vendedor só pode mexer no próprio aluguel
    if (auth.role === "vendedor" && aluguel.vendedorId !== auth.userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const parcelas = aluguel.parcelasLocacao ?? [];
    const parcela = parcelas.find((p) => p.numero === numero);
    if (!parcela) {
      return NextResponse.json(
        { error: `Parcela ${numero} não encontrada` },
        { status: 404 }
      );
    }

    // Marcar como paga: recalcula multa/juros pelo servidor (cliente não
    // pode enviar valor falso)
    if (parsed.data.status === "paga") {
      const hoje = parsed.data.pagoEm
        ? new Date(parsed.data.pagoEm as string | Date)
        : new Date();
      const calc = calcularMultaJuros(
        { valor: parcela.valor, vencimento: parcela.vencimento },
        aluguel.multaPorAtrasoPercent ?? 10,
        aluguel.jurosDiaPercent ?? 2,
        hoje
      );
      parcela.status = "paga";
      parcela.pagoEm = hoje;
      parcela.valorPago = parsed.data.valorPago ?? calc.total;
      parcela.multa = calc.multa;
      parcela.juros = calc.juros;
      parcela.formaPagamento = parsed.data.formaPagamento;
      parcela.observacao = parsed.data.observacao;
      parcela.registradoPor = auth.userId;
      parcela.registradoEm = new Date();
    } else if (parsed.data.status === "pendente") {
      // Desfazer pagamento (caso de correção)
      parcela.status = "pendente";
      parcela.pagoEm = undefined;
      parcela.valorPago = undefined;
      parcela.multa = undefined;
      parcela.juros = undefined;
      parcela.formaPagamento = undefined;
    }

    // Recalcula contadores derivados
    aluguel.parcelasPagas = parcelas.filter((p) => p.status === "paga").length;
    const proxima = parcelas
      .filter((p) => p.status !== "paga")
      .sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime())[0];
    aluguel.proximaParcelaEm = proxima?.vencimento;

    await aluguel.save();

    return NextResponse.json({
      ok: true,
      parcela,
      parcelasPagas: aluguel.parcelasPagas,
      totalParcelas: parcelas.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
