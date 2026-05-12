import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Role } from "@/lib/models/role";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { requireAdmin } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const ativo = searchParams.get("ativo");

    const query: Record<string, unknown> = {};
    if (ativo !== null) query.ativo = ativo === "true";

    const roles = await Role.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ roles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const data = await req.json();

    if (!data.nome || data.nome.trim().length < 2) {
      return NextResponse.json(
        { error: "Nome do cargo deve ter pelo menos 2 caracteres" },
        { status: 400 }
      );
    }

    const permissoes = Array.isArray(data.permissoes)
      ? data.permissoes.filter((p: string) =>
          ALL_PERMISSIONS.includes(p as never)
        )
      : [];

    const role = await Role.create({
      nome: data.nome.trim(),
      descricao: data.descricao?.trim(),
      cor: data.cor || "#dc1f1f",
      permissoes,
      ativo: data.ativo !== false,
      sistema: false,
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar cargo";
    if (message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "Já existe um cargo com esse nome" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
