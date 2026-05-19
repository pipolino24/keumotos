import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Proprietario } from "@/lib/models/proprietario";
import { requireRole } from "@/lib/auth/api-guards";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"], req);
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
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  const rl = rateLimit({
    key: `proprietarios-write:${auth.userId}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas atualizações em sequência. Aguarde." },
      { status: 429 }
    );
  }
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

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin"], req);
  if (!auth.ok) return auth.response;
  const rl = rateLimit({
    key: `proprietarios-delete:${auth.userId}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas exclusões em sequência. Aguarde." },
      { status: 429 }
    );
  }
  try {
    await connectMongo();
    const { id } = await params;

    // Bloqueia delete se proprietário ainda tem motos vinculadas — evita
    // orfanizar motos (Moto.proprietarioId ficaria apontando pra nada).
    const { Moto } = await import("@/lib/models/moto");
    const temMoto = await Moto.exists({ proprietarioId: id });
    if (temMoto) {
      return NextResponse.json(
        {
          error:
            "Proprietário tem motos vinculadas — reatribua antes de deletar",
        },
        { status: 409 }
      );
    }

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
