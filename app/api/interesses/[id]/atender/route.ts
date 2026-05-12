import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/interesses/[id]/atender
 *
 * Vendedor "puxa" um lead frio pra si — atribui vendedorAtendeu=auth.userId
 * e atendidoEm=now. Só funciona se ainda não tem atendente (lock implícito).
 * Admin pode reatribuir.
 */
export async function POST(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;

    // Pre-check: bloqueia atender Interesse anônimo (sem clienteId nem
    // telefone nem nome). Vendedor não tem como contatar.
    const preCheck = await Interesse.findById(id)
      .select("clienteId clienteNome clienteTelefone")
      .lean();
    if (!preCheck) {
      return NextResponse.json(
        { error: "Interesse não encontrado" },
        { status: 404 }
      );
    }
    if (
      !preCheck.clienteId &&
      !preCheck.clienteNome &&
      !preCheck.clienteTelefone
    ) {
      return NextResponse.json(
        { error: "Interesse anônimo — sem como contatar o cliente" },
        { status: 400 }
      );
    }

    // Pool compartilhado: qualquer staff pode atender (ou puxar) qualquer
    // interesse. Sem lock — staff alinha entre si quem fica responsável.
    const filter: Record<string, unknown> = { _id: id };

    const interesse = await Interesse.findOneAndUpdate(
      filter,
      {
        $set: {
          vendedorAtendeu: auth.userId,
          atendidoEm: new Date(),
          resultado: "em-atendimento",
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!interesse) {
      // Pode ser que outro vendedor pegou antes ou ID inválido
      return NextResponse.json(
        { error: "Interesse não disponível pra atender" },
        { status: 409 }
      );
    }

    return NextResponse.json({ interesse });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
