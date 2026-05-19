import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/aquisicoes
 *
 * Lista motos adquiridas (origem "comprada" ou "repasse") ordenadas pela
 * data de aquisição. Cada item retorna campos resumidos pra dashboard:
 * marca, modelo, ano, valor pago, valor FIPE, data, vendedor (proprietário).
 *
 * Apenas admin e vendedor — dados sensíveis (valorCompra, margem).
 *
 * Query params:
 *   ?origem=comprada|repasse (default: ambas)
 *   ?days=30 (filtra últimos N dias)
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const origemParam = searchParams.get("origem");
    const days = Number(searchParams.get("days") || "0");

    const query: Record<string, unknown> = {
      origem: { $in: ["comprada", "repasse"] },
    };
    if (origemParam === "comprada" || origemParam === "repasse") {
      query.origem = origemParam;
    }
    if (Number.isFinite(days) && days > 0) {
      const desde = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      query.$or = [
        { "compra.dataAquisicao": { $gte: desde } },
        { "repasse.dataInicioConsignacao": { $gte: desde } },
      ];
    }

    const docs = await Moto.find(query, {
      marca: 1,
      modelo: 1,
      anoModelo: 1,
      origem: 1,
      proprietarioNome: 1,
      valorFipe: 1,
      valorAnunciado: 1,
      "compra.valorPago": 1,
      "compra.dataAquisicao": 1,
      "repasse.valorCombinadoDono": 1,
      "repasse.dataInicioConsignacao": 1,
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()
      .maxTimeMS(15_000);

    const aquisicoes = docs.map((m) => {
      const dataAquisicao =
        m.compra?.dataAquisicao ?? m.repasse?.dataInicioConsignacao ?? null;
      const valorPago =
        m.compra?.valorPago ?? m.repasse?.valorCombinadoDono ?? 0;
      return {
        _id: String(m._id),
        marca: m.marca,
        modelo: m.modelo,
        anoModelo: m.anoModelo,
        origem: m.origem,
        vendedor: m.proprietarioNome ?? null,
        valorPago,
        valorFIPE: m.valorFipe ?? 0,
        valorAnunciado: m.valorAnunciado ?? 0,
        margem: (m.valorFipe ?? 0) - valorPago,
        dataAquisicao,
      };
    });

    return NextResponse.json({ aquisicoes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
