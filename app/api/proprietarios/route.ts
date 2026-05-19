import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Proprietario } from "@/lib/models/proprietario";
import { proprietarioCreateSchema } from "@/lib/schemas";
import { requireRole } from "@/lib/auth/api-guards";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q");

    const query: Record<string, unknown> = {};
    if (search) {
      // Limita e escapa metacaracteres (anti-ReDoS e contra "$gt"-style injection)
      const termo = search.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { nome: { $regex: termo, $options: "i" } },
        { cpf: { $regex: termo, $options: "i" } },
        { telefone: { $regex: termo, $options: "i" } },
      ];
    }

    const proprietarios = await Proprietario.find(query)
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ proprietarios });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  // Rate limit por usuário (não IP — staff frequentemente compartilha NAT)
  const rl = rateLimit({
    key: `proprietarios-post:${auth.userId}`,
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas criações em sequência. Aguarde alguns minutos." },
      { status: 429 }
    );
  }
  try {
    await connectMongo();
    const raw = await req.json();
    const parsed = proprietarioCreateSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validação: ${issues}` },
        { status: 400 }
      );
    }
    const proprietario = await Proprietario.create(parsed.data);
    return NextResponse.json({ proprietario }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar proprietário";
    if (message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "Já existe um proprietário com esse CPF" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
