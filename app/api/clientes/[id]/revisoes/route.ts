import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Venda } from "@/lib/models/venda";
import { Revisao } from "@/lib/models/revisao";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clientes/[id]/revisoes
 *
 * Histórico de revisões/manutenções das motos que o cliente comprou.
 * - Cliente: só vê as próprias (id === auth.userId)
 * - Admin/vendedor: vê de qualquer cliente (útil pra suporte)
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;

    // Cliente só consulta as próprias revisões
    if (auth.role === "cliente" && auth.userId !== id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (
      auth.role !== "cliente" &&
      auth.role !== "admin" &&
      auth.role !== "vendedor"
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Pega motos vendidas pra esse cliente (motoIds)
    const vendas = await Venda.find({ clienteId: id, status: "concluida" })
      .select("motoId motoModelo motoMarca data")
      .lean();
    if (!vendas.length) {
      return NextResponse.json({ revisoes: [], motos: [] });
    }

    const motoIds = vendas.map((v) => v.motoId);
    const revisoes = await Revisao.find({ motoId: { $in: motoIds } })
      .sort({ data: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      revisoes,
      motos: vendas.map((v) => ({
        motoId: String(v.motoId),
        motoMarca: v.motoMarca,
        motoModelo: v.motoModelo,
        dataCompra: v.data,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
