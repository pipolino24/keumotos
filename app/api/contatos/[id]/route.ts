import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Contato } from "@/lib/models/contato";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectMongo();
    const { id } = await params;
    const contato = await Contato.findById(id).lean();
    if (!contato) {
      return NextResponse.json(
        { error: "Contato não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ contato });
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
    const contato = await Contato.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!contato) {
      return NextResponse.json(
        { error: "Contato não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ contato });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectMongo();
    const { id } = await params;
    const contato = await Contato.findByIdAndDelete(id).lean();
    if (!contato) {
      return NextResponse.json(
        { error: "Contato não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
