import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { Venda } from "@/lib/models/venda";
import { Aluguel } from "@/lib/models/aluguel";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/conversao
 *
 * Funil simples dos últimos 30 dias: visualizações → leads "quentes" →
 * vendas + aluguéis concluídos. Vendedor vê só os próprios; admin tudo.
 */
export async function GET(req: Request) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const rangeRaw = searchParams.get("range") || "30d";
    const RANGES: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const dias = RANGES[rangeRaw] ?? 30;
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    // FilterQuery tipos do Mongoose 9 são muito estritos pra spreads —
    // usamos Record<string, unknown> e Mongoose castea no runtime.
    const interesseScope: Record<string, unknown> = {
      createdAt: { $gte: desde },
      ...(auth.role === "vendedor" ? { vendedorAtendeu: auth.userId } : {}),
    };
    const vendaScope: Record<string, unknown> = {
      data: { $gte: desde },
      status: "concluida",
      ...(auth.role === "vendedor" ? { vendedorId: auth.userId } : {}),
    };
    const alugScope: Record<string, unknown> = {
      dataInicio: { $gte: desde },
      ...(auth.role === "vendedor" ? { vendedorId: auth.userId } : {}),
    };

    const TIPOS_QUENTES = [
      "enviou_lead",
      "solicitou_aluguel",
      "solicitou_compra",
      "simulou_financiamento",
    ];

    const [todasInteresses, leadsQuentes, vendasCount, alugCount] =
      await Promise.all([
        Interesse.countDocuments(interesseScope as never),
        Interesse.countDocuments({
          ...interesseScope,
          tipo: { $in: TIPOS_QUENTES },
        } as never),
        Venda.countDocuments(vendaScope as never),
        Aluguel.countDocuments(alugScope as never),
      ]);

    const visualizacoes = todasInteresses;
    const leads = leadsQuentes;
    const conversoes = vendasCount + alugCount;
    const taxaLead = visualizacoes > 0 ? leads / visualizacoes : 0;
    const taxaConversao = leads > 0 ? conversoes / leads : 0;

    return NextResponse.json({
      janela: `${dias}d`,
      visualizacoes,
      leads,
      conversoes,
      vendas: vendasCount,
      alugueis: alugCount,
      taxaLead: Math.round(taxaLead * 10000) / 100, // pct com 2 casas
      taxaConversao: Math.round(taxaConversao * 10000) / 100,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
