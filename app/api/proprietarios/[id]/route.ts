import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Proprietario } from "@/lib/models/proprietario";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const proprietario = await Proprietario.findById(id).lean();
    if (!proprietario) {
      return NextResponse.json(
        { error: "Proprietário não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ proprietario });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Campos editáveis via PATCH. Bloqueia tampering em createdAt/proprietarioId
// (FK reversa em Moto) e qualquer outro campo undocumented adicionado depois.
const CAMPOS_EDITAVEIS = [
  "nome",
  "cpf",
  "rg",
  "cnh",
  "dataNascimento",
  "email",
  "telefone",
  "whatsapp",
  "cep",
  "endereco",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "estado",
  "pixTipo",
  "pixChave",
  "banco",
  "agencia",
  "conta",
  "contaTipo",
  "cpfTitular",
  "observacoes",
] as const;

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const data = await req.json();

    const update: Record<string, unknown> = {};
    for (const k of CAMPOS_EDITAVEIS) {
      if (data[k] !== undefined) update[k] = data[k];
    }

    const proprietario = await Proprietario.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!proprietario) {
      return NextResponse.json(
        { error: "Proprietário não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ proprietario });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao atualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const proprietario = await Proprietario.findByIdAndDelete(id).lean();
    if (!proprietario) {
      return NextResponse.json(
        { error: "Proprietário não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
