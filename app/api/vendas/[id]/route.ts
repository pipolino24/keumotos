import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Venda } from "@/lib/models/venda";
import { Moto } from "@/lib/models/moto";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/vendas/[id]
 *
 * Detalhes de uma venda específica. Admin vê todas; vendedor/afiliado vê só
 * as próprias; cliente vê só onde foi comprador. Retorna venda + snapshot
 * resumido da moto (marca/modelo/ano/placa/foto-capa) pra evitar 2 round-trips
 * no detalhe.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const venda = await Venda.findById(id).lean();
    if (!venda) {
      return NextResponse.json(
        { error: "Venda não encontrada" },
        { status: 404 }
      );
    }
    // Autorização: cliente só vê venda própria; vendedor/afiliado idem
    if (auth.role === "vendedor" || auth.role === "afiliado") {
      if (String(venda.vendedorId) !== String(auth.userId)) {
        return NextResponse.json(
          { error: "Sem permissão" },
          { status: 403 }
        );
      }
    } else if (auth.role === "cliente") {
      if (String(venda.clienteId) !== String(auth.userId)) {
        return NextResponse.json(
          { error: "Sem permissão" },
          { status: 403 }
        );
      }
    }
    // Não-admin não pode ver vendas de outros — admin já passou
    if (auth.role !== "admin" && auth.role !== "vendedor" && auth.role !== "afiliado" && auth.role !== "cliente") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Snapshot da moto — só foto-capa + identificação básica
    let motoSnapshot: Record<string, unknown> | null = null;
    if (venda.motoId && mongoose.Types.ObjectId.isValid(String(venda.motoId))) {
      const moto = await Moto.findById(venda.motoId, {
        marca: 1,
        modelo: 1,
        anoModelo: 1,
        placa: 1,
        cor: 1,
        fotos: { $slice: 1 },
      })
        .lean()
        .maxTimeMS(10_000);
      if (moto) {
        motoSnapshot = {
          _id: String(moto._id),
          marca: moto.marca,
          modelo: moto.modelo,
          anoModelo: moto.anoModelo,
          placa: moto.placa,
          cor: moto.cor,
          fotoCapa: moto.fotos?.[0] ?? null,
        };
      }
    }

    return NextResponse.json({ venda, moto: motoSnapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
