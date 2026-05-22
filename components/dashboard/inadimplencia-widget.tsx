"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/lib/hooks/use-api";
import { formatCurrency } from "@/lib/utils";

interface InadimpResponse {
  inadimplentes: Array<{
    aluguelId: string;
    clienteNome: string;
    motoModelo: string;
    motoMarca?: string;
    diasAtrasoMaiorParcela: number;
    totalDevido: number;
  }>;
  resumo: {
    total: number;
    totalDevido: number;
    totalMultas: number;
    totalJuros: number;
  };
}

/**
 * Mini widget pro dashboard mostrando contagem + total devido. Quando 0
 * inadimplentes, exibe estado "tudo em dia" discreto. Quando há, destaque
 * vermelho que chama atenção.
 */
export function InadimplenciaWidget() {
  const { data, loading } = useApi<InadimpResponse>("/api/inadimplencia");

  const top3 = (data?.inadimplentes ?? []).slice(0, 3);
  const resumo = data?.resumo;
  const temInadimplentes = (resumo?.total ?? 0) > 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <AlertTriangle
            className={`h-4 w-4 ${temInadimplentes ? "text-red-500" : "text-keu-black/30"}`}
          />
          Inadimplência
        </h3>
        {temInadimplentes && (
          <Badge variant="danger" className="text-[10px]">
            {resumo!.total}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="py-6 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-keu-red mx-auto" />
        </div>
      ) : !temInadimplentes ? (
        <Link
          href="/dashboard/inadimplencia"
          className="block text-center py-6 text-keu-black/40 hover:text-keu-red transition"
        >
          <div className="text-xs">🎉 Nenhum atraso no momento</div>
        </Link>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-[10px] uppercase text-red-700 font-semibold mb-1">
              Total devido
            </div>
            <div className="font-black text-lg text-red-700">
              {formatCurrency(resumo!.totalDevido)}
            </div>
            <div className="text-[11px] text-keu-black/60">
              Multa {formatCurrency(resumo!.totalMultas)} · Juros{" "}
              {formatCurrency(resumo!.totalJuros)}
            </div>
          </div>

          <div className="space-y-2">
            {top3.map((i) => (
              <Link
                key={i.aluguelId}
                href={`/dashboard/aluguel/${i.aluguelId}`}
                className="block group"
              >
                <div className="flex items-center gap-2 p-2 -mx-2 rounded hover:bg-keu-gray-light transition">
                  <div className="w-2 h-8 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {i.clienteNome}
                    </div>
                    <div className="text-[11px] text-keu-black/60 truncate">
                      {i.motoMarca ? `${i.motoMarca} ` : ""}
                      {i.motoModelo} · {i.diasAtrasoMaiorParcela}d atraso
                    </div>
                  </div>
                  <div className="text-right text-xs font-bold text-red-700 flex-shrink-0">
                    {formatCurrency(i.totalDevido)}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {resumo!.total > 3 && (
            <Link
              href="/dashboard/inadimplencia"
              className="block text-center text-xs text-keu-red font-semibold hover:underline py-1"
            >
              Ver todos ({resumo!.total}) <ArrowRight className="inline h-3 w-3" />
            </Link>
          )}
          {resumo!.total <= 3 && (
            <Link
              href="/dashboard/inadimplencia"
              className="block text-center text-xs text-keu-red font-semibold hover:underline py-1"
            >
              Cobrar via WhatsApp <ArrowRight className="inline h-3 w-3" />
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
