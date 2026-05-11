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
import { getCurrentUser, canSeeFinancialData } from "@/lib/current-user";
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

export default function VendasPage() {
  const me = getCurrentUser();
  const verTudo = canSeeFinancialData(me);
  const [search, setSearch] = useState("");

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

  // TODO(sprint-futura): criar endpoint /api/vendas para listar histórico de
  // vendas. Por ora não há dados reais — mostramos empty state. A regra de
  // visibilidade (admin vê todas, vendedor só as próprias via vendedorId === me.id)
  // já está pronta para consumir o endpoint quando existir.
  const vendasVisiveis: never[] = [];
  const totalVendas = 0;
  const totalFaturado = 0;
  const totalComissao = 0;
  const vendasPendentes = 0;

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

      {/* HISTÓRICO — em construção */}
      <Card>
        <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Histórico de vendas</h2>
            <p className="text-sm text-keu-black/60">
              Todas as transações realizadas
            </p>
          </div>
          <Badge variant="warning">Em construção</Badge>
        </div>
        <div className="p-16 text-center">
          <ShoppingCart className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
          <h3 className="font-bold mb-1">Nenhuma venda registrada ainda</h3>
          <p className="text-sm text-keu-black/60 max-w-md mx-auto">
            {verTudo
              ? "Quando vendas forem registradas, o histórico completo aparecerá aqui."
              : "Suas vendas registradas aparecerão aqui."}{" "}
            O módulo de registro de vendas está em desenvolvimento.
          </p>
          {vendasVisiveis.length === 0 && null}
        </div>
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
