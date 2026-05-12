"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  KeyRound,
  Clock,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";
import { cn } from "@/lib/utils";

interface FinanceiroData {
  janela: string;
  vendas: {
    count: number;
    receita: number;
    comissoes: number;
    ticketMedio: number;
  };
  alugueis: { count: number; receita: number; ativos: number };
  parcelado: { parcelasPendentes: number; valorPendente: number };
  receitaTotal: number;
  margemBruta: number;
  margemPct: number;
}

type Range = "7d" | "30d" | "90d";

/**
 * Widget executivo do admin com KPIs financeiros: receita, comissões,
 * margem, parcelas pendentes. Toggle 7d/30d/90d.
 */
export function FinanceiroWidget() {
  const [range, setRange] = useState<Range>("30d");
  const { data, loading } = useApi<FinanceiroData>(
    `/api/admin/financeiro?range=${range}`,
    [range]
  );

  return (
    <Card className="p-6 card-hover">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" /> Visão financeira
          </h3>
          <p className="text-xs text-keu-black/50">
            Receita, comissões e parcelas pendentes
          </p>
        </div>
        <div className="flex gap-1">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full transition",
                range === r
                  ? "bg-emerald-600 text-white"
                  : "bg-keu-gray-light text-keu-black/60 hover:bg-keu-black/10"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <KpiBox
              icon={<TrendingUp className="h-4 w-4" />}
              label="Receita total"
              value={formatCurrency(data.receitaTotal)}
              tone="emerald"
              sub={`margem ${data.margemPct.toFixed(1)}%`}
            />
            <KpiBox
              icon={<DollarSign className="h-4 w-4" />}
              label="Comissões pagas"
              value={formatCurrency(data.vendas.comissoes)}
              tone="amber"
              sub={`em ${data.vendas.count} venda${data.vendas.count !== 1 ? "s" : ""}`}
            />
            <KpiBox
              icon={<ShoppingBag className="h-4 w-4" />}
              label="Vendas"
              value={`${data.vendas.count}`}
              tone="red"
              sub={`tícket médio ${formatCurrency(data.vendas.ticketMedio)}`}
            />
            <KpiBox
              icon={<KeyRound className="h-4 w-4" />}
              label="Aluguéis"
              value={`${data.alugueis.count}`}
              tone="blue"
              sub={`${data.alugueis.ativos} ativo${data.alugueis.ativos !== 1 ? "s" : ""}`}
            />
          </div>
          {data.parcelado.parcelasPendentes > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
              <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span className="text-keu-black/80">
                <strong>{data.parcelado.parcelasPendentes} parcela
                {data.parcelado.parcelasPendentes !== 1 ? "s" : ""} a receber
                </strong>{" "}
                · projeção {formatCurrency(data.parcelado.valorPendente)}
              </span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function KpiBox({
  icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "red" | "blue";
  sub?: string;
}) {
  const toneClasses: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-700",
    amber: "bg-amber-500/10 text-amber-700",
    red: "bg-keu-red/10 text-keu-red",
    blue: "bg-blue-500/10 text-blue-700",
  };
  return (
    <div className="border border-keu-black/5 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            toneClasses[tone]
          )}
        >
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-keu-black/50">
          {label}
        </span>
      </div>
      <div className="text-xl font-black mb-0.5 truncate">{value}</div>
      {sub && <div className="text-[10px] text-keu-black/50">{sub}</div>}
    </div>
  );
}
