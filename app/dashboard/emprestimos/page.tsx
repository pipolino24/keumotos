"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Plus,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Search,
  Loader2,
  Banknote,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";

interface ParcelaApi {
  numero: number;
  vencimento: string;
  valor: number;
  status: "pendente" | "paga" | "atrasada" | "postergada";
}

interface EmprestimoApi {
  _id: string;
  clienteNome: string;
  clienteTelefone?: string;
  clienteCpf?: string;
  valorEmprestado: number;
  valorTotal: number;
  modalidade?: "principal-juros" | "so-juros";
  juros: number;
  taxa: number;
  totalParcelas: number;
  frequencia: string;
  parcelas: ParcelaApi[];
  status: "ativo" | "quitado" | "em_atraso" | "cancelado";
  createdAt: string;
  dataPrimeiraParcela: string;
}

export default function EmprestimosPage() {
  const [filtroStatus, setFiltroStatus] = useState("");
  const [search, setSearch] = useState("");

  const params = new URLSearchParams();
  if (filtroStatus) params.set("status", filtroStatus);
  if (search) params.set("q", search);
  const url = `/api/emprestimos${params.toString() ? `?${params}` : ""}`;

  const { data, loading, error } = useApi<{ emprestimos: EmprestimoApi[] }>(
    url,
    [filtroStatus, search]
  );

  const emprestimos = data?.emprestimos ?? [];

  // KPIs agregados
  const kpis = useMemo(() => {
    let totalEmprestado = 0;
    let totalJuros = 0;
    let aReceber = 0;
    let emAtraso = 0;
    let ativos = 0;
    for (const e of emprestimos) {
      if (e.status === "cancelado") continue;
      totalEmprestado += e.valorEmprestado;
      totalJuros += e.juros;
      if (e.status === "ativo" || e.status === "em_atraso") ativos++;
      for (const p of e.parcelas) {
        if (p.status === "paga") continue;
        aReceber += p.valor;
        if (p.status === "atrasada") emAtraso += p.valor;
      }
    }
    return { totalEmprestado, totalJuros, aReceber, emAtraso, ativos };
  }, [emprestimos]);

  return (
    <div>
      <PageHeader
        title="Empréstimos"
        description="Registre empréstimos pra clientes — controle de parcelas e juros"
      >
        <Link href="/dashboard/emprestimos/novo">
          <Button>
            <Plus className="h-4 w-4" /> Novo empréstimo
          </Button>
        </Link>
      </PageHeader>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard
          color="from-keu-red to-keu-red-dark"
          icon={<Banknote className="h-5 w-5" />}
          label="Total emprestado"
          value={formatCurrency(kpis.totalEmprestado)}
          subtitle={`${kpis.ativos} ativos`}
        />
        <StatCard
          color="from-emerald-500 to-emerald-600"
          icon={<TrendingUp className="h-5 w-5" />}
          label="Juros acumulados"
          value={formatCurrency(kpis.totalJuros)}
          subtitle="lucro potencial"
        />
        <StatCard
          color="from-amber-500 to-amber-600"
          icon={<DollarSign className="h-5 w-5" />}
          label="A receber"
          value={formatCurrency(kpis.aReceber)}
          subtitle="parcelas em aberto"
        />
        <StatCard
          color={
            kpis.emAtraso > 0
              ? "from-rose-500 to-rose-600"
              : "from-blue-500 to-blue-600"
          }
          icon={<AlertCircle className="h-5 w-5" />}
          label="Em atraso"
          value={formatCurrency(kpis.emAtraso)}
          subtitle={kpis.emAtraso > 0 ? "cobrar urgente" : "tudo em dia"}
        />
      </div>

      {/* FILTROS */}
      <Card className="mb-6">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
            <Input
              placeholder="Buscar por nome, CPF, telefone…"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="Todos"
              active={filtroStatus === ""}
              onClick={() => setFiltroStatus("")}
            />
            <FilterPill
              label="Ativos"
              active={filtroStatus === "ativo"}
              onClick={() => setFiltroStatus("ativo")}
            />
            <FilterPill
              label="Em atraso"
              active={filtroStatus === "em_atraso"}
              onClick={() => setFiltroStatus("em_atraso")}
              tone="danger"
            />
            <FilterPill
              label="Quitados"
              active={filtroStatus === "quitado"}
              onClick={() => setFiltroStatus("quitado")}
              tone="success"
            />
            <FilterPill
              label="Cancelados"
              active={filtroStatus === "cancelado"}
              onClick={() => setFiltroStatus("cancelado")}
            />
          </div>
        </div>
      </Card>

      {/* LISTA */}
      {loading && !data ? (
        <div className="p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
          <div className="text-sm text-keu-black/60">Carregando empréstimos…</div>
        </div>
      ) : error ? (
        <div className="p-16 text-center text-red-600 text-sm">{error}</div>
      ) : emprestimos.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-keu-black/5">
          <DollarSign className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
          <h3 className="font-bold mb-1">Nenhum empréstimo registrado</h3>
          <p className="text-sm text-keu-black/60 mb-4">
            {search || filtroStatus
              ? "Tente outro filtro."
              : "Comece registrando o primeiro empréstimo."}
          </p>
          <Link href="/dashboard/emprestimos/novo">
            <Button>
              <Plus className="h-4 w-4" /> Registrar empréstimo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {emprestimos.map((e) => (
            <EmprestimoRow key={e._id} e={e} />
          ))}
        </div>
      )}
    </div>
  );
}

/* Mesmo cálculo do detail page — verde/amarelo/vermelho por dias até vencer. */
function urgenciaProxima(p: ParcelaApi | undefined): {
  borderL: string;
  bg: string;
  texto: string;
  textoColor: string;
} | null {
  if (!p) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(p.vencimento);
  venc.setHours(0, 0, 0, 0);
  const dias = Math.round((venc.getTime() - hoje.getTime()) / 86400000);
  if (dias < 0 || p.status === "atrasada") {
    return {
      borderL: "border-l-red-500",
      bg: "bg-red-50",
      texto: `Atrasada há ${Math.max(1, -dias)}d`,
      textoColor: "text-red-700",
    };
  }
  if (dias <= 3) {
    return {
      borderL: "border-l-amber-500",
      bg: "bg-amber-50",
      texto:
        dias === 0
          ? "Vence hoje"
          : dias === 1
            ? "Vence amanhã"
            : `Vence em ${dias}d`,
      textoColor: "text-amber-800",
    };
  }
  return {
    borderL: "border-l-emerald-500",
    bg: "bg-white",
    texto: `Próxima em ${dias}d`,
    textoColor: "text-emerald-700",
  };
}

/**
 * Deriva status local pra evitar mostrar "Ativo" quando há parcela já
 * vencida (backend só recalcula status em mutação, então pode estar stale).
 */
function statusDerivado(e: EmprestimoApi): EmprestimoApi["status"] {
  if (e.status === "cancelado" || e.status === "quitado") return e.status;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const temAtrasada = e.parcelas.some((p) => {
    if (p.status === "paga") return false;
    const venc = new Date(p.vencimento);
    venc.setHours(0, 0, 0, 0);
    return venc.getTime() < hoje.getTime();
  });
  return temAtrasada ? "em_atraso" : "ativo";
}

function EmprestimoRow({ e }: { e: EmprestimoApi }) {
  const pagas = e.parcelas.filter((p) => p.status === "paga").length;
  const proxima = e.parcelas.find(
    (p) => p.status !== "paga" && p.status !== "postergada"
  );
  const urg = urgenciaProxima(proxima);
  const statusReal = statusDerivado(e);
  // Card cancelado vira cinza desbotado
  const cardCls =
    e.status === "cancelado"
      ? "opacity-60 grayscale border-l-4 border-l-keu-black/20"
      : urg
        ? `border-l-4 ${urg.borderL} ${urg.bg}`
        : "border-l-4 border-l-emerald-500";
  return (
    <Link href={`/dashboard/emprestimos/${e._id}`}>
      <Card
        className={`p-5 hover:shadow-md hover:-translate-y-0.5 transition-all ${cardCls}`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-keu-red/10 text-keu-red flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold truncate">{e.clienteNome}</div>
              <div className="text-xs text-keu-black/60 flex flex-wrap gap-2 mt-0.5">
                {e.clienteTelefone && <span>{e.clienteTelefone}</span>}
                {e.clienteCpf && <span>· CPF {e.clienteCpf}</span>}
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-xs text-keu-black/50 uppercase tracking-wide">
              emprestado
            </div>
            <div className="font-bold">{formatCurrency(e.valorEmprestado)}</div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-xs text-keu-black/50 uppercase tracking-wide flex items-center gap-1 justify-end">
              {e.modalidade === "so-juros" ? "juros a receber" : "total a receber"}
              {e.modalidade === "so-juros" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold tracking-normal normal-case">
                  só juros
                </span>
              )}
            </div>
            <div className="font-bold text-keu-red">
              {formatCurrency(e.valorTotal)}
            </div>
            <div className="text-xs text-emerald-600 mt-0.5">
              +{e.taxa.toFixed(1)}% · {formatCurrency(e.juros)}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-xs text-keu-black/50 uppercase tracking-wide">
              parcelas
            </div>
            <div className="font-bold">
              {pagas}/{e.totalParcelas}
            </div>
            {urg && (
              <div className={`text-xs font-semibold mt-0.5 ${urg.textoColor}`}>
                {urg.texto}
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <StatusBadge status={statusReal} />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function StatusBadge({ status }: { status: EmprestimoApi["status"] }) {
  const map = {
    ativo: { v: "info" as const, l: "Ativo", icon: <DollarSign className="h-3 w-3" /> },
    quitado: {
      v: "success" as const,
      l: "Quitado",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    em_atraso: {
      v: "danger" as const,
      l: "Em atraso",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    cancelado: { v: "default" as const, l: "Cancelado", icon: null },
  };
  const m = map[status];
  return (
    <Badge variant={m.v}>
      {m.icon}
      {m.l}
    </Badge>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  tone,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "danger" | "success";
}) {
  const activeCls =
    tone === "danger"
      ? "bg-red-600 text-white"
      : tone === "success"
        ? "bg-emerald-600 text-white"
        : "bg-keu-red text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
        active
          ? activeCls
          : "bg-white border border-keu-black/10 text-keu-black/70 hover:border-keu-black/30"
      }`}
    >
      {label}
    </button>
  );
}

