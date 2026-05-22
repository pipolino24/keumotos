import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Moto } from "@/lib/models/moto";
import { Revisao } from "@/lib/models/revisao";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

const avariaCreateSchema = z.object({
  descricao: z.string().min(3, "Descrição obrigatória"),
  // Cada foto pode ser URL ou base64. Limita 8MB por foto + 20 fotos
  // máximo pra prevenir DOS via payload gigante.
  fotos: z
    .array(z.string().max(8_000_000, "Foto muito grande (>8MB)"))
    .max(20, "Máximo 20 fotos")
    .default([]),
  custoEstimado: z.number().min(0).optional(),
  cobradoCaucao: z.boolean().optional(),
  reparado: z.boolean().optional(),
  // Quando true e custoEstimado>0, cria uma Revisao de "reparo-avaria"
  // pra rastrear no histórico da moto.
  criarRevisao: z.boolean().optional().default(false),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/alugueis/[id]/avarias
 *
 * Registra uma avaria durante OU depois da locação. Antes só dava pra
 * registrar via fluxo de devolução, mas avarias podem ser descobertas
 * a qualquer momento (ex: cliente entrega moto, dias depois vendedor
 * percebe arranhão).
 *
 * Quando `criarRevisao: true` e custoEstimado>0, cria uma Revisao de
 * tipo "reparo-avaria" linkada ao aluguel + avaria para rastrear no
 * histórico da moto.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;

  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    const raw = await req.json();
    const parsed = avariaCreateSchema.safeParse(raw);
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
    if (auth.role === "vendedor" && aluguel.vendedorId !== auth.userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const novaAvaria = {
      descricao: parsed.data.descricao,
      fotos: parsed.data.fotos,
      custoEstimado: parsed.data.custoEstimado,
      cobradoCaucao: parsed.data.cobradoCaucao ?? false,
      reparado: parsed.data.reparado ?? false,
      registradoEm: new Date(),
    };

    aluguel.avarias = [...(aluguel.avarias ?? []), novaAvaria];
    // Atualiza total acumulado
    aluguel.custoTotalAvarias = (aluguel.avarias ?? []).reduce(
      (s, a) => s + (a.custoEstimado ?? 0),
      0
    );

    await aluguel.save();

    // Cria revisão de reparo-avaria se solicitado e tem custo
    if (parsed.data.criarRevisao && (parsed.data.custoEstimado ?? 0) > 0) {
      try {
        const moto = await Moto.findById(aluguel.motoId).select("km").lean();
        await Revisao.create({
          motoId: aluguel.motoId,
          tipo: "reparo-avaria",
          descricao: `Avaria: ${parsed.data.descricao}`,
          custoTotal: parsed.data.custoEstimado!,
          kmNaRevisao: moto?.km ?? 0,
          fotos: parsed.data.fotos,
          aluguelOrigemId: id,
          data: new Date(),
        });
      } catch {
        /* falha de revisão não bloqueia avaria */
      }
    }

    // Retorna a avaria recém-criada (com _id)
    const ultimaAvaria = aluguel.avarias[aluguel.avarias.length - 1];
    return NextResponse.json(
      { avaria: ultimaAvaria, custoTotalAvarias: aluguel.custoTotalAvarias },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
