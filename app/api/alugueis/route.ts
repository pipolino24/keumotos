import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { aluguelCreateSchema } from "@/lib/schemas";
import { requireAuth, requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const vendedorIdParam = searchParams.get("vendedorId");
    const status = searchParams.get("status");
    const clienteIdParam = searchParams.get("clienteId");
    const motoId = searchParams.get("motoId");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const query: Record<string, unknown> = {};
    if (auth.role === "admin") {
      if (vendedorIdParam) query.vendedorId = vendedorIdParam;
      if (clienteIdParam) query.clienteId = clienteIdParam;
    } else if (auth.role === "vendedor") {
      query.vendedorId = auth.userId;
    } else if (auth.role === "cliente") {
      query.clienteId = auth.userId;
    } else {
      return NextResponse.json({ alugueis: [] });
    }
    if (status) query.status = status;
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
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
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
