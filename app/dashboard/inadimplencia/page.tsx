"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Phone,
  ChevronRight,
  Search,
  TrendingDown,
  Calendar,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  proximaParcelaEm?: string;
}

interface InadimpResponse {
  inadimplentes: ClienteInadimplente[];
  resumo: {
    total: number;
    totalDevido: number;
    totalMultas: number;
    totalJuros: number;
  };
}

const onlyDigits = (s?: string) => (s ?? "").replace(/\D/g, "");

function severidade(dias: number): "leve" | "media" | "grave" | "critica" {
  if (dias <= 7) return "leve";
  if (dias <= 30) return "media";
  if (dias <= 60) return "grave";
  return "critica";
}

const SEVERIDADE_STYLES: Record<
  ReturnType<typeof severidade>,
  { label: string; classes: string; cardBorder: string }
> = {
  leve: {
    label: "Leve",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
    cardBorder: "border-amber-200",
  },
  media: {
    label: "Média",
    classes: "bg-orange-100 text-orange-700 border-orange-200",
    cardBorder: "border-orange-300",
  },
  grave: {
    label: "Grave",
    classes: "bg-red-100 text-red-700 border-red-200",
    cardBorder: "border-red-400",
  },
  critica: {
    label: "Crítica",
    classes: "bg-red-200 text-red-800 border-red-300",
    cardBorder: "border-red-600",
  },
};

export default function InadimplenciaPage() {
  const [search, setSearch] = useState("");
  const [filtroSeveridade, setFiltroSeveridade] = useState<string>("");
  const { data, loading } = useApi<InadimpResponse>("/api/inadimplencia");

  const inadimplentes = data?.inadimplentes ?? [];
  const filtered = inadimplentes.filter((i) => {
    if (filtroSeveridade) {
      const s = severidade(i.diasAtrasoMaiorParcela);
      if (s !== filtroSeveridade) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        i.clienteNome.toLowerCase().includes(q) ||
        (i.clienteEmail ?? "").toLowerCase().includes(q) ||
        (i.clienteTelefone ?? "").includes(q) ||
        i.motoModelo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const resumo = data?.resumo ?? {
    total: 0,
    totalDevido: 0,
    totalMultas: 0,
    totalJuros: 0,
  };

  function msgCobranca(i: ClienteInadimplente): string {
    return encodeURIComponent(
      `Olá ${i.clienteNome}, sobre sua locação na KEU Motos (${i.motoMarca ?? ""} ${i.motoModelo}):\n\nVocê tem ${i.parcelasAtrasadas} parcela${i.parcelasAtrasadas > 1 ? "s" : ""} em atraso há ${i.diasAtrasoMaiorParcela} dia${i.diasAtrasoMaiorParcela > 1 ? "s" : ""}.\n\nTotal a receber: ${formatCurrency(i.totalDevido)}\n(inclui multa e juros)\n\nPodemos combinar o pagamento?`
    );
  }

  // KPIs por severidade
  const porSeveridade = {
    leve: inadimplentes.filter((i) => severidade(i.diasAtrasoMaiorParcela) === "leve").length,
    media: inadimplentes.filter((i) => severidade(i.diasAtrasoMaiorParcela) === "media").length,
    grave: inadimplentes.filter((i) => severidade(i.diasAtrasoMaiorParcela) === "grave").length,
    critica: inadimplentes.filter((i) => severidade(i.diasAtrasoMaiorParcela) === "critica").length,
  };

  return (
    <div>
      <PageHeader
        title="Inadimplência"
        description="Clientes com parcelas de locação em atraso. Multa 10% + juros 2%/dia."
      />

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <Users className="h-5 w-5 mb-2" />
          <div className="text-2xl font-black">{resumo.total}</div>
          <div className="text-xs uppercase opacity-90">Clientes em atraso</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0">
          <TrendingDown className="h-5 w-5 mb-2" />
          <div className="text-2xl font-black">
            {formatCurrency(resumo.totalDevido)}
          </div>
          <div className="text-xs uppercase opacity-90">Total a receber</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <AlertTriangle className="h-5 w-5 mb-2" />
          <div className="text-2xl font-black">
            {formatCurrency(resumo.totalMultas)}
          </div>
          <div className="text-xs uppercase opacity-90">Multas acumuladas</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <Calendar className="h-5 w-5 mb-2" />
          <div className="text-2xl font-black">
            {formatCurrency(resumo.totalJuros)}
          </div>
          <div className="text-xs uppercase opacity-90">Juros acumulados</div>
        </Card>
      </div>

      <Card>
        <div className="p-5 border-b border-keu-black/5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <h2 className="font-bold text-lg">Devedores</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
              <Input
                placeholder="Nome, telefone, moto..."
                className="pl-9 w-72"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-1 flex-wrap text-xs">
            {[
              { v: "", label: `Todos (${resumo.total})` },
              { v: "leve", label: `Leve até 7d (${porSeveridade.leve})` },
              {
                v: "media",
                label: `Média 8–30d (${porSeveridade.media})`,
              },
              {
                v: "grave",
                label: `Grave 31–60d (${porSeveridade.grave})`,
              },
              {
                v: "critica",
                label: `Crítica 60+d (${porSeveridade.critica})`,
              },
            ].map((p) => (
              <button
                key={p.v}
                onClick={() => setFiltroSeveridade(p.v)}
                className={`px-3 py-1 rounded-full font-medium transition ${
                  filtroSeveridade === p.v
                    ? "bg-keu-red text-white"
                    : "bg-keu-gray-light text-keu-black/70 hover:bg-keu-black/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <p className="text-sm text-keu-black/60">Buscando devedores...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8" />}
            title={
              search || filtroSeveridade
                ? "Nenhum devedor bate o filtro"
                : "Tudo em dia! 🎉"
            }
            description={
              search || filtroSeveridade
                ? "Tente outro termo de busca ou limpe os filtros."
                : "Nenhum cliente em atraso no momento. Parcelas atrasadas aparecem aqui automaticamente."
            }
          />
        ) : (
          <div className="divide-y divide-keu-black/5">
            {filtered.map((i) => {
              const sev = severidade(i.diasAtrasoMaiorParcela);
              const sevConf = SEVERIDADE_STYLES[sev];
              return (
                <div
                  key={i.aluguelId}
                  className={`p-5 hover:bg-keu-gray-light/40 transition border-l-4 ${sevConf.cardBorder}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold">{i.clienteNome}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase ${sevConf.classes}`}
                        >
                          {sevConf.label}
                        </Badge>
                        <span className="text-xs text-keu-black/60">
                          {i.diasAtrasoMaiorParcela} dia
                          {i.diasAtrasoMaiorParcela > 1 ? "s" : ""} atrasado
                          {i.diasAtrasoMaiorParcela > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-sm text-keu-black/70">
                        {i.motoMarca ? `${i.motoMarca} ` : ""}
                        {i.motoModelo}
                        {i.clienteTelefone ? ` · ${i.clienteTelefone}` : ""}
                      </div>
                      <div className="text-xs text-keu-black/50 mt-1">
                        {i.parcelasAtrasadas} parcela
                        {i.parcelasAtrasadas > 1 ? "s" : ""} atrasada
                        {i.parcelasAtrasadas > 1 ? "s" : ""} · Multa{" "}
                        {formatCurrency(i.totalMultas)} · Juros{" "}
                        {formatCurrency(i.totalJuros)}
                        {i.proximaParcelaEm && (
                          <> · próxima vence {formatDate(i.proximaParcelaEm)}</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wide text-keu-black/60">
                          Total devido
                        </div>
                        <div className="font-black text-lg text-red-700">
                          {formatCurrency(i.totalDevido)}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {i.clienteTelefone && (
                          <a
                            href={`https://wa.me/55${onlyDigits(i.clienteTelefone)}?text=${msgCobranca(i)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                            title="Cobrar via WhatsApp com mensagem pré-preenchida"
                          >
                            <Phone className="h-3.5 w-3.5" /> Cobrar
                          </a>
                        )}
                        <Link
                          href={`/dashboard/aluguel/${i.aluguelId}`}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-keu-black/10 hover:bg-keu-gray-light"
                        >
                          Ver locação <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-6 text-xs text-keu-black/50 max-w-3xl">
        <strong>Como funciona:</strong> uma parcela vira <em>atrasada</em>{" "}
        automaticamente quando a data de vencimento passa e ela ainda não foi
        marcada como paga. Multa de 10% é cobrada uma vez (no momento do atraso)
        e juros de 2% por dia acumulam até o pagamento. Esses valores são
        sugeridos pelo sistema — você decide se cobra integral ou negocia.
      </div>
    </div>
  );
}
