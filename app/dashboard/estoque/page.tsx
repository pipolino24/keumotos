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
  destaque?: boolean;
  fotos?: string[];
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatBlock
          icon={<Package className="h-5 w-5" />}
          gradient="from-keu-red to-keu-red-dark"
          label="Total no estoque"
          value={total}
          sub="motos cadastradas"
        />
        <StatBlock
          icon={<Bike className="h-5 w-5" />}
          gradient="from-emerald-500 to-emerald-600"
          label="Disponíveis"
          value={disponiveis}
          sub="prontas para venda"
        />
        <StatBlock
          icon={<Bike className="h-5 w-5" />}
          gradient="from-amber-500 to-amber-600"
          label="Reservadas"
          value={reservadas}
          sub="aguardando fechamento"
        />
        <StatBlock
          icon={<Bike className="h-5 w-5" />}
          gradient="from-blue-500 to-blue-600"
          label="Alugadas"
          value={alugadas}
          sub="em locação"
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

        {loading && !data ? (
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
          <div className="p-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {motos.map((m) => (
              <MotoCard key={m._id} moto={m} verFinanceiro={verFinanceiro} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatBlock({
  gradient,
  icon,
  label,
  value,
  sub,
}: {
  gradient: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <Card className={`p-6 bg-gradient-to-br ${gradient} text-white border-0`}>
      <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-sm text-white/85 mt-0.5">{label}</div>
      <div className="text-[11px] uppercase tracking-wide text-white/60 mt-1.5">
        {sub}
      </div>
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

function MotoCard({
  moto: m,
  verFinanceiro,
}: {
  moto: MotoApi;
  verFinanceiro: boolean;
}) {
  const fotoCapa =
    Array.isArray(m.fotos) && m.fotos.length > 0 ? m.fotos[0] : undefined;
  return (
    <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col">
      {/* HERO foto/placeholder + badges */}
      <Link
        href={`/dashboard/estoque/${m._id}`}
        className="block aspect-video bg-gradient-to-br from-keu-gray-light via-white to-keu-red/10 relative overflow-hidden"
      >
        {fotoCapa ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={fotoCapa}
            alt={`${m.marca} ${m.modelo}`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Bike className="h-16 w-16 text-keu-red/20" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {m.destaque && (
            <Badge variant="default" className="text-[10px] shadow-md">
              ★ Destaque
            </Badge>
          )}
          <StatusMotoBadge status={m.status} />
        </div>
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur rounded-md px-2 py-0.5 text-xs font-bold shadow-sm">
          {m.anoModelo}
        </div>
      </Link>

      {/* CONTEÚDO */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <div className="text-xs font-bold text-keu-red mb-0.5">
            {m.marca}
          </div>
          <Link
            href={`/dashboard/estoque/${m._id}`}
            className="font-bold leading-tight hover:text-keu-red transition block"
          >
            {m.modelo} {m.versao}
          </Link>
          <div className="text-xs text-keu-black/60 flex flex-wrap gap-x-2 mt-0.5">
            <span>{m.cilindrada}cc</span>
            <span>•</span>
            <span>{m.km.toLocaleString("pt-BR")} km</span>
            <span>•</span>
            <span className="capitalize truncate">{m.cor}</span>
          </div>
        </div>

        {/* PLACA + TIPO */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          {m.placa ? (
            <span className="font-mono font-bold bg-keu-gray-light px-2 py-0.5 rounded">
              {m.placa}
            </span>
          ) : (
            <span className="text-keu-black/40 italic">sem placa</span>
          )}
          <TipoBadge tipo={m.tipo} />
        </div>

        {/* PREÇOS */}
        <div className="bg-keu-gray-light rounded-lg p-2.5 text-xs space-y-1">
          <PriceRow label="FIPE" value={m.valorFipe} />
          <PriceRow label="Anunciado" value={m.valorAnunciado} highlight />
          {verFinanceiro && (
            <>
              <div className="border-t border-keu-black/5 my-1.5" />
              <PriceRow
                label={
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Compra
                  </span>
                }
                value={m.valorCompra}
                muted
              />
              <PriceRow
                label={
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Mínimo
                  </span>
                }
                value={m.valorMinimo}
                muted
              />
            </>
          )}
        </div>

        {/* AÇÕES */}
        <div className="flex gap-2 mt-auto">
          <Link
            href={`/dashboard/estoque/${m._id}`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-3.5 w-3.5" /> Detalhes
            </Button>
          </Link>
          <Link
            href={`/dashboard/estoque/${m._id}/editar`}
            className="flex-1"
          >
            <Button variant="default" size="sm" className="w-full">
              <Edit className="h-3.5 w-3.5" /> Editar
            </Button>
          </Link>
        </div>

        <div className="text-[10px] text-keu-black/40 -mt-1">
          Entrada {formatDate(m.dataEntrada)}
        </div>
      </div>
    </Card>
  );
}

function PriceRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: React.ReactNode;
  value: number;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={
          muted ? "text-keu-black/50" : "text-keu-black/70 font-medium"
        }
      >
        {label}
      </span>
      <span
        className={
          highlight
            ? "font-black text-keu-red text-sm"
            : muted
              ? "text-keu-black/60"
              : "font-semibold text-keu-black"
        }
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}
