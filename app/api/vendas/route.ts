import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Venda } from "@/lib/models/venda";
import { vendaCreateSchema } from "@/lib/schemas";
import { requireAuth, requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET: vendedores veem só as próprias vendas; admin vê todas.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const vendedorIdParam = searchParams.get("vendedorId");
    const status = searchParams.get("status");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const query: Record<string, unknown> = {};
    // admin: filtra por quem quiser; staff: só as próprias; cliente: as suas compras
    if (auth.role === "admin") {
      if (vendedorIdParam) query.vendedorId = vendedorIdParam;
      const clienteIdParam = searchParams.get("clienteId");
      if (clienteIdParam) query.clienteId = clienteIdParam;
    } else if (auth.role === "vendedor" || auth.role === "afiliado") {
      query.vendedorId = auth.userId;
    } else if (auth.role === "cliente") {
      query.clienteId = auth.userId;
    } else {
      return NextResponse.json({ vendas: [] });
    }
    if (status) query.status = status;
    if (dataInicio || dataFim) {
      const range: Record<string, Date> = {};
      if (dataInicio) range.$gte = new Date(dataInicio);
      if (dataFim) range.$lte = new Date(dataFim);
      query.data = range;
    }

    const vendas = await Venda.find(query).sort({ data: -1 }).lean();
    return NextResponse.json({ vendas });
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
    const parsed = vendaCreateSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validação: ${issues}` },
        { status: 400 }
      );
    }

    // Vendedor só pode registrar venda em nome próprio.
    // Admin pode atribuir a qualquer vendedor.
    if (auth.role !== "admin") {
      parsed.data.vendedorId = auth.userId;
    }

    const venda = await Venda.create(parsed.data);
    return NextResponse.json({ venda }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao registrar venda";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
