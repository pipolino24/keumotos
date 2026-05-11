import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Proprietario } from "@/lib/models/proprietario";
import { proprietarioCreateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q");

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { nome: { $regex: search, $options: "i" } },
        { cpf: { $regex: search, $options: "i" } },
        { telefone: { $regex: search, $options: "i" } },
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
