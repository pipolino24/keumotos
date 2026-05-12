import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";
import { Interesse } from "@/lib/models/interesse";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/motos/ranking
 * Top motos por engajamento: viewCount + interesses agregados.
 * Só staff vê. Limit padrão 10.
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    // Top motos por viewCount
    const topMotos = await Moto.find(
      {},
      {
        marca: 1,
        modelo: 1,
        anoModelo: 1,
        viewCount: 1,
        valorAnunciado: 1,
        status: 1,
        destaque: 1,
        fotos: { $slice: 1 },
      }
    )
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Agrega contagens de Interesse por motoId nas últimas 30 dias
    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const interesseStats = await Interesse.aggregate([
      { $match: { createdAt: { $gte: desde } } },
      {
        $group: {
          _id: "$motoId",
          totalInteresses: { $sum: 1 },
          leads: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$tipo",
                    [
                      "enviou_lead",
                      "solicitou_aluguel",
                      "solicitou_compra",
                      "simulou_financiamento",
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
    const statsMap = new Map(
      interesseStats.map((s) => [
        String(s._id),
        { totalInteresses: s.totalInteresses, leads: s.leads },
      ])
    );

    const result = topMotos.map((m) => ({
      ...m,
      _id: String(m._id),
      interesses30d: statsMap.get(String(m._id))?.totalInteresses ?? 0,
      leads30d: statsMap.get(String(m._id))?.leads ?? 0,
    }));

    return NextResponse.json({ motos: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
