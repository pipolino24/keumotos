import { Card } from "@/components/ui/card";

interface StatCardProps {
  /** Ícone à esquerda (Lucide ou qualquer ReactNode). */
  icon: React.ReactNode;
  /** Rótulo abaixo do valor (ex: "Clientes ativos"). */
  label: string;
  /** Valor grande em destaque. Strings já formatadas (R$ 1.500, 12). */
  value: string;
  /** Texto secundário pequeno embaixo (substitui o subtitle/sub variantes). */
  subtitle?: string;
  /**
   * Cor de fundo do card. Aceita tanto "from-emerald-500 to-emerald-600"
   * (gradient) quanto formato legado "bg-emerald-500" — converte automaticamente.
   * Defaults para um gradient KEU se omitido.
   */
  color?: string;
  /**
   * Trend opcional (variação): { direction, value }.
   * Mostra badge "↑ 12% vs mês passado" no canto. Mantém compat com versão
   * complexa do dashboard.
   */
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
    /** Texto que aparece depois do badge (ex: "vs mês passado"). */
    label?: string;
  };
}

// Mapeia color legado "bg-X-500" pro gradient padronizado.
function toGradient(color: string): string {
  if (color.startsWith("from-")) return color;
  const map: Record<string, string> = {
    "bg-emerald-500": "from-emerald-500 to-emerald-600",
    "bg-keu-red": "from-keu-red to-keu-red-dark",
    "bg-blue-500": "from-blue-500 to-blue-600",
    "bg-amber-500": "from-amber-500 to-amber-600",
    "bg-rose-500": "from-rose-500 to-rose-600",
    "bg-purple-500": "from-purple-500 to-purple-600",
  };
  return map[color] ?? "from-keu-red to-keu-red-dark";
}

/**
 * Card de KPI/estatística usado em todos os dashboards. Substitui as 8
 * variações duplicadas (StatCard em afiliados, administracao, dashboard,
 * proprietarios, clientes/[id], estoque/[id]/historico, afiliado e KpiCard
 * em emprestimos).
 *
 * Uso típico:
 *   <StatCard icon={<Users />} label="Clientes" value="42" color="bg-emerald-500" />
 *   <StatCard icon={<DollarSign />} label="Receita" value={fmtMoney(v)}
 *             trend={{ direction: "up", value: "12%", label: "vs mês passado" }} />
 */
export function StatCard({
  icon,
  label,
  value,
  subtitle,
  color = "from-keu-red to-keu-red-dark",
  trend,
}: StatCardProps) {
  const gradient = toGradient(color);
  const trendBadge =
    trend?.direction === "up"
      ? "text-emerald-100 bg-emerald-700/40"
      : trend?.direction === "down"
        ? "text-red-100 bg-red-700/40"
        : "text-white/70 bg-white/15";
  const trendArrow =
    trend?.direction === "up" ? "↑" : trend?.direction === "down" ? "↓" : "—";

  return (
    <Card
      className={`p-6 bg-gradient-to-br ${gradient} text-white border-0 hover:shadow-lg hover:-translate-y-0.5 transition-all relative overflow-hidden group`}
    >
      <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-black tabular-nums">{value}</div>
      <div className="text-sm text-white/90 font-semibold">{label}</div>
      {subtitle && (
        <div className="text-xs text-white/70 mt-0.5">{subtitle}</div>
      )}
      {trend && (
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${trendBadge}`}
          >
            {trendArrow} {trend.value}
          </span>
          {trend.label && (
            <span className="text-[11px] text-white/60">{trend.label}</span>
          )}
        </div>
      )}
    </Card>
  );
}
