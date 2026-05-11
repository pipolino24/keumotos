import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");
    const status = searchParams.get("status");
    const loja = searchParams.get("loja");
    const search = searchParams.get("q");

    const query: Record<string, unknown> = {};
    if (tipo) query.tipo = tipo;
    if (status) query.status = status;
    if (loja) query.loja = loja;
    if (search) {
      query.$or = [
        { marca: { $regex: search, $options: "i" } },
        { modelo: { $regex: search, $options: "i" } },
        { placa: { $regex: search, $options: "i" } },
      ];
    }

    const motos = await Moto.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ motos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const data = await req.json();
    const moto = await Moto.create(data);
    return NextResponse.json({ moto }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar moto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
