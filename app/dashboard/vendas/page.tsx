"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Clock,
  Search,
  Filter,
  Download,
  Bike,
  ArrowRight,
  Lock,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser, canSeeFinancialData } from "@/lib/auth/user-context";
import { useApi } from "@/lib/hooks/use-api";

interface MotoApi {
  _id: string;
  marca: string;
  modelo: string;
  versao?: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  cilindrada: number;
  km: number;
  valorFipe: number;
  valorAnunciado: number;
  valorMinimo: number;
  tipo: string;
  status: string;
  destaque?: boolean;
}

interface VendaApi {
  _id: string;
  motoMarca?: string;
  motoModelo: string;
  motoAno?: number;
  clienteNome: string;
  clienteTelefone?: string;
  vendedorId?: string;
  vendedorNome?: string;
  valorVendido: number;
  comissao: number;
  status: "pendente" | "concluida" | "cancelada";
  data: string;
}

export default function VendasPage() {
  const me = useCurrentUser();
  const verTudo = canSeeFinancialData(me);
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");

  const params = new URLSearchParams();
  params.set("tipo", "venda");
  if (search) params.set("q", search);
  const url = `/api/motos?${params.toString()}`;
  const { data, loading, error } = useApi<{ motos: MotoApi[] }>(url, [search]);

  // Inclui motos com tipo "ambos" também (catálogo de venda).
  const allMotos = data?.motos ?? [];
  const motosVenda = allMotos.filter(
    (m) => m.tipo === "venda" || m.tipo === "ambos"
  );

  // Vendas reais: backend já faz o scope (admin vê todas, vendedor só as
  // próprias). Não precisamos repetir aqui.
  const vendaParams = new URLSearchParams();
  if (statusFiltro) vendaParams.set("status", statusFiltro);
  const { data: vendasData } = useApi<{ vendas: VendaApi[] }>(
    `/api/vendas${vendaParams.toString() ? `?${vendaParams}` : ""}`,
    [statusFiltro]
  );
  const vendasVisiveis = vendasData?.vendas ?? [];

  // Agregados do mês corrente (filtra status "concluida")
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const vendasMes = vendasVisiveis.filter(
    (v) => new Date(v.data) >= inicioMes && v.status === "concluida"
  );
  const totalVendas = vendasMes.length;
  const totalFaturado = vendasMes.reduce((s, v) => s + (v.valorVendido || 0), 0);
  const totalComissao = vendasMes.reduce((s, v) => s + (v.comissao || 0), 0);
  const vendasPendentes = vendasVisiveis.filter(
    (v) => v.status === "pendente"
  ).length;

  return (
    <div>
      <PageHeader
        title={verTudo ? "Vendas — Todas" : "Minhas Vendas"}
        description={
          verTudo
            ? "Catálogo, histórico completo e indicadores agregados"
            : "Suas próprias vendas e comissões"
        }
      >
        <Button variant="outline" size="default">
          <Download className="h-4 w-4" /> Exportar
        </Button>
        <Link href="/dashboard/vendas/nova">
          <Button>
            <ShoppingCart className="h-4 w-4" /> Nova Venda
          </Button>
        </Link>
      </PageHeader>

      {!verTudo && (
        <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <Lock className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Visão pessoal:</strong> esta tela mostra apenas suas
              vendas. O faturamento total da operação fica em{" "}
              <Link
                href="/dashboard/administracao"
                className="font-semibold underline"
              >
                Administração
              </Link>
              .
            </span>
          </div>
        </Card>
      )}

      {/* STATS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox
          icon={<DollarSign />}
          label={verTudo ? "Faturamento mês" : "Minhas vendas (R$)"}
          value={formatCurrency(totalFaturado)}
          color="from-emerald-500 to-emerald-600"
        />
        <StatBox
          icon={<ShoppingCart />}
          label={verTudo ? "Vendas realizadas" : "Minhas vendas"}
          value={totalVendas.toString()}
          color="from-keu-red to-keu-red-dark"
        />
        <StatBox
          icon={<TrendingUp />}
          label={verTudo ? "Comissões pagas" : "Minha comissão"}
          value={formatCurrency(totalComissao)}
          color="from-blue-500 to-blue-600"
        />
        <StatBox
          icon={<Clock />}
          label="Vendas pendentes"
          value={vendasPendentes.toString()}
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* CATÁLOGO */}
      <Card className="mb-8">
        <div className="p-6 border-b border-keu-black/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Motos à venda</h2>
              <p className="text-sm text-keu-black/60">
                {loading
                  ? "Carregando..."
                  : `${motosVenda.length} motos disponíveis no catálogo`}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  placeholder="Buscar..."
                  className="pl-9 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="default">
                <Filter className="h-4 w-4" /> Filtros
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="default">Todas ({motosVenda.length})</Badge>
            <Badge variant="outline">
              Disponíveis (
              {motosVenda.filter((m) => m.status === "disponivel").length})
            </Badge>
            <Badge variant="outline">
              Reservadas (
              {motosVenda.filter((m) => m.status === "reservada").length})
            </Badge>
            <Badge variant="outline">Destaque</Badge>
            <Badge variant="outline">FIPE Acima</Badge>
            <Badge variant="outline">FIPE Abaixo</Badge>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <div className="text-sm text-keu-black/60">Carregando motos...</div>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-600 text-sm">{error}</div>
        ) : motosVenda.length === 0 ? (
          <div className="p-16 text-center">
            <Bike className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
            <h3 className="font-bold mb-1">Nenhuma moto à venda</h3>
            <p className="text-sm text-keu-black/60">
              {search
                ? "Tente outro termo de busca."
                : "Cadastre motos no estoque com tipo Venda ou Ambos."}
            </p>
          </div>
        ) : (
          <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {motosVenda.map((m) => (
              <Card
                key={m._id}
                className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="aspect-video bg-gradient-to-br from-keu-gray-light via-white to-keu-red/10 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bike className="h-16 w-16 text-keu-red/30" />
                  </div>
                  <div className="absolute top-2 left-2 flex gap-1">
                    {m.destaque && <Badge variant="default">Destaque</Badge>}
                    <StatusMotoBadge status={m.status} />
                  </div>
                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur rounded-md px-2 py-0.5 text-xs font-bold">
                    {m.anoModelo}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold text-keu-red mb-0.5">
                    {m.marca}
                  </div>
                  <h3 className="font-bold mb-2 leading-tight">
                    {m.modelo} {m.versao}
                  </h3>
                  <div className="flex gap-2 text-xs text-keu-black/60 mb-3 flex-wrap">
                    <span>{m.cilindrada}cc</span>
                    <span>•</span>
                    <span>{m.km.toLocaleString("pt-BR")} km</span>
                    <span>•</span>
                    <span>{m.cor}</span>
                  </div>

                  <div className="space-y-1.5 text-xs mb-3 bg-keu-gray-light rounded-lg p-2.5">
                    <PriceRow label="FIPE" value={m.valorFipe} />
                    <PriceRow
                      label="Anunciado"
                      value={m.valorAnunciado}
                      highlight
                    />
                    {verTudo && (
                      <PriceRow label="Mínimo" value={m.valorMinimo} muted />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/estoque/${m._id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Detalhes
                      </Button>
                    </Link>
                    <Button size="sm" className="flex-1">
                      Vender <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* HISTÓRICO */}
      <Card>
        <div className="p-6 border-b border-keu-black/5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-lg">Histórico de vendas</h2>
            <p className="text-sm text-keu-black/60">
              {verTudo
                ? "Todas as transações registradas"
                : "Suas vendas registradas"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["", "Todas"],
                ["concluida", "Concluídas"],
                ["pendente", "Pendentes"],
                ["cancelada", "Canceladas"],
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
                      ? "px-3 py-1 rounded-full bg-keu-red text-white text-xs font-bold shadow-md"
                      : "px-3 py-1 rounded-full bg-white text-keu-black/70 hover:bg-keu-gray-light text-xs font-medium border border-keu-black/10 transition"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {vendasVisiveis.length === 0 ? (
          <div className="p-16 text-center">
            <ShoppingCart className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
            <h3 className="font-bold mb-1">
              {statusFiltro
                ? `Nenhuma venda ${statusFiltro}`
                : "Nenhuma venda registrada ainda"}
            </h3>
            <p className="text-sm text-keu-black/60 max-w-md mx-auto">
              {statusFiltro
                ? "Mude o filtro de status pra ver outras vendas."
                : verTudo
                ? "Quando vendas forem registradas, aparecem aqui."
                : "Suas vendas registradas aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
                <tr>
                  <th className="text-left p-4">Moto</th>
                  <th className="text-left p-4">Cliente</th>
                  {verTudo && <th className="text-left p-4">Vendedor</th>}
                  <th className="text-left p-4">Data</th>
                  <th className="text-right p-4">Valor</th>
                  <th className="text-right p-4">Comissão</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-keu-black/5">
                {vendasVisiveis.map((v) => (
                  <tr
                    key={v._id}
                    className="hover:bg-keu-gray-light transition"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 text-emerald-600 w-9 h-9 rounded-lg flex items-center justify-center">
                          <Bike className="h-4 w-4" />
                        </div>
                        <div className="font-semibold">
                          {v.motoMarca ? `${v.motoMarca} ` : ""}
                          {v.motoModelo}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>{v.clienteNome}</div>
                      {v.clienteTelefone && (
                        <div className="text-[10px] text-keu-black/50">
                          {v.clienteTelefone}
                        </div>
                      )}
                    </td>
                    {verTudo && (
                      <td className="p-4 text-sm">
                        {v.vendedorNome ?? "—"}
                      </td>
                    )}
                    <td className="p-4 text-sm">
                      {new Date(v.data).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-4 text-right font-bold text-keu-red">
                      {formatCurrency(v.valorVendido)}
                    </td>
                    <td className="p-4 text-right text-sm text-emerald-700">
                      {v.comissao > 0 ? formatCurrency(v.comissao) : "—"}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          v.status === "concluida"
                            ? "success"
                            : v.status === "cancelada"
                            ? "danger"
                            : "warning"
                        }
                        className="text-[10px] uppercase"
                      >
                        {v.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/dashboard/vendas/${v._id}`}>
                        <Button variant="ghost" size="sm">
                          Ver <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className={`p-6 bg-gradient-to-br ${color} text-white border-0`}>
      <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
    </Card>
  );
}

function PriceRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={muted ? "text-keu-black/40" : "text-keu-black/60"}>
        {label}:
      </span>
      <span
        className={
          highlight
            ? "font-black text-keu-red"
            : muted
              ? "text-keu-black/50"
              : "font-semibold"
        }
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function StatusMotoBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { v: "success" | "warning" | "danger" | "info" | "secondary"; l: string }
  > = {
    disponivel: { v: "success", l: "Disponível" },
    reservada: { v: "warning", l: "Reservada" },
    vendida: { v: "danger", l: "Vendida" },
    alugada: { v: "info", l: "Alugada" },
    manutencao: { v: "secondary", l: "Manutenção" },
  };
  const conf = map[status] || { v: "secondary" as const, l: status };
  return <Badge variant={conf.v}>{conf.l}</Badge>;
}
