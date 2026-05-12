import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/interesses/cold-leads
 *
 * Lista Interesses esfriados — clientes identificados que demonstraram
 * interesse mas ninguém ainda atendeu nas últimas 72h. Admin vê todos;
 * vendedor vê os "livres" (sem vendedorAtendeu) que pode puxar pra si
 * via PATCH /api/interesses/[id].
 *
 * Filtra apenas tipos quentes (lead/solicitação/simulação) por padrão,
 * porque pura visualização não é actionable.
 *
 * Params: ?dias=3 (default), ?limit=50 (max 100)
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const diasRaw = Number(searchParams.get("dias"));
    const dias =
      Number.isFinite(diasRaw) && diasRaw > 0 && diasRaw <= 90
        ? diasRaw
        : 3;
    const limitRaw = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), 100)
        : 50;

    const limite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    const TIPOS_QUENTES = [
      "enviou_lead",
      "solicitou_aluguel",
      "solicitou_compra",
      "simulou_financiamento",
      "favoritou",
    ];

    const query: Record<string, unknown> = {
      createdAt: { $lte: limite },
      tipo: { $in: TIPOS_QUENTES },
      $and: [
        // Não atendido ainda
        {
          $or: [
            { vendedorAtendeu: { $exists: false } },
            { vendedorAtendeu: null },
            { vendedorAtendeu: "" },
          ],
        },
        // Tem como falar com o cliente
        {
          $or: [
            { clienteId: { $exists: true, $ne: null } },
            { clienteTelefone: { $exists: true, $ne: null } },
          ],
        },
        // Não convertido nem perdido
        {
          $or: [
            { resultado: { $exists: false } },
            { resultado: null },
            { resultado: "em-atendimento" },
          ],
        },
      ],
    };

    const interesses = await Interesse.find(query)
      .sort({ createdAt: 1 }) // mais antigos primeiro (esfriaram mais)
      .limit(limit)
      .lean();

    return NextResponse.json({
      interesses,
      janela: `${dias}d`,
      total: interesses.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
