"use client";

import { Eye, Phone, TrendingUp, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useApi } from "@/lib/hooks/use-api";

interface ConversaoData {
  janela: string;
  visualizacoes: number;
  leads: number;
  conversoes: number;
  vendas: number;
  alugueis: number;
  taxaLead: number;
  taxaConversao: number;
}

/**
 * Funil de conversão dos últimos 30 dias — visualizações → leads quentes →
 * vendas/aluguéis concluídos. Vendedor vê só os próprios; admin tudo.
 */
export function ConversaoWidget() {
  const { data, loading } = useApi<ConversaoData>("/api/analytics/conversao");

  if (loading) {
    return (
      <Card className="p-6">
        <Loader2 className="h-6 w-6 animate-spin text-keu-red mx-auto" />
      </Card>
    );
  }

  if (!data) return null;

  const maxVal = Math.max(data.visualizacoes, 1);
  const leadsPct = Math.min(100, (data.leads / maxVal) * 100);
  const conversoesPct = Math.min(100, (data.conversoes / maxVal) * 100);

  return (
    <Card className="p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-keu-red" /> Funil — últimos 30d
          </h3>
          <p className="text-xs text-keu-black/50">
            Visualizações → Leads → Conversões
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <FunnelRow
          icon={<Eye className="h-4 w-4" />}
          label="Visualizações"
          value={data.visualizacoes}
          pct={100}
          color="bg-blue-500"
        />
        <FunnelRow
          icon={<Phone className="h-4 w-4" />}
          label="Leads quentes"
          value={data.leads}
          pct={leadsPct}
          color="bg-amber-500"
          subtitle={`taxa: ${data.taxaLead.toFixed(1)}%`}
        />
        <FunnelRow
          icon={<TrendingUp className="h-4 w-4" />}
          label="Conversões"
          value={data.conversoes}
          pct={conversoesPct}
          color="bg-emerald-500"
          subtitle={`${data.vendas} venda${data.vendas !== 1 ? "s" : ""} + ${data.alugueis} aluguel${data.alugueis !== 1 ? "éis" : ""} · ${data.taxaConversao.toFixed(1)}% sobre leads`}
        />
      </div>
    </Card>
  );
}

function FunnelRow({
  icon,
  label,
  value,
  pct,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  pct: number;
  color: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-2 font-semibold text-keu-black/80">
          <span className="text-keu-black/50">{icon}</span>
          {label}
        </span>
        <span className="font-black text-lg">{value}</span>
      </div>
      <div className="h-2 bg-keu-gray-light rounded-full overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-700`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      {subtitle && (
        <div className="text-[10px] text-keu-black/45 mt-1">{subtitle}</div>
      )}
    </div>
  );
}
