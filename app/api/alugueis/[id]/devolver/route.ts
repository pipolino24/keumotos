import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Moto } from "@/lib/models/moto";
import { aluguelDevolucaoSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/alugueis/[id]/devolver
 *
 * Registra a devolução de uma moto alugada:
 * - salva fotos do estado de devolução
 * - registra avarias (com fotos e custo)
 * - calcula caução a devolver
 * - muda status do aluguel para "concluido"
 * - muda status da moto para "disponivel" (ou "manutencao" se avarias)
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    await connectMongo();
    const { id } = await params;
    const raw = await req.json();
    const parsed = aluguelDevolucaoSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validação: ${issues}` },
        { status: 400 }
      );
    }

    const aluguel = await Aluguel.findById(id);
    if (!aluguel) {
      return NextResponse.json(
        { error: "Aluguel não encontrado" },
        { status: 404 }
      );
    }
    if (aluguel.status === "concluido") {
      return NextResponse.json(
        { error: "Aluguel já foi devolvido" },
        { status: 409 }
      );
    }

    const data = parsed.data;
    const custoTotalAvarias = data.avarias.reduce(
      (s, a) => s + (a.custoEstimado ?? 0),
      0
    );
    const multaAtraso = data.multaAtraso ?? 0;
    const valorAReceberCaucao = Math.max(
      0,
      aluguel.caucao - custoTotalAvarias - multaAtraso
    );

    aluguel.km_final = data.km_final;
    aluguel.fotosFim = data.fotosFim;
    aluguel.observacoesFim = data.observacoesFim;
    aluguel.avarias = data.avarias.map((a) => ({
      ...a,
      registradoEm: new Date(),
    }));
    aluguel.custoTotalAvarias = custoTotalAvarias;
    aluguel.multaAtraso = multaAtraso;
    aluguel.valorAReceberCaucao = valorAReceberCaucao;
    aluguel.dataDevolucao = data.dataDevolucao
      ? new Date(data.dataDevolucao)
      : new Date();
    aluguel.status = "concluido";
    await aluguel.save();

    // Atualiza status da moto
    const novoStatusMoto =
      data.avarias.length > 0 ? "manutencao" : "disponivel";
    await Moto.findByIdAndUpdate(aluguel.motoId, {
      status: novoStatusMoto,
      km: data.km_final,
    });

    return NextResponse.json({
      aluguel: aluguel.toObject(),
      resumoFinanceiro: {
        custoTotalAvarias,
        multaAtraso,
        caucao: aluguel.caucao,
        valorAReceberCaucao,
      },
      motoNovoStatus: novoStatusMoto,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao registrar devolução";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
