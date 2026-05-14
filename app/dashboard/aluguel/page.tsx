"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  KeyRound,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bike,
  DollarSign,
  ArrowRight,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";

interface MotoApi {
  _id: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  cilindrada: number;
  km: number;
  tipo: string;
  status: string;
  valorDiaria?: number;
  valorSemanal?: number;
  valorMensal?: number;
}

interface AluguelApi {
  _id: string;
  motoMarca?: string;
  motoModelo: string;
  clienteNome: string;
  clienteTelefone?: string;
  dataInicio: string;
  dataFim: string;
  valorTotal: number;
  status: string;
  vendedorId?: string;
}

export default function AluguelPage() {
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const motosParams = new URLSearchParams();
  if (search) motosParams.set("q", search);
  const motosUrl = `/api/motos${motosParams.toString() ? `?${motosParams}` : ""}`;
  const { data: motosData, loading, error } = useApi<{ motos: MotoApi[] }>(motosUrl, [search]);

  // Aluguéis reais do /api/alugueis (scoped pelo backend por role)
  const alugParams = new URLSearchParams();
  if (statusFiltro) alugParams.set("status", statusFiltro);
  const { data: alugData } = useApi<{
    alugueis: AluguelApi[];
  }>(`/api/alugueis${alugParams.toString() ? `?${alugParams}` : ""}`, [
    statusFiltro,
  ]);

  const todasMotos = motosData?.motos ?? [];
  const motosAluguel = todasMotos.filter(
    (m) => m.tipo === "aluguel" || m.tipo === "ambos"
  );

  const alugueis = alugData?.alugueis ?? [];
  const ativosCount = alugueis.filter(
    (a) => a.status === "ativo" || a.status === "atrasado"
  ).length;
  const motosAlugadas = motosAluguel.filter((m) => m.status === "alugada").length;
  const motosDisponiveisLocacao = motosAluguel.filter(
    (m) => m.status === "disponivel"
  ).length;
  // Receita do mês: soma valorTotal de aluguéis com dataInicio no mês atual
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const receitaMes = alugueis
    .filter((a) => new Date(a.dataInicio) >= inicioMes)
    .reduce((s, a) => s + (a.valorTotal || 0), 0);

  return (
    <div>
      <PageHeader
        title="Aluguel de Motos"
        description="KEU Loca Motos - Locações ativas e disponíveis"
      >
        <Link href="/dashboard/aluguel/novo">
          <Button>
            <Plus className="h-4 w-4" /> Nova Locação
          </Button>
        </Link>
      </PageHeader>

      {/* STATS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatBox
          icon={<KeyRound />}
          label="Locações ativas"
          value={ativosCount.toString()}
          color="from-keu-red to-keu-red-dark"
        />
        <StatBox
          icon={<Bike />}
          label="Motos alugadas"
          value={motosAlugadas.toString()}
          color="from-blue-500 to-blue-600"
        />
        <StatBox
          icon={<CheckCircle2 />}
          label="Disponíveis"
          value={motosDisponiveisLocacao.toString()}
          color="from-emerald-500 to-emerald-600"
        />
        <StatBox
          icon={<DollarSign />}
          label="Receita do mês"
          value={formatCurrency(receitaMes)}
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* FILTROS DE STATUS */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["", "Todos"],
            ["ativo", "Ativos"],
            ["atrasado", "Atrasados"],
            ["concluido", "Concluídos"],
            ["cancelado", "Cancelados"],
          ] as const
        ).map(([k, label]) => {
          const active = statusFiltro === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setStatusFiltro(k)}
              className={
                active
                  ? "px-3 py-1.5 rounded-full bg-keu-red text-white text-xs font-bold shadow-md shadow-keu-red/20"
                  : "px-3 py-1.5 rounded-full bg-white text-keu-black/70 hover:bg-keu-gray-light text-xs font-medium border border-keu-black/10 transition"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* LOCAÇÕES ATIVAS */}
      <Card className="mb-8">
        <div className="p-6 border-b border-keu-black/5">
          <h2 className="font-bold text-lg">Locações em andamento</h2>
          <p className="text-sm text-keu-black/60">
            Contratos ativos e próximos vencimentos
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
              <tr>
                <th className="text-left p-4">Moto</th>
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Início</th>
                <th className="text-left p-4">Conclusão</th>
                <th className="text-right p-4">Valor Total</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-keu-black/5">
              {alugueis.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <KeyRound className="h-10 w-10 text-keu-black/20 mx-auto mb-3" />
                    <h3 className="font-bold mb-1">
                      Nenhuma locação{statusFiltro ? ` ${statusFiltro}` : ""}
                    </h3>
                    <p className="text-sm text-keu-black/60 max-w-md mx-auto">
                      {statusFiltro
                        ? "Mude o filtro de status pra ver outros aluguéis."
                        : "Quando você criar uma locação, ela aparece aqui."}
                    </p>
                  </td>
                </tr>
              ) : (
                alugueis.map((a) => {
                  const dataFim = new Date(a.dataFim);
                  const diasRest =
                    now > 0
                      ? Math.ceil((dataFim.getTime() - now) / 86400000)
                      : 0;
                  const ativoOuAtrasado =
                    a.status === "ativo" || a.status === "atrasado";
                  const urgente =
                    ativoOuAtrasado && (diasRest <= 0 || diasRest <= 3);
                  return (
                    <tr key={a._id} className="hover:bg-keu-gray-light transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-keu-red/10 text-keu-red w-9 h-9 rounded-lg flex items-center justify-center">
                            <Bike className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold">
                              {a.motoMarca ? `${a.motoMarca} ` : ""}
                              {a.motoModelo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>{a.clienteNome}</div>
                        {a.clienteTelefone && (
                          <div className="text-[10px] text-keu-black/50">
                            {a.clienteTelefone}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm">{formatDate(a.dataInicio)}</td>
                      <td className="p-4 text-sm">
                        {formatDate(a.dataFim)}
                        {ativoOuAtrasado && (
                          <div
                            className={
                              urgente
                                ? "text-[10px] font-bold text-red-600 mt-0.5"
                                : "text-[10px] text-keu-black/50 mt-0.5"
                            }
                          >
                            {diasRest < 0
                              ? `${Math.abs(diasRest)}d atraso`
                              : diasRest === 0
                              ? "vence hoje"
                              : `${diasRest}d restantes`}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-keu-red">
                        {formatCurrency(a.valorTotal)}
                      </td>
                      <td className="p-4">
                        <AluguelStatusBadge status={a.status} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {ativoOuAtrasado && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (
                                  !confirm(
                                    `Concluir contrato de ${a.motoModelo}? Use a página de detalhe pra registrar avarias.`
                                  )
                                ) return;
                                window.location.href = `/dashboard/aluguel/${a._id}/devolver`;
                              }}
                              className="text-xs text-emerald-700 hover:underline font-semibold"
                            >
                              Concluir
                            </button>
                          )}
                          <Link href={`/dashboard/aluguel/${a._id}`}>
                            <Button variant="ghost" size="sm">
                              Ver <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CATÁLOGO DE MOTOS PARA LOCAÇÃO */}
      <Card>
        <div className="p-6 border-b border-keu-black/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Frota disponível</h2>
              <p className="text-sm text-keu-black/60">
                {loading
                  ? "Carregando..."
                  : `${motosAluguel.length} motos para locação`}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  placeholder="Buscar moto..."
                  className="pl-9 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <div className="text-sm text-keu-black/60">Carregando frota...</div>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-600 text-sm">{error}</div>
        ) : motosAluguel.length === 0 ? (
          <div className="p-16 text-center">
            <Bike className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
            <h3 className="font-bold mb-1">Nenhuma moto na frota</h3>
            <p className="text-sm text-keu-black/60 mb-4">
              {search
                ? "Tente outro termo de busca."
                : "Cadastre motos com tipo \"aluguel\" ou \"ambos\" para vê-las aqui."}
            </p>
            <Link href="/dashboard/estoque/novo">
              <Button>
                <Plus className="h-4 w-4" /> Cadastrar moto
              </Button>
            </Link>
          </div>
        ) : (
          <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {motosAluguel.map((m) => (
              <Card
                key={m._id}
                className="overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="aspect-video bg-gradient-to-br from-keu-gray-light via-white to-keu-red/10 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bike className="h-16 w-16 text-keu-red/30" />
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant={
                        m.status === "disponivel"
                          ? "success"
                          : m.status === "alugada"
                            ? "info"
                            : "warning"
                      }
                    >
                      {m.status === "disponivel"
                        ? "Disponível"
                        : m.status === "alugada"
                          ? "Alugada"
                          : "Manutenção"}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2 bg-white/95 rounded-md px-2 py-0.5 text-xs font-bold">
                    {m.anoModelo}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold text-keu-red">
                    {m.marca}
                  </div>
                  <h3 className="font-bold mb-2">{m.modelo}</h3>
                  <div className="text-xs text-keu-black/60 mb-3">
                    {m.cilindrada}cc • {m.km.toLocaleString("pt-BR")} km
                  </div>

                  <div className="bg-keu-gray-light rounded-lg p-3 space-y-1.5 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-keu-black/60">Diária:</span>
                      <span className="font-bold text-keu-red">
                        {formatCurrency(m.valorDiaria ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-keu-black/60">Semanal:</span>
                      <span className="font-semibold">
                        {formatCurrency(m.valorSemanal ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-keu-black/60">Mensal:</span>
                      <span className="font-semibold">
                        {formatCurrency(m.valorMensal ?? 0)}
                      </span>
                    </div>
                  </div>

                  {m.status === "disponivel" ? (
                    <Link
                      href={`/dashboard/aluguel/novo?moto=${m._id}`}
                      className="block"
                    >
                      <Button size="sm" className="w-full">
                        Alugar agora <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" className="w-full" disabled>
                      Indisponível
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  note?: string;
}) {
  return (
    <Card className={`p-6 bg-gradient-to-br ${color} text-white border-0`}>
      <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
      {note && (
        <div className="text-[10px] uppercase tracking-wide text-white/60 mt-1">
          {note}
        </div>
      )}
    </Card>
  );
}

function AluguelStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { v: "success" | "warning" | "danger" | "info"; l: string; i: React.ReactNode }
  > = {
    ativo: { v: "info", l: "Ativo", i: <Clock className="h-3 w-3" /> },
    concluido: {
      v: "success",
      l: "Concluído",
      i: <CheckCircle2 className="h-3 w-3" />,
    },
    atrasado: {
      v: "danger",
      l: "Atrasado",
      i: <AlertCircle className="h-3 w-3" />,
    },
    cancelado: { v: "warning", l: "Cancelado", i: null },
  };
  const conf = map[status] || { v: "warning" as const, l: status, i: null };
  return (
    <Badge variant={conf.v}>
      {conf.i}
      {conf.l}
    </Badge>
  );
}
