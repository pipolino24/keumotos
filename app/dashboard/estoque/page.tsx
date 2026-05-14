"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Bike,
  Edit,
  Eye,
  Lock,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  placa?: string;
  chassi?: string;
  renavam?: string;
  cilindrada: number;
  cambio: string;
  km: number;
  combustivel: string;
  valorFipe: number;
  valorCompra: number;
  valorAnunciado: number;
  valorMinimo: number;
  tipo: string;
  status: string;
  origem: string;
  dataEntrada: string;
}

export default function EstoquePage() {
  const verFinanceiro = canSeeFinancialData(useCurrentUser());
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const params = new URLSearchParams();
  if (filtroStatus) params.set("status", filtroStatus);
  if (filtroTipo) params.set("tipo", filtroTipo);
  if (search) params.set("q", search);
  const url = `/api/motos${params.toString() ? `?${params}` : ""}`;
  const { data, loading, error } = useApi<{ motos: MotoApi[] }>(url, [
    filtroStatus,
    filtroTipo,
    search,
  ]);

  const motos = data?.motos ?? [];
  const total = motos.length;
  const disponiveis = motos.filter((m) => m.status === "disponivel").length;
  const reservadas = motos.filter((m) => m.status === "reservada").length;
  const alugadas = motos.filter((m) => m.status === "alugada").length;

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Catálogo de motos cadastradas"
      >
        <Link href="/dashboard/estoque/novo">
          <Button>
            <Plus className="h-4 w-4" /> Cadastrar Moto
          </Button>
        </Link>
      </PageHeader>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBlock
          icon={<Package className="h-5 w-5" />}
          color="bg-keu-red/10 text-keu-red"
          label="Total no estoque"
          value={total}
          sub="motos cadastradas"
        />
        <StatBlock
          icon={<Bike className="h-5 w-5" />}
          color="bg-emerald-500/10 text-emerald-600"
          label="Disponíveis"
          value={disponiveis}
          sub="prontas para venda"
          valueColor="text-emerald-600"
        />
        <StatBlock
          icon={<Bike className="h-5 w-5" />}
          color="bg-amber-500/10 text-amber-600"
          label="Reservadas"
          value={reservadas}
          sub="aguardando fechamento"
          valueColor="text-amber-600"
        />
        <StatBlock
          icon={<Bike className="h-5 w-5" />}
          color="bg-blue-500/10 text-blue-600"
          label="Alugadas"
          value={alugadas}
          sub="em locação"
          valueColor="text-blue-600"
        />
      </div>

      {!verFinanceiro && (
        <Card className="mb-6 p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2 text-sm text-amber-900">
            <Lock className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>Visão do vendedor:</strong> custos de compra, margem e
              receita potencial só ficam visíveis para administradores.
            </span>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6 border-b border-keu-black/5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-bold text-lg">Catálogo</h2>
              <p className="text-sm text-keu-black/60">
                {loading ? "Carregando..." : `${total} motos no sistema`}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  placeholder="Marca, modelo, placa..."
                  className="pl-9 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Pill
              label={`Todas (${total})`}
              active={!filtroStatus && !filtroTipo}
              onClick={() => {
                setFiltroStatus("");
                setFiltroTipo("");
              }}
            />
            <Pill
              label="Venda"
              active={filtroTipo === "venda"}
              onClick={() => setFiltroTipo("venda")}
            />
            <Pill
              label="Aluguel"
              active={filtroTipo === "aluguel"}
              onClick={() => setFiltroTipo("aluguel")}
            />
            <Pill
              label="Disponíveis"
              active={filtroStatus === "disponivel"}
              onClick={() => setFiltroStatus("disponivel")}
            />
            <Pill
              label="Reservadas"
              active={filtroStatus === "reservada"}
              onClick={() => setFiltroStatus("reservada")}
            />
            <Pill
              label="Manutenção"
              active={filtroStatus === "manutencao"}
              onClick={() => setFiltroStatus("manutencao")}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <div className="text-sm text-keu-black/60">Carregando motos...</div>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-600 text-sm">{error}</div>
        ) : motos.length === 0 ? (
          <div className="p-16 text-center">
            <Bike className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
            <h3 className="font-bold mb-1">Nenhuma moto encontrada</h3>
            <p className="text-sm text-keu-black/60 mb-4">
              {search || filtroStatus || filtroTipo
                ? "Tente outro filtro."
                : "Comece cadastrando a primeira moto."}
            </p>
            <Link href="/dashboard/estoque/novo">
              <Button>
                <Plus className="h-4 w-4" /> Cadastrar moto
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
                <tr>
                  <th className="text-left p-4">Moto</th>
                  <th className="text-left p-4">Documentação</th>
                  <th className="text-left p-4">Técnico</th>
                  <th className="text-right p-4">FIPE</th>
                  {verFinanceiro && (
                    <th className="text-right p-4 bg-keu-red/5">
                      <span className="flex items-center gap-1 justify-end">
                        <Lock className="h-3 w-3" /> Compra
                      </span>
                    </th>
                  )}
                  <th className="text-right p-4">Anunciado</th>
                  {verFinanceiro && (
                    <th className="text-right p-4 bg-keu-red/5">
                      <span className="flex items-center gap-1 justify-end">
                        <Lock className="h-3 w-3" /> Mínimo
                      </span>
                    </th>
                  )}
                  <th className="text-left p-4">Tipo</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Entrada</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-keu-black/5">
                {motos.map((m) => (
                  <tr key={m._id} className="hover:bg-keu-gray-light transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bike className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-keu-red font-bold">
                            {m.marca}
                          </div>
                          <div className="font-semibold">
                            {m.modelo} {m.versao}
                          </div>
                          <div className="text-xs text-keu-black/60">
                            {m.anoFabricacao}/{m.anoModelo} · {m.cor}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs">
                      {m.placa && (
                        <div className="font-mono font-bold">{m.placa}</div>
                      )}
                      {m.chassi && (
                        <div className="text-keu-black/60 font-mono">
                          {m.chassi.slice(0, 10)}...
                        </div>
                      )}
                      {m.renavam && (
                        <div className="text-keu-black/60">
                          RV: {m.renavam.slice(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-xs">
                      <div>
                        {m.cilindrada}cc · {m.cambio}
                      </div>
                      <div className="text-keu-black/60">
                        {m.km.toLocaleString("pt-BR")} km
                      </div>
                      <div className="text-keu-black/60 capitalize">
                        {m.combustivel}
                      </div>
                    </td>
                    <td className="p-4 text-right text-sm">
                      {formatCurrency(m.valorFipe)}
                    </td>
                    {verFinanceiro && (
                      <td className="p-4 text-right text-sm text-keu-black/60 bg-keu-red/5">
                        {formatCurrency(m.valorCompra)}
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <div className="font-black text-keu-red">
                        {formatCurrency(m.valorAnunciado)}
                      </div>
                    </td>
                    {verFinanceiro && (
                      <td className="p-4 text-right text-xs text-keu-black/50 bg-keu-red/5">
                        {formatCurrency(m.valorMinimo)}
                      </td>
                    )}
                    <td className="p-4">
                      <TipoBadge tipo={m.tipo} />
                    </td>
                    <td className="p-4">
                      <StatusMotoBadge status={m.status} />
                    </td>
                    <td className="p-4 text-xs text-keu-black/60">
                      {formatDate(m.dataEntrada)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/estoque/${m._id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/estoque/${m._id}/editar`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
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

function StatBlock({
  icon,
  color,
  label,
  value,
  sub,
  valueColor,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number;
  sub: string;
  valueColor?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-keu-black/60">{label}</span>
      </div>
      <div className={`text-3xl font-black ${valueColor ?? ""}`}>{value}</div>
      <div className="text-xs text-keu-black/60 mt-1">{sub}</div>
    </Card>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
        active
          ? "bg-keu-red text-white"
          : "border border-keu-black/20 text-keu-black hover:bg-keu-gray-light"
      }`}
    >
      {label}
    </button>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  const map: Record<string, { v: "default" | "info" | "secondary"; l: string }> =
    {
      venda: { v: "default", l: "Venda" },
      aluguel: { v: "info", l: "Aluguel" },
      ambos: { v: "secondary", l: "Ambos" },
    };
  const conf = map[tipo] || { v: "secondary" as const, l: tipo };
  return (
    <Badge variant={conf.v} className="text-[10px]">
      {conf.l}
    </Badge>
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
    devolvida: { v: "secondary", l: "Devolvida" },
  };
  const conf = map[status] || { v: "secondary" as const, l: status };
  return (
    <Badge variant={conf.v} className="text-[10px]">
      {conf.l}
    </Badge>
  );
}
