"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Handshake,
  UserPlus,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Edit,
  Copy,
  CheckCircle2,
  Pause,
  Ban,
  ExternalLink,
  Loader2,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";

interface AfiliadoItem {
  _id: string;
  codigo: string;
  nome: string;
  email: string;
  telefone: string;
  avatar?: string;
  cidade?: string;
  estado?: string;
  tipoComissao: "percentual" | "fixo";
  comissaoPercentual: number;
  comissaoFixa: number;
  status: "ativo" | "pausado" | "bloqueado";
  aprovado: boolean;
  totalCliques: number;
  totalIndicacoes: number;
  totalVendas: number;
  comissaoAcumulada: number;
  comissaoPaga: number;
  comissaoPendente: number;
  createdAt: string;
}

export default function AfiliadosPage() {
  const [afiliados, setAfiliados] = useState<AfiliadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  useEffect(() => {
    fetchAfiliados();
  }, []);

  async function fetchAfiliados() {
    setLoading(true);
    try {
      const res = await fetch("/api/afiliados");
      const data = await res.json();
      if (res.ok) setAfiliados(data.afiliados);
    } finally {
      setLoading(false);
    }
  }

  function copyLink(codigo: string) {
    const link = `${window.location.origin}/m/${codigo}`;
    navigator.clipboard.writeText(link);
  }

  const filtered = afiliados.filter((a) => {
    if (
      search &&
      !a.nome.toLowerCase().includes(search.toLowerCase()) &&
      !a.email.toLowerCase().includes(search.toLowerCase()) &&
      !a.codigo.includes(search.toLowerCase())
    )
      return false;
    if (filtroStatus && a.status !== filtroStatus) return false;
    return true;
  });

  const stats = {
    total: afiliados.length,
    ativos: afiliados.filter((a) => a.status === "ativo" && a.aprovado).length,
    pendentes: afiliados.filter((a) => !a.aprovado).length,
    comissaoTotal: afiliados.reduce((s, a) => s + a.comissaoAcumulada, 0),
    comissaoPendente: afiliados.reduce(
      (s, a) => s + a.comissaoPendente,
      0
    ),
    vendas: afiliados.reduce((s, a) => s + a.totalVendas, 0),
  };

  return (
    <div>
      <PageHeader
        title="Afiliados"
        description="Pessoas que divulgam motos da KEU e ganham comissão por venda"
      >
        <Link href="/dashboard/afiliados/novo">
          <Button>
            <UserPlus className="h-4 w-4" /> Novo afiliado
          </Button>
        </Link>
      </PageHeader>

      {/* INFO BOX */}
      <Card className="p-5 mb-6 bg-gradient-to-br from-purple-500/5 to-keu-red/5 border-purple-500/20">
        <div className="flex items-start gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-keu-red text-white w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold mb-1">Como funciona o programa</h3>
            <p className="text-sm text-keu-black/70">
              Afiliados recebem um <strong>link único</strong> (ex:{" "}
              <code className="bg-white px-1.5 py-0.5 rounded text-xs">
                keumotos.com/m/joao-silva
              </code>
              ) para divulgar motos. Quando alguém compra usando esse link, o
              afiliado ganha <strong>% ou valor fixo</strong> definido por você.
              Pode ajustar a comissão a qualquer momento.
            </p>
          </div>
        </div>
      </Card>

      {/* STATS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users />}
          label="Total de afiliados"
          value={stats.total.toString()}
          subtitle={`${stats.ativos} ativos`}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          icon={<Clock />}
          label="Pendentes aprovação"
          value={stats.pendentes.toString()}
          subtitle="aguardando análise"
          color="from-amber-500 to-amber-600"
        />
        <StatCard
          icon={<TrendingUp />}
          label="Vendas pelos afiliados"
          value={stats.vendas.toString()}
          subtitle="conversões totais"
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          icon={<DollarSign />}
          label="Comissões a pagar"
          value={formatCurrency(stats.comissaoPendente)}
          subtitle={`de ${formatCurrency(stats.comissaoTotal)} acumulado`}
          color="from-keu-red to-keu-red-dark"
        />
      </div>

      {/* SEARCH & FILTER */}
      <Card className="mb-6">
        <div className="p-5 border-b border-keu-black/5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-bold text-lg">Lista de afiliados</h2>
              <p className="text-sm text-keu-black/60">
                {filtered.length} afiliados encontrados
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
              <Input
                placeholder="Nome, email ou código..."
                className="pl-9 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <FilterBadge
              label={`Todos (${afiliados.length})`}
              active={!filtroStatus}
              onClick={() => setFiltroStatus("")}
            />
            <FilterBadge
              label={`Ativos (${afiliados.filter((a) => a.status === "ativo").length})`}
              active={filtroStatus === "ativo"}
              onClick={() => setFiltroStatus("ativo")}
            />
            <FilterBadge
              label={`Pausados (${afiliados.filter((a) => a.status === "pausado").length})`}
              active={filtroStatus === "pausado"}
              onClick={() => setFiltroStatus("pausado")}
            />
            <FilterBadge
              label={`Bloqueados (${afiliados.filter((a) => a.status === "bloqueado").length})`}
              active={filtroStatus === "bloqueado"}
              onClick={() => setFiltroStatus("bloqueado")}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <div className="text-sm text-keu-black/60">
              Carregando afiliados...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
                <tr>
                  <th className="text-left p-4">Afiliado</th>
                  <th className="text-left p-4">Link</th>
                  <th className="text-right p-4">Comissão</th>
                  <th className="text-center p-4">Cliques</th>
                  <th className="text-center p-4">Vendas</th>
                  <th className="text-right p-4">Comissão Acum.</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-keu-black/5">
                {filtered.map((a) => (
                  <tr key={a._id} className="hover:bg-keu-gray-light transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-500 to-keu-red text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                          {a.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{a.nome}</div>
                          <div className="text-xs text-keu-black/60">
                            {a.email}
                          </div>
                          {a.cidade && (
                            <div className="text-xs text-keu-black/60">
                              {a.cidade}
                              {a.estado && ` - ${a.estado}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <code className="bg-keu-gray-light px-2 py-1 rounded text-xs font-mono">
                          /m/{a.codigo}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyLink(a.codigo)}
                          title="Copiar link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-bold text-keu-red">
                        {a.tipoComissao === "percentual"
                          ? `${a.comissaoPercentual}%`
                          : formatCurrency(a.comissaoFixa)}
                      </div>
                      <div className="text-xs text-keu-black/60 capitalize">
                        {a.tipoComissao}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-semibold">{a.totalCliques}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-bold text-emerald-600">
                        {a.totalVendas}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-bold">
                        {formatCurrency(a.comissaoAcumulada)}
                      </div>
                      {a.comissaoPendente > 0 && (
                        <div className="text-xs text-amber-600">
                          {formatCurrency(a.comissaoPendente)} pendente
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge
                        status={a.status}
                        aprovado={a.aprovado}
                      />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/afiliados/${a._id}`}>
                          <Button variant="ghost" size="icon" title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <a
                          href={`/m/${a.codigo}`}
                          target="_blank"
                          rel="noopener"
                        >
                          <Button variant="ghost" size="icon" title="Abrir página">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
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

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <Card className={`p-6 bg-gradient-to-br ${color} text-white border-0`}>
      <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm text-white/90 font-semibold">{label}</div>
      <div className="text-xs text-white/70 mt-0.5">{subtitle}</div>
    </Card>
  );
}

function FilterBadge({
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

function StatusBadge({
  status,
  aprovado,
}: {
  status: string;
  aprovado: boolean;
}) {
  if (!aprovado) {
    return (
      <Badge variant="warning">
        <Clock className="h-3 w-3" /> Pendente
      </Badge>
    );
  }
  const map: Record<
    string,
    { v: "success" | "warning" | "danger"; l: string; i: React.ReactNode }
  > = {
    ativo: { v: "success", l: "Ativo", i: <CheckCircle2 className="h-3 w-3" /> },
    pausado: { v: "warning", l: "Pausado", i: <Pause className="h-3 w-3" /> },
    bloqueado: { v: "danger", l: "Bloqueado", i: <Ban className="h-3 w-3" /> },
  };
  const conf = map[status] || { v: "warning" as const, l: status, i: null };
  return (
    <Badge variant={conf.v}>
      {conf.i}
      {conf.l}
    </Badge>
  );
}

function EmptyState() {
  return (
    <div className="p-16 text-center">
      <div className="bg-gradient-to-br from-purple-500 to-keu-red w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Handshake className="h-8 w-8 text-white" />
      </div>
      <h3 className="font-bold text-lg mb-1">Nenhum afiliado cadastrado</h3>
      <p className="text-sm text-keu-black/60 mb-6 max-w-sm mx-auto">
        Cadastre pessoas que vão divulgar suas motos e definam o quanto cada
        uma vai receber por venda fechada.
      </p>
      <Link href="/dashboard/afiliados/novo">
        <Button>
          <UserPlus className="h-4 w-4" /> Cadastrar primeiro afiliado
        </Button>
      </Link>
    </div>
  );
}
