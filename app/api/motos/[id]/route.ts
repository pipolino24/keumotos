import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectMongo();
    const { id } = await params;
    const moto = await Moto.findById(id).lean();
    if (!moto) {
      return NextResponse.json({ error: "Moto não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ moto });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await connectMongo();
    const { id } = await params;
    const data = await req.json();
    const moto = await Moto.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!moto) {
      return NextResponse.json({ error: "Moto não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ moto });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectMongo();
    const { id } = await params;
    const moto = await Moto.findByIdAndDelete(id).lean();
    if (!moto) {
      return NextResponse.json({ error: "Moto não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
