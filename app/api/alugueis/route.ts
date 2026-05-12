import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Moto } from "@/lib/models/moto";
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

    // Verifica disponibilidade da moto antes de criar — evita double-booking.
    const motoIdStr = String(parsed.data.motoId);
    if (!mongoose.Types.ObjectId.isValid(motoIdStr)) {
      return NextResponse.json({ error: "motoId inválido" }, { status: 400 });
    }
    const moto = await Moto.findById(motoIdStr).select("status modelo marca");
    if (!moto) {
      return NextResponse.json(
        { error: "Moto não encontrada" },
        { status: 404 }
      );
    }
    if (moto.status !== "disponivel") {
      return NextResponse.json(
        { error: `Moto não está disponível (${moto.status})` },
        { status: 409 }
      );
    }

    // Vendedor só pode criar locação em nome próprio
    if (auth.role !== "admin") {
      parsed.data.vendedorId = auth.userId;
    }

    const aluguel = await Aluguel.create(parsed.data);

    // Sincroniza moto.status → "alugada". Falha não rompe o aluguel — log e
    // segue, admin pode corrigir manualmente.
    await Moto.updateOne(
      { _id: moto._id, status: "disponivel" },
      { $set: { status: "alugada" } }
    ).catch((err) => {
      console.error("[alugueis] falha ao sync moto.status:", err);
    });

    return NextResponse.json({ aluguel }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao registrar locação";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
