import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { aluguelCreateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const vendedorId = searchParams.get("vendedorId");
    const status = searchParams.get("status");
    const clienteId = searchParams.get("clienteId");
    const motoId = searchParams.get("motoId");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const query: Record<string, unknown> = {};
    if (vendedorId) query.vendedorId = vendedorId;
    if (status) query.status = status;
    if (clienteId) query.clienteId = clienteId;
    if (motoId) query.motoId = motoId;
    if (dataInicio || dataFim) {
      const range: Record<string, Date> = {};
      if (dataInicio) range.$gte = new Date(dataInicio);
      if (dataFim) range.$lte = new Date(dataFim);
      query.dataInicio = range;
    }

    const alugueis = await Aluguel.find(query).sort({ dataInicio: -1 }).lean();
    return NextResponse.json({ alugueis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const raw = await req.json();
    const parsed = aluguelCreateSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validação: ${issues}` },
        { status: 400 }
      );
    }
    const aluguel = await Aluguel.create(parsed.data);
    return NextResponse.json({ aluguel }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao registrar locação";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
