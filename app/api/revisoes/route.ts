import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Revisao } from "@/lib/models/revisao";
import { revisaoCreateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const motoId = searchParams.get("motoId");
    const tipo = searchParams.get("tipo");

    const query: Record<string, unknown> = {};
    if (motoId) query.motoId = motoId;
    if (tipo) query.tipo = tipo;

    const revisoes = await Revisao.find(query).sort({ data: -1 }).lean();
    return NextResponse.json({ revisoes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const raw = await req.json();
    const parsed = revisaoCreateSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validação: ${issues}` },
        { status: 400 }
      );
    }
    const revisao = await Revisao.create(parsed.data);
    return NextResponse.json({ revisao }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
