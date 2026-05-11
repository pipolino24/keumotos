"use client";

import Link from "next/link";
import { useState } from "react";
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
  Filter,
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
  caucao?: number;
}

interface AluguelApi {
  _id: string;
  motoModelo: string;
  clienteNome: string;
  dataInicio: string;
  dataFim: string;
  valorTotal: number;
  caucao: number;
  status: string;
}

export default function AluguelPage() {
  const [search, setSearch] = useState("");

  // Busca frota de aluguel (tipo=aluguel ou ambos)
  // O endpoint /api/motos aceita ?tipo=aluguel mas precisamos cobrir "ambos" também.
  // Estratégia: pedimos tipo=aluguel e tipo=ambos via parametro composto não suportado;
  // como alternativa pegamos tudo e filtramos. Aqui usamos tipo=aluguel e complementamos.
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  // Não filtramos por tipo no servidor para conseguir "aluguel" + "ambos" no mesmo response.
  const url = `/api/motos${params.toString() ? `?${params}` : ""}`;
  const { data, loading, error } = useApi<{ motos: MotoApi[] }>(url, [search]);

  const todasMotos = data?.motos ?? [];
  const motosAluguel = todasMotos.filter(
    (m) => m.tipo === "aluguel" || m.tipo === "ambos"
  );

  // TODO: criar endpoint /api/alugueis e consumir aqui.
  // Por enquanto não há fonte de dados para locações ativas.
  const alugueis: AluguelApi[] = [];
  const ativosCount = 0;
  const motosAlugadas = motosAluguel.filter((m) => m.status === "alugada").length;
  const motosDisponiveisLocacao = motosAluguel.filter(
    (m) => m.status === "disponivel"
  ).length;
  const receitaMes = 0;

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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox
          icon={<KeyRound />}
          label="Locações ativas"
          value={ativosCount.toString()}
          color="from-keu-red to-keu-red-dark"
          note="API pendente"
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
          note="API pendente"
        />
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
                <th className="text-left p-4">Devolução</th>
                <th className="text-right p-4">Valor Total</th>
                <th className="text-right p-4">Caução</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-keu-black/5">
              {alugueis.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    {/* TODO: criar endpoint /api/alugueis (GET para listar, POST para criar)
                        no backend e trocar este placeholder pelo consumo real via useApi. */}
                    <KeyRound className="h-10 w-10 text-keu-black/20 mx-auto mb-3" />
                    <h3 className="font-bold mb-1">
                      Nenhuma locação para exibir
                    </h3>
                    <p className="text-sm text-keu-black/60 max-w-md mx-auto">
                      O endpoint <code className="font-mono bg-keu-gray-light px-1 py-0.5 rounded">/api/alugueis</code>{" "}
                      ainda não foi criado. Assim que estiver disponível, os
                      contratos ativos aparecerão aqui.
                    </p>
                  </td>
                </tr>
              ) : (
                alugueis.map((a) => (
                  <tr key={a._id} className="hover:bg-keu-gray-light transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-keu-red/10 text-keu-red w-9 h-9 rounded-lg flex items-center justify-center">
                          <Bike className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold">{a.motoModelo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{a.clienteNome}</td>
                    <td className="p-4 text-sm">{formatDate(a.dataInicio)}</td>
                    <td className="p-4 text-sm">{formatDate(a.dataFim)}</td>
                    <td className="p-4 text-right font-bold text-keu-red">
                      {formatCurrency(a.valorTotal)}
                    </td>
                    <td className="p-4 text-right text-sm">
                      {formatCurrency(a.caucao)}
                    </td>
                    <td className="p-4">
                      <AluguelStatusBadge status={a.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm">
                        Ver <ArrowRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
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
              <Button variant="outline">
                <Filter className="h-4 w-4" /> Filtros
              </Button>
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
                <div className="aspect-video bg-gradient-to-br from-keu-black to-keu-gray relative">
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
                    <div className="flex justify-between text-xs pt-1 border-t border-keu-black/5">
                      <span className="text-keu-black/60">Caução:</span>
                      <span>{formatCurrency(m.caucao ?? 0)}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    disabled={m.status !== "disponivel"}
                  >
                    {m.status === "disponivel" ? (
                      <>
                        Alugar agora <ArrowRight className="h-3 w-3" />
                      </>
                    ) : (
                      "Indisponível"
                    )}
                  </Button>
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
