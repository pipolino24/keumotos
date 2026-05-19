"use client";

import Link from "next/link";
import { Bike, Eye, Phone, ArrowRight, Flame, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";

interface MotoRanking {
  _id: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  valorAnunciado: number;
  status: string;
  destaque?: boolean;
  viewCount?: number;
  interesses30d: number;
  leads30d: number;
}

/**
 * Widget que mostra as motos com mais engajamento — views + interesses
 * agregados em 30 dias. Disponível só pra admin/vendedor.
 */
export function TopMotosWidget({ limit = 5 }: { limit?: number }) {
  const { data, loading } = useApi<{ motos: MotoRanking[] }>(
    `/api/motos/ranking?limit=${limit}`
  );

  const motos = data?.motos ?? [];

  return (
    <Card>
      <div className="p-5 border-b border-keu-black/5 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-keu-red" /> Top motos
          </h2>
          <p className="text-xs text-keu-black/50">
            Mais visualizadas e cobiçadas (30d)
          </p>
        </div>
        <Link
          href="/dashboard/estoque"
          className="text-xs text-keu-red hover:underline font-semibold"
        >
          Estoque →
        </Link>
      </div>
      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-keu-red mx-auto" />
        </div>
      ) : motos.length === 0 ? (
        <EmptyState
          icon={<Bike className="h-7 w-7" />}
          title="Sem dados ainda"
          description="Aguardando interações de clientes pra começar a rankear."
        />
      ) : (
        <div className="divide-y divide-keu-black/5">
          {motos.map((m, idx) => (
            <Link
              key={m._id}
              href={`/dashboard/estoque/${m._id}`}
              className="block hover:bg-keu-gray-light transition group"
            >
              <div className="p-3 px-5 flex items-center gap-3">
                <div className="text-base font-black text-keu-black/30 w-5 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="bg-keu-red/10 text-keu-red w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bike className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                    {m.marca} {m.modelo}
                    {m.destaque && (
                      <Badge variant="default" className="text-[9px]">
                        ★
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-keu-black/60 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {m.viewCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1 text-amber-700">
                      <Phone className="h-3 w-3" /> {m.leads30d} leads
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-keu-red">
                    {formatCurrency(m.valorAnunciado)}
                  </div>
                  <ArrowRight className="h-3 w-3 text-keu-black/30 ml-auto opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
