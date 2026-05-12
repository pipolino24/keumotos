import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Contato } from "@/lib/models/contato";
import { requireRole } from "@/lib/auth/api-guards";
import { emitAuditLog } from "@/lib/audit/emit";

function invalidId(id: string) {
  return !mongoose.Types.ObjectId.isValid(id);
}

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    if (invalidId(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const contato = await Contato.findById(id).lean();
    if (!contato) {
      return NextResponse.json(
        { error: "Contato não encontrado" },
        { status: 404 }
      );
    }
    // Pool compartilhado: qualquer staff vê qualquer contato.
    return NextResponse.json({ contato });
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
    if (invalidId(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const data = await req.json();

    // Pool compartilhado: qualquer staff pode editar qualquer contato.

    // Whitelist de campos que podem ser editados via PATCH
    const allowed = [
      "nome",
      "telefone",
      "email",
      "origem",
      "interesse",
      "motoInteresse",
      "observacoes",
      "status",
      "vendedorResponsavel",
      "ultimoContato",
    ] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) update[key] = data[key];
    }

    const contato = await Contato.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!contato) {
      return NextResponse.json(
        { error: "Contato não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ contato });
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
    if (invalidId(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const contato = await Contato.findByIdAndDelete(id).lean();
    if (!contato) {
      return NextResponse.json(
        { error: "Contato não encontrado" },
        { status: 404 }
      );
    }
    emitAuditLog({
      acao: "contato.delete",
      ator: auth.userId,
      atorRole: auth.role,
      alvoTipo: "contato",
      alvoId: id,
      alvoLabel: contato.nome || contato.email || id,
      estadoAnterior: {
        nome: contato.nome,
        status: contato.status,
        vendedorResponsavel: contato.vendedorResponsavel,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
