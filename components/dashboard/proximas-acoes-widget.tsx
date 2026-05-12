"use client";

import Link from "next/link";
import { Calendar, AlertTriangle, CreditCard, Wrench, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";

type ProximaAcaoTipo =
  | "devolucao-aluguel"
  | "aluguel-vencido"
  | "parcela-pagar"
  | "revisao-recomendada";

interface ProximaAcao {
  id: string;
  tipo: ProximaAcaoTipo;
  titulo: string;
  descricao?: string;
  data: string;
  diasRestantes: number;
  prioridade: "alta" | "normal" | "baixa";
  link?: string;
  valor?: number;
}

const iconMap: Record<ProximaAcaoTipo, React.ReactNode> = {
  "devolucao-aluguel": <Calendar className="h-4 w-4" />,
  "aluguel-vencido": <AlertTriangle className="h-4 w-4" />,
  "parcela-pagar": <CreditCard className="h-4 w-4" />,
  "revisao-recomendada": <Wrench className="h-4 w-4" />,
};

function formatarTempo(dias: number): { texto: string; cor: string } {
  if (dias < 0) {
    return {
      texto: `${Math.abs(dias)} dia${Math.abs(dias) > 1 ? "s" : ""} atrasada`,
      cor: "text-red-600 bg-red-50",
    };
  }
  if (dias === 0) return { texto: "Hoje", cor: "text-orange-700 bg-orange-50" };
  if (dias === 1) return { texto: "Amanhã", cor: "text-orange-700 bg-orange-50" };
  if (dias <= 5)
    return { texto: `Em ${dias} dias`, cor: "text-amber-700 bg-amber-50" };
  return { texto: `Em ${dias} dias`, cor: "text-emerald-700 bg-emerald-50" };
}

function fmtMoeda(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function ProximasAcoesWidget({ clienteId }: { clienteId: string }) {
  const { data, loading } = useApi<{ acoes: ProximaAcao[] }>(
    clienteId ? `/api/clientes/${clienteId}/proximas-acoes` : null,
    [clienteId]
  );

  const acoes = data?.acoes ?? [];

  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-keu-black/5 bg-gradient-to-r from-keu-red/5 to-transparent">
        <h2 className="font-bold text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-keu-red" /> Próximas ações
        </h2>
        <p className="text-xs text-keu-black/50 mt-0.5">
          Compromissos da sua conta
        </p>
      </div>
      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-keu-red mx-auto" />
        </div>
      ) : acoes.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-7 w-7 text-emerald-500" />}
          title="Tudo em dia"
          description="Você não tem compromissos pendentes nos próximos 60 dias."
        />
      ) : (
        <div className="divide-y divide-keu-black/5">
          {acoes.slice(0, 6).map((a, i) => {
            const t = formatarTempo(a.diasRestantes);
            const Inner = (
              <div
                className="p-3 px-5 flex items-center gap-3 hover:bg-keu-gray-light transition group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    a.prioridade === "alta"
                      ? "bg-red-50 text-red-600"
                      : "bg-keu-red/10 text-keu-red"
                  }`}
                >
                  {iconMap[a.tipo]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{a.titulo}</div>
                  <div className="text-xs text-keu-black/60 truncate flex items-center gap-2 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.cor}`}>
                      {t.texto}
                    </span>
                    {a.valor !== undefined && a.valor > 0 && (
                      <Badge variant="info" className="text-[9px]">
                        {fmtMoeda(a.valor)}
                      </Badge>
                    )}
                  </div>
                </div>
                {a.link && (
                  <ArrowRight className="h-4 w-4 text-keu-black/30 group-hover:text-keu-red group-hover:translate-x-0.5 transition flex-shrink-0" />
                )}
              </div>
            );
            return a.link ? (
              <Link key={a.id} href={a.link}>
                {Inner}
              </Link>
            ) : (
              <div key={a.id}>{Inner}</div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
