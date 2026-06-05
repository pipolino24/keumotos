"use client";

import { useMemo, useState } from "react";
import {
  History,
  Search,
  Filter,
  User,
  Calendar,
  Activity,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApi } from "@/lib/hooks/use-api";

interface AuditEvent {
  _id: string;
  acao: string;
  ator: string;
  atorNome?: string;
  atorRole?: "admin" | "vendedor" | "afiliado" | "cliente";
  alvoTipo: string;
  alvoId: string;
  alvoLabel?: string;
  estadoAnterior?: Record<string, unknown>;
  estadoNovo?: Record<string, unknown>;
  motivo?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

const ALVO_TIPOS = [
  { v: "", l: "Todos os alvos" },
  { v: "user", l: "Usuário" },
  { v: "moto", l: "Moto" },
  { v: "aluguel", l: "Aluguel" },
  { v: "venda", l: "Venda" },
  { v: "contrato", l: "Contrato" },
  { v: "cliente", l: "Cliente" },
  { v: "proprietario", l: "Fornecedor" },
  { v: "emprestimo", l: "Empréstimo" },
  { v: "role", l: "Cargo" },
  { v: "contato", l: "Contato" },
  { v: "interesse", l: "Interesse" },
  { v: "afiliado", l: "Afiliado" },
  { v: "page", l: "Navegação" },
  { v: "form", l: "Formulário" },
  { v: "sistema", l: "Sistema" },
];

const RANGES = [
  { v: "1", l: "Hoje" },
  { v: "7", l: "7 dias" },
  { v: "30", l: "30 dias" },
  { v: "90", l: "90 dias" },
  { v: "365", l: "1 ano" },
];

export default function LogsPage() {
  const [alvoTipo, setAlvoTipo] = useState("");
  const [acaoFiltro, setAcaoFiltro] = useState("");
  const [dias, setDias] = useState("30");
  const [searchAtor, setSearchAtor] = useState("");

  const params = new URLSearchParams();
  if (alvoTipo) params.set("alvoTipo", alvoTipo);
  if (acaoFiltro) params.set("acao", acaoFiltro);
  params.set("dias", dias);
  params.set("limit", "200");
  const { data, loading, error } = useApi<{ events: AuditEvent[] }>(
    `/api/admin/audit-log?${params.toString()}`,
    [alvoTipo, acaoFiltro, dias]
  );

  // Filtro por nome do ator é client-side (porque o backend filtra por ID).
  // Pra busca por nome real, precisaria de join com profiles — fica assim por
  // enquanto.
  const eventos = useMemo(() => {
    const all = data?.events ?? [];
    if (!searchAtor.trim()) return all;
    const q = searchAtor.trim().toLowerCase();
    return all.filter(
      (e) =>
        (e.atorNome ?? "").toLowerCase().includes(q) ||
        e.ator.toLowerCase().includes(q) ||
        (e.alvoLabel ?? "").toLowerCase().includes(q)
    );
  }, [data, searchAtor]);

  // Lista todas as ações únicas dos eventos pra montar o select de filtro
  const acoesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    (data?.events ?? []).forEach((e) => set.add(e.acao));
    return Array.from(set).sort();
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Logs de Auditoria"
        description="Tudo que aconteceu no sistema — quem fez, o que fez, quando."
      />

      {/* FILTROS */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-3 text-keu-black/70">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-bold">Filtros</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-keu-black/60 uppercase tracking-wide mb-1 block">
              Período
            </label>
            <Select
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              className="w-full"
            >
              {RANGES.map((r) => (
                <option key={r.v} value={r.v}>
                  {r.l}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-keu-black/60 uppercase tracking-wide mb-1 block">
              Tipo de alvo
            </label>
            <Select
              value={alvoTipo}
              onChange={(e) => setAlvoTipo(e.target.value)}
              className="w-full"
            >
              {ALVO_TIPOS.map((t) => (
                <option key={t.v} value={t.v}>
                  {t.l}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-keu-black/60 uppercase tracking-wide mb-1 block">
              Ação específica
            </label>
            <Select
              value={acaoFiltro}
              onChange={(e) => setAcaoFiltro(e.target.value)}
              className="w-full"
            >
              <option value="">Todas as ações</option>
              {acoesDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-keu-black/60 uppercase tracking-wide mb-1 block">
              Buscar (ator / alvo)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
              <Input
                placeholder="Nome do usuário ou alvo..."
                className="pl-9 w-full"
                value={searchAtor}
                onChange={(e) => setSearchAtor(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* LISTA */}
      <Card>
        <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-keu-red" />
              Atividade recente
            </h2>
            <p className="text-sm text-keu-black/60">
              {loading
                ? "Carregando..."
                : `${eventos.length} evento${eventos.length === 1 ? "" : "s"} ${
                    searchAtor ? "filtrado(s)" : ""
                  }`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <div className="text-sm text-keu-black/60">Buscando logs...</div>
          </div>
        ) : error ? (
          <div className="p-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <div className="text-sm text-red-600">{error}</div>
          </div>
        ) : eventos.length === 0 ? (
          <div className="p-16 text-center">
            <Activity className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
            <h3 className="font-bold mb-1">Sem eventos no período</h3>
            <p className="text-sm text-keu-black/60">
              Mude os filtros ou amplie o período pra ver mais.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-keu-black/5">
            {eventos.map((e) => (
              <LogRow key={e._id} ev={e} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function LogRow({ ev }: { ev: AuditEvent }) {
  const d = new Date(ev.createdAt);
  const acaoBadge = colorForAcao(ev.acao);
  const tempoRelativo = formatRelativo(d);

  return (
    <div className="p-4 hover:bg-keu-gray-light/50 transition flex items-start gap-3">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${acaoBadge.bg}`}
      >
        <Activity className={`h-4 w-4 ${acaoBadge.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap mb-1">
          <Badge variant={acaoBadge.variant} className="text-[10px]">
            {ev.acao}
          </Badge>
          {ev.atorRole && (
            <Badge variant="secondary" className="text-[10px] uppercase">
              {ev.atorRole}
            </Badge>
          )}
          <span className="text-xs text-keu-black/40">{tempoRelativo}</span>
        </div>
        <div className="text-sm">
          <span className="font-semibold">
            {ev.atorNome ?? abbrev(ev.ator)}
          </span>{" "}
          <span className="text-keu-black/60">→</span>{" "}
          <span className="font-medium text-keu-red">{ev.alvoTipo}</span>{" "}
          {ev.alvoLabel && (
            <span className="text-keu-black/70">: {ev.alvoLabel}</span>
          )}
        </div>
        {ev.motivo && (
          <div className="text-xs text-keu-black/50 mt-1 italic">
            Motivo: {ev.motivo}
          </div>
        )}
        {(ev.estadoAnterior || ev.estadoNovo) && (
          <details className="mt-2">
            <summary className="text-[11px] font-semibold text-keu-black/50 cursor-pointer hover:text-keu-red">
              Ver detalhes
            </summary>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {ev.estadoAnterior && (
                <div className="bg-rose-50 border border-rose-100 rounded p-2 text-[11px]">
                  <div className="font-bold text-rose-700 mb-1">Antes</div>
                  <pre className="overflow-auto whitespace-pre-wrap text-rose-900">
                    {JSON.stringify(ev.estadoAnterior, null, 2)}
                  </pre>
                </div>
              )}
              {ev.estadoNovo && (
                <div className="bg-emerald-50 border border-emerald-100 rounded p-2 text-[11px]">
                  <div className="font-bold text-emerald-700 mb-1">Depois</div>
                  <pre className="overflow-auto whitespace-pre-wrap text-emerald-900">
                    {JSON.stringify(ev.estadoNovo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
      <div className="text-right text-[10px] text-keu-black/40 flex-shrink-0">
        <div className="flex items-center justify-end gap-1">
          <Calendar className="h-3 w-3" />
          {d.toLocaleDateString("pt-BR")}
        </div>
        <div>{d.toLocaleTimeString("pt-BR")}</div>
        {ev.ip && (
          <div className="mt-1 text-keu-black/30 font-mono">{ev.ip}</div>
        )}
      </div>
    </div>
  );
}

// Heurística: mapeia prefixo da ação pra cor — não precisa lookup exato.
function colorForAcao(acao: string) {
  if (acao.includes(".delete") || acao.includes(".cancel"))
    return {
      variant: "danger" as const,
      bg: "bg-red-100",
      text: "text-red-600",
    };
  if (acao.includes(".create"))
    return {
      variant: "success" as const,
      bg: "bg-emerald-100",
      text: "text-emerald-600",
    };
  if (acao.includes(".update") || acao.includes(".role_change"))
    return {
      variant: "warning" as const,
      bg: "bg-amber-100",
      text: "text-amber-600",
    };
  if (acao.startsWith("login."))
    return {
      variant: "info" as const,
      bg: "bg-blue-100",
      text: "text-blue-600",
    };
  return {
    variant: "secondary" as const,
    bg: "bg-keu-black/5",
    text: "text-keu-black/60",
  };
}

function formatRelativo(d: Date) {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const dias = Math.floor(h / 24);
  if (dias < 30) return `${dias}d`;
  return d.toLocaleDateString("pt-BR");
}

function abbrev(id: string) {
  if (id.length > 12) return id.slice(0, 8) + "...";
  return id;
}
