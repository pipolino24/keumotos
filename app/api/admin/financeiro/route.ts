import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Venda } from "@/lib/models/venda";
import { Aluguel } from "@/lib/models/aluguel";
import { requireAdmin } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/financeiro
 *
 * Agregado executivo pra admin: receita do mês, comissões pagas, parcelas
 * pendentes (parcelado-loja), aluguéis ativos (receita prevista). Apenas
 * admin acessa — dados consolidados de toda a operação.
 *
 * Params: ?range=7d|30d|90d (default 30d).
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const rangeRaw = searchParams.get("range") || "30d";
    const RANGES: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const dias = RANGES[rangeRaw] ?? 30;
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    // Receita: soma de vendas concluídas + total de aluguéis (qualquer status,
    // representando contrato fechado).
    const [vendasAgreg, alugAgreg, vendasParcelado] = await Promise.all([
      Venda.aggregate([
        {
          $match: {
            status: "concluida",
            data: { $gte: desde },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            receita: { $sum: "$valorVendido" },
            comissoes: { $sum: "$comissao" },
            ticketMedio: { $avg: "$valorVendido" },
          },
        },
      ]),
      Aluguel.aggregate([
        {
          $match: {
            status: { $in: ["ativo", "atrasado", "concluido"] },
            dataInicio: { $gte: desde },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            receita: { $sum: "$valorTotal" },
            ativos: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["ativo", "atrasado"]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      // Parcelas em aberto (parcelado-loja) — projeção de receita futura
      Venda.aggregate([
        {
          $match: {
            status: "concluida",
            "pagamentos.forma": "parcelado-loja",
          },
        },
        { $unwind: "$pagamentos" },
        {
          $match: { "pagamentos.forma": "parcelado-loja" },
        },
        {
          $group: {
            _id: null,
            parcelasPendentes: {
              $sum: {
                $subtract: [
                  { $ifNull: ["$pagamentos.parcelasLoja", 0] },
                  { $ifNull: ["$pagamentos.parcelasPagasLoja", 0] },
                ],
              },
            },
            valorPendente: {
              $sum: {
                $multiply: [
                  {
                    $subtract: [
                      { $ifNull: ["$pagamentos.parcelasLoja", 0] },
                      { $ifNull: ["$pagamentos.parcelasPagasLoja", 0] },
                    ],
                  },
                  { $ifNull: ["$pagamentos.valorParcelaLoja", 0] },
                ],
              },
            },
          },
        },
      ]),
    ]);

    const vendas = vendasAgreg[0] ?? {
      count: 0,
      receita: 0,
      comissoes: 0,
      ticketMedio: 0,
    };
    const alugueis = alugAgreg[0] ?? { count: 0, receita: 0, ativos: 0 };
    const parcelado = vendasParcelado[0] ?? {
      parcelasPendentes: 0,
      valorPendente: 0,
    };

    const receitaTotal = (vendas.receita || 0) + (alugueis.receita || 0);
    const margemBruta = receitaTotal - (vendas.comissoes || 0);

    return NextResponse.json({
      janela: `${dias}d`,
      vendas: {
        count: vendas.count || 0,
        receita: vendas.receita || 0,
        comissoes: vendas.comissoes || 0,
        ticketMedio: Math.round((vendas.ticketMedio || 0) * 100) / 100,
      },
      alugueis: {
        count: alugueis.count || 0,
        receita: alugueis.receita || 0,
        ativos: alugueis.ativos || 0,
      },
      parcelado: {
        parcelasPendentes: parcelado.parcelasPendentes || 0,
        valorPendente: parcelado.valorPendente || 0,
      },
      receitaTotal,
      margemBruta,
      margemPct:
        receitaTotal > 0
          ? Math.round((margemBruta / receitaTotal) * 10000) / 100
          : 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
