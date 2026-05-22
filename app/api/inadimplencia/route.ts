import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { requireRole } from "@/lib/auth/api-guards";
import { resumoInadimplencia } from "@/lib/aluguel/parcelas";

export const dynamic = "force-dynamic";

interface ClienteInadimplente {
  aluguelId: string;
  clienteId?: string;
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  motoModelo: string;
  motoMarca?: string;
  parcelasAtrasadas: number;
  diasAtrasoMaiorParcela: number;
  totalDevido: number;
  totalMultas: number;
  totalJuros: number;
  proximaParcelaEm?: Date;
}

/**
 * GET /api/inadimplencia
 *
 * Lista todos os aluguéis com parcelas atrasadas. Calcula total devido
 * (valor + multa + juros) por cliente. Usado pelo dashboard de cobrança.
 *
 * Staff-only (admin/vendedor). Vendedor só vê seus próprios.
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;

  try {
    await connectMongo();
    const hoje = new Date();

    // Filtra aluguéis ativos/atrasados com pelo menos 1 parcela vencida
    // não paga. Query Mongo: $elemMatch garante atomicidade (uma parcela
    // tem AMBOS os campos satisfeitos, não duas parcelas separadas).
    const query: Record<string, unknown> = {
      status: { $in: ["ativo", "atrasado"] },
      parcelasLocacao: {
        $elemMatch: {
          status: { $ne: "paga" },
          vencimento: { $lt: hoje },
        },
      },
    };
    if (auth.role === "vendedor") {
      query.vendedorId = auth.userId;
    }

    const alugueis = await Aluguel.find(query)
      .select({
        clienteId: 1,
        clienteNome: 1,
        clienteTelefone: 1,
        clienteEmail: 1,
        motoModelo: 1,
        motoMarca: 1,
        parcelasLocacao: 1,
        multaPorAtrasoPercent: 1,
        jurosDiaPercent: 1,
      })
      .limit(500)
      .lean()
      .maxTimeMS(15_000);

    const inadimplentes: ClienteInadimplente[] = [];
    let totalDevidoGlobal = 0;
    let totalMultasGlobal = 0;
    let totalJurosGlobal = 0;

    for (const a of alugueis) {
      const resumo = resumoInadimplencia(
        a.parcelasLocacao ?? [],
        a.multaPorAtrasoPercent ?? 10,
        a.jurosDiaPercent ?? 2,
        hoje
      );
      if (resumo.parcelasAtrasadas === 0) continue;

      inadimplentes.push({
        aluguelId: String(a._id),
        clienteId: a.clienteId,
        clienteNome: a.clienteNome,
        clienteTelefone: a.clienteTelefone,
        clienteEmail: a.clienteEmail,
        motoModelo: a.motoModelo,
        motoMarca: a.motoMarca,
        parcelasAtrasadas: resumo.parcelasAtrasadas,
        diasAtrasoMaiorParcela: resumo.diasAtrasoMaiorParcela,
        totalDevido: resumo.totalDevido,
        totalMultas: resumo.totalMultas,
        totalJuros: resumo.totalJuros,
        proximaParcelaEm: resumo.proximaParcelaEm,
      });
      totalDevidoGlobal += resumo.totalDevido;
      totalMultasGlobal += resumo.totalMultas;
      totalJurosGlobal += resumo.totalJuros;
    }

    // Ordena por gravidade: mais dias atraso primeiro, depois maior valor
    inadimplentes.sort((a, b) => {
      if (b.diasAtrasoMaiorParcela !== a.diasAtrasoMaiorParcela) {
        return b.diasAtrasoMaiorParcela - a.diasAtrasoMaiorParcela;
      }
      return b.totalDevido - a.totalDevido;
    });

    return NextResponse.json({
      inadimplentes,
      resumo: {
        total: inadimplentes.length,
        totalDevido: Math.round(totalDevidoGlobal * 100) / 100,
        totalMultas: Math.round(totalMultasGlobal * 100) / 100,
        totalJuros: Math.round(totalJurosGlobal * 100) / 100,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
