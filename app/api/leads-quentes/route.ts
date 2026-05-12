import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/leads-quentes
 * Agrega Interesses por clienteId (últimos 30 dias) e devolve os mais
 * engajados — ordem por (leads_quentes desc, total_interesses desc).
 *
 * Considera "quente" quem tem >=2 interesses na mesma moto OU >=1 lead/
 * solicitação/simulação. Cada item devolve telefone/nome quando disponíveis.
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const TIPOS_QUENTES = [
      "enviou_lead",
      "solicitou_aluguel",
      "solicitou_compra",
      "simulou_financiamento",
    ];

    // Vendedor só vê leads que ele atendeu OU clientes que tenham
    // venda/aluguel atribuída a ele. Admin vê tudo.
    const scope =
      auth.role === "vendedor"
        ? { vendedorAtendeu: auth.userId }
        : {};

    const rows = await Interesse.aggregate([
      {
        $match: {
          ...scope,
          createdAt: { $gte: desde },
          // só conta quem identificou (clienteId ou nome+telefone)
          $or: [
            { clienteId: { $exists: true, $ne: null } },
            { clienteNome: { $exists: true, $ne: null } },
          ],
        },
      },
      {
        $group: {
          _id: {
            clienteId: "$clienteId",
            clienteNome: "$clienteNome",
            clienteTelefone: "$clienteTelefone",
          },
          totalInteresses: { $sum: 1 },
          eventosQuentes: {
            $sum: {
              $cond: [{ $in: ["$tipo", TIPOS_QUENTES] }, 1, 0],
            },
          },
          motosDistintas: { $addToSet: "$motoId" },
          ultimoAt: { $max: "$createdAt" },
          ultimoTipo: { $last: "$tipo" },
          ultimaMoto: { $last: "$motoModelo" },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$eventosQuentes", 5] },
              "$totalInteresses",
              { $size: "$motosDistintas" },
            ],
          },
          motosCount: { $size: "$motosDistintas" },
        },
      },
      { $match: { score: { $gte: 3 } } }, // filtro mínimo
      { $sort: { score: -1, ultimoAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          clienteId: "$_id.clienteId",
          clienteNome: "$_id.clienteNome",
          clienteTelefone: "$_id.clienteTelefone",
          totalInteresses: 1,
          eventosQuentes: 1,
          motosCount: 1,
          ultimoAt: 1,
          ultimoTipo: 1,
          ultimaMoto: 1,
          score: 1,
        },
      },
    ]);

    return NextResponse.json({ leads: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
