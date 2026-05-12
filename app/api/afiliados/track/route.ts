import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Afiliado } from "@/lib/models/afiliado";
import { Indicacao } from "@/lib/models/indicacao";

export const dynamic = "force-dynamic";

/**
 * POST /api/afiliados/track
 * Registra clique/visualização de moto via link de afiliado.
 * Body: { codigo: string, motoId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const data = await req.json();
    const { codigo, motoId } = data as { codigo?: string; motoId?: string };

    if (typeof codigo !== "string" || !codigo || codigo.length > 64) {
      return NextResponse.json(
        { error: "Código do afiliado obrigatório" },
        { status: 400 }
      );
    }

    // motoId precisa ser ObjectId válido (evita injeção de operadores Mongo)
    let motoIdSeguro: string | undefined;
    if (motoId !== undefined && motoId !== null) {
      if (typeof motoId !== "string" || !mongoose.Types.ObjectId.isValid(motoId)) {
        return NextResponse.json(
          { error: "motoId inválido" },
          { status: 400 }
        );
      }
      motoIdSeguro = motoId;
    }

    // Só conta tracking de afiliados ATIVOS e APROVADOS — pendentes
    // de aprovação não devem creditar cliques/conversões.
    const afiliado = await Afiliado.findOne({
      codigo,
      status: "ativo",
      aprovado: true,
    });
    if (!afiliado) {
      return NextResponse.json(
        { error: "Afiliado não encontrado ou inativo" },
        { status: 404 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const referrer = req.headers.get("referer") ?? undefined;

    await Indicacao.create({
      afiliadoId: afiliado._id,
      afiliadoCodigo: afiliado.codigo,
      motoId: motoIdSeguro,
      origem: "link",
      status: "clique",
      ip,
      userAgent,
      referrer,
    });

    await Afiliado.updateOne(
      { _id: afiliado._id },
      { $inc: { totalCliques: 1 } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao registrar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
