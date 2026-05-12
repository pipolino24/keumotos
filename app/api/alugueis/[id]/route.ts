import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { requireAuth, requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const aluguel = await Aluguel.findById(id).lean();
    if (!aluguel) {
      return NextResponse.json(
        { error: "Locação não encontrada" },
        { status: 404 }
      );
    }
    // cliente só vê os próprios; vendedor só os que originou; admin vê tudo
    if (auth.role === "cliente" && aluguel.clienteId !== auth.userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (auth.role === "vendedor" && aluguel.vendedorId !== auth.userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    return NextResponse.json({ aluguel });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const data = await req.json();

    // Se km_final foi passado, marca como dataDevolucao agora
    if (data.km_final && !data.dataDevolucao) {
      data.dataDevolucao = new Date();
    }
    // Se status virou "concluido" e não veio dataDevolucao, registra
    if (data.status === "concluido" && !data.dataDevolucao) {
      data.dataDevolucao = new Date();
    }

    // vendedor só altera os próprios aluguéis
    const filter: Record<string, unknown> = { _id: id };
    if (auth.role === "vendedor") filter.vendedorId = auth.userId;

    const aluguel = await Aluguel.findOneAndUpdate(filter, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!aluguel) {
      return NextResponse.json(
        { error: "Locação não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ aluguel });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(["admin"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const aluguel = await Aluguel.findByIdAndDelete(id).lean();
    if (!aluguel) {
      return NextResponse.json(
        { error: "Locação não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
