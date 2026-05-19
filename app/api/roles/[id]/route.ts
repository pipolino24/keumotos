import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Role } from "@/lib/models/role";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { requireAdmin } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const role = await Role.findById(id).lean();
    if (!role) {
      return NextResponse.json({ error: "Cargo não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ role });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const data = await req.json();

    const existing = await Role.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Cargo não encontrado" }, { status: 404 });
    }
    if (existing.sistema) {
      return NextResponse.json(
        { error: "Cargos do sistema não podem ser editados" },
        { status: 403 }
      );
    }

    const update: Record<string, unknown> = {};
    if (data.nome) update.nome = data.nome.trim();
    if (data.descricao !== undefined) update.descricao = data.descricao?.trim();
    if (data.cor) update.cor = data.cor;
    if (data.ativo !== undefined) update.ativo = data.ativo;
    if (Array.isArray(data.permissoes)) {
      update.permissoes = data.permissoes.filter((p: string) =>
        ALL_PERMISSIONS.includes(p as never)
      );
    }

    const role = await Role.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    return NextResponse.json({ role });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar cargo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ error: "Cargo não encontrado" }, { status: 404 });
    }
    if (role.sistema) {
      return NextResponse.json(
        { error: "Cargos do sistema não podem ser removidos" },
        { status: 403 }
      );
    }
    await role.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar cargo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
