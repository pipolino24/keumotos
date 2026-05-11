import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/lib/models/user";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectMongo();
    const { id } = await params;
    const user = await User.findById(id, { senhaHash: 0 }).lean();
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await connectMongo();
    const { id } = await params;
    const data = await req.json();

    const existing = await User.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const update: Record<string, unknown> = {};
    if (data.nome !== undefined) update.nome = String(data.nome).trim();
    if (data.email !== undefined)
      update.email = String(data.email).trim().toLowerCase();
    if (data.telefone !== undefined) update.telefone = String(data.telefone);
    if (data.cpf !== undefined) update.cpf = data.cpf || undefined;
    if (data.role !== undefined) update.role = data.role;
    if (data.cargoId !== undefined) update.cargoId = data.cargoId || null;
    if (Array.isArray(data.permissoes))
      update.permissoes = data.permissoes.filter(
        (p: unknown) => typeof p === "string"
      );
    if (data.status !== undefined) update.status = data.status;
    if (data.avatar !== undefined) update.avatar = data.avatar;
    if (data.endereco !== undefined) update.endereco = data.endereco;
    if (data.cidade !== undefined) update.cidade = data.cidade;
    if (data.estado !== undefined) update.estado = data.estado;

    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      projection: { senhaHash: 0 },
    }).lean();

    return NextResponse.json({ user });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao atualizar usuário";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await connectMongo();
    const { id } = await params;
    const user = await User.findByIdAndDelete(id).lean();
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao deletar usuário";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
