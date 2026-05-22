import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

const avariaPatchSchema = z.object({
  descricao: z.string().min(3).optional(),
  custoEstimado: z.number().min(0).optional(),
  cobradoCaucao: z.boolean().optional(),
  reparado: z.boolean().optional(),
  dataReparo: z.union([z.string(), z.date()]).optional(),
  // Substitui fotos completas (pra suportar adicionar/remover)
  fotos: z
    .array(z.string().max(8_000_000, "Foto muito grande (>8MB)"))
    .max(20, "Máximo 20 fotos")
    .optional(),
});

interface Ctx {
  params: Promise<{ id: string; avariaId: string }>;
}

/**
 * PATCH /api/alugueis/[id]/avarias/[avariaId]
 *
 * Atualiza avaria existente. Caso típico: marcar como reparada após oficina.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;

  try {
    await connectMongo();
    const { id, avariaId } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(avariaId)) {
      return NextResponse.json({ error: "avariaId inválido" }, { status: 400 });
    }

    const raw = await req.json();
    const parsed = avariaPatchSchema.safeParse(raw);
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

    // Mongoose subdocs com _id: true podem ser acessados via id()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avariasArr = aluguel.avarias as any;
    const avaria = avariasArr?.id?.(avariaId);
    if (!avaria) {
      return NextResponse.json(
        { error: "Avaria não encontrada" },
        { status: 404 }
      );
    }

    if (parsed.data.descricao !== undefined) avaria.descricao = parsed.data.descricao;
    if (parsed.data.custoEstimado !== undefined)
      avaria.custoEstimado = parsed.data.custoEstimado;
    if (parsed.data.cobradoCaucao !== undefined)
      avaria.cobradoCaucao = parsed.data.cobradoCaucao;
    if (parsed.data.fotos !== undefined) avaria.fotos = parsed.data.fotos;
    if (parsed.data.reparado !== undefined) {
      avaria.reparado = parsed.data.reparado;
      if (parsed.data.reparado && !avaria.dataReparo) {
        avaria.dataReparo = parsed.data.dataReparo
          ? new Date(parsed.data.dataReparo as string | Date)
          : new Date();
      } else if (!parsed.data.reparado) {
        avaria.dataReparo = undefined;
      }
    }
    if (parsed.data.dataReparo !== undefined) {
      avaria.dataReparo = new Date(parsed.data.dataReparo as string | Date);
    }

    // Recalcula total
    aluguel.custoTotalAvarias = (aluguel.avarias ?? []).reduce(
      (s, a) => s + (a.custoEstimado ?? 0),
      0
    );

    await aluguel.save();

    return NextResponse.json({
      avaria,
      custoTotalAvarias: aluguel.custoTotalAvarias,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/alugueis/[id]/avarias/[avariaId]
 *
 * Remove avaria registrada por engano. Só admin pra evitar vendedor
 * apagar avaria que cliente já contestou.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin"], req);
  if (!auth.ok) return auth.response;

  try {
    await connectMongo();
    const { id, avariaId } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(avariaId)) {
      return NextResponse.json({ error: "avariaId inválido" }, { status: 400 });
    }

    const aluguel = await Aluguel.findById(id);
    if (!aluguel) {
      return NextResponse.json(
        { error: "Aluguel não encontrado" },
        { status: 404 }
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avariasArr = aluguel.avarias as any;
    const avaria = avariasArr?.id?.(avariaId);
    if (!avaria) {
      return NextResponse.json(
        { error: "Avaria não encontrada" },
        { status: 404 }
      );
    }

    aluguel.avarias = (aluguel.avarias ?? []).filter(
      (a) => String((a as { _id?: unknown })._id) !== avariaId
    );
    aluguel.custoTotalAvarias = aluguel.avarias.reduce(
      (s, a) => s + (a.custoEstimado ?? 0),
      0
    );
    await aluguel.save();

    return NextResponse.json({
      ok: true,
      custoTotalAvarias: aluguel.custoTotalAvarias,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
