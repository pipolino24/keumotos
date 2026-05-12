import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { requireAuth, requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

const RESULTADOS_VALIDOS = new Set([
  "convertido",
  "perdido",
  "em-atendimento",
]);

/**
 * PATCH /api/interesses/[id]
 *
 * Staff marca um Interesse como atendido — registra o vendedor que atendeu,
 * timestamp e resultado. Usado pelo widget "Interesses ativos" no dashboard.
 *
 * Body: { resultado: "convertido" | "perdido" | "em-atendimento", nota?: string }
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const data = await req.json();

    if (!RESULTADOS_VALIDOS.has(data.resultado)) {
      return NextResponse.json(
        { error: "resultado inválido" },
        { status: 400 }
      );
    }
    if (data.mensagem && String(data.mensagem).length > 2000) {
      return NextResponse.json(
        { error: "mensagem muito longa" },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {
      resultado: data.resultado,
      vendedorAtendeu: auth.userId,
      atendidoEm: new Date(),
    };
    if (data.mensagem) update.mensagem = String(data.mensagem).slice(0, 2000);

    const interesse = await Interesse.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!interesse) {
      return NextResponse.json(
        { error: "Interesse não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ interesse });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/interesses/[id]
 *
 * Cliente pode "remover" seu próprio interesse (soft via resultado=perdido).
 * Admin pode hard-delete.
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;

    if (auth.role === "admin") {
      const interesse = await Interesse.findByIdAndDelete(id).lean();
      if (!interesse) {
        return NextResponse.json(
          { error: "Interesse não encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, deleted: true });
    }

    // Cliente: só pode cancelar os próprios (soft delete via resultado)
    if (auth.role === "cliente") {
      const interesse = await Interesse.findOneAndUpdate(
        { _id: id, clienteId: auth.userId },
        { resultado: "perdido" },
        { new: true }
      ).lean();
      if (!interesse) {
        return NextResponse.json(
          { error: "Interesse não encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, cancelled: true });
    }

    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
