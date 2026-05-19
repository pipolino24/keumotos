import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Venda } from "@/lib/models/venda";
import { Aluguel } from "@/lib/models/aluguel";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/vendas/comissao
 *
 * Resumo de comissão do vendedor logado (ou de qualquer vendedor pra admin
 * via ?vendedorId=). Mês corrente + total acumulado + breakdown por status.
 *
 * Vendedor: vê só própria. Admin: vê de qualquer.
 *
 * Query params: ?vendedorId (admin only), ?desde (ISO date, default 90d)
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);

    let vendedorId = auth.userId;
    if (auth.role === "admin") {
      const param = searchParams.get("vendedorId");
      if (param && typeof param === "string" && param.length < 64) {
        vendedorId = param;
      }
    }

    const desdeParam = searchParams.get("desde");
    const desde =
      desdeParam && !isNaN(new Date(desdeParam).getTime())
        ? new Date(desdeParam)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    // 4 queries paralelas, todas tolerantes a falha
    const settled = await Promise.allSettled([
      // Vendas concluídas no período (do vendedor)
      Venda.find({
        vendedorId,
        status: "concluida",
        data: { $gte: desde },
      })
        .select("data valorVendido comissao motoModelo motoMarca clienteNome status")
        .sort({ data: -1 })
        .limit(500)
        .lean()
        .maxTimeMS(12_000),
      // Aluguéis ativos (comissão referente)
      Aluguel.find({
        vendedorId,
        dataInicio: { $gte: desde },
      })
        .select("dataInicio valorTotal motoModelo motoMarca clienteNome status")
        .sort({ dataInicio: -1 })
        .limit(500)
        .lean()
        .maxTimeMS(12_000),
    ]);

    const vendas = settled[0].status === "fulfilled" ? settled[0].value : [];
    const alugueis = settled[1].status === "fulfilled" ? settled[1].value : [];

    const comissaoMesVendas = vendas
      .filter((v) => new Date(v.data) >= inicioMes)
      .reduce((s, v) => s + (v.comissao || 0), 0);
    const comissaoTotalVendas = vendas.reduce(
      (s, v) => s + (v.comissao || 0),
      0
    );
    // Comissão de aluguel: ainda não modelada; placeholder. Quando virar
    // estrutura real (ex: 10% do valor de cada aluguel concluído), entra aqui.

    return NextResponse.json({
      vendedorId,
      periodoDesde: desde.toISOString(),
      mesCorrente: {
        vendas: vendas.filter((v) => new Date(v.data) >= inicioMes).length,
        comissao: comissaoMesVendas,
      },
      acumulado: {
        vendas: vendas.length,
        comissao: comissaoTotalVendas,
        alugueis: alugueis.length,
      },
      historicoRecente: vendas.slice(0, 20).map((v) => ({
        data: v.data,
        moto: `${v.motoMarca ?? ""} ${v.motoModelo}`.trim(),
        cliente: v.clienteNome,
        valor: v.valorVendido,
        comissao: v.comissao,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
