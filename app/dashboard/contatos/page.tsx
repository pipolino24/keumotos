"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  MessageCircle,
  UserPlus,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Globe,
  Users as UsersIcon,
  Loader2,
} from "lucide-react";
import { Instagram } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";

interface ContatoApi {
  _id: string;
  nome: string;
  telefone: string;
  email?: string;
  origem: string;
  interesse: string;
  motoInteresse?: string;
  observacoes?: string;
  status: string;
  vendedorResponsavel?: string;
  createdAt: string;
}

export default function ContatosPage() {
  const [search, setSearch] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("");

  const params = new URLSearchParams();
  if (filtroOrigem) params.set("origem", filtroOrigem);
  if (search) params.set("q", search);
  const url = `/api/contatos${params.toString() ? `?${params}` : ""}`;
  const { data, loading, error } = useApi<{ contatos: ContatoApi[] }>(url, [
    filtroOrigem,
    search,
  ]);

  const contatos = data?.contatos ?? [];
  const totalContatos = contatos.length;
  const novosLeads = contatos.filter((c) => c.status === "novo").length;
  const emAtendimento = contatos.filter(
    (c) => c.status === "em-atendimento"
  ).length;
  const convertidos = contatos.filter(
    (c) => c.status === "convertido"
  ).length;
  const taxaConversao = totalContatos
    ? ((convertidos / totalContatos) * 100).toFixed(0)
    : "0";

  return (
    <div>
      <PageHeader
        title="Contatos & Leads"
        description="Gerencie todos os contatos de potenciais clientes"
      >
        <Button variant="outline">
          <Mail className="h-4 w-4" /> Enviar campanha
        </Button>
        <Button>
          <UserPlus className="h-4 w-4" /> Novo contato
        </Button>
      </PageHeader>

      {/* STATS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox
          icon={<UsersIcon />}
          label="Total de leads"
          value={totalContatos.toString()}
          color="from-keu-red to-keu-red-dark"
        />
        <StatBox
          icon={<TrendingUp />}
          label="Leads novos"
          value={novosLeads.toString()}
          color="from-blue-500 to-blue-600"
        />
        <StatBox
          icon={<Clock />}
          label="Em atendimento"
          value={emAtendimento.toString()}
          color="from-amber-500 to-amber-600"
        />
        <StatBox
          icon={<CheckCircle2 />}
          label="Taxa conversão"
          value={`${taxaConversao}%`}
          color="from-emerald-500 to-emerald-600"
        />
      </div>

      {/* PIPELINE */}
      <div className="grid lg:grid-cols-4 gap-4 mb-8">
        <PipelineCol
          title="Novos"
          count={contatos.filter((c) => c.status === "novo").length}
          color="border-blue-500 bg-blue-50/50"
          dotColor="bg-blue-500"
          contatos={contatos.filter((c) => c.status === "novo")}
        />
        <PipelineCol
          title="Em atendimento"
          count={contatos.filter((c) => c.status === "em-atendimento").length}
          color="border-amber-500 bg-amber-50/50"
          dotColor="bg-amber-500"
          contatos={contatos.filter((c) => c.status === "em-atendimento")}
        />
        <PipelineCol
          title="Convertidos"
          count={contatos.filter((c) => c.status === "convertido").length}
          color="border-emerald-500 bg-emerald-50/50"
          dotColor="bg-emerald-500"
          contatos={contatos.filter((c) => c.status === "convertido")}
        />
        <PipelineCol
          title="Perdidos"
          count={contatos.filter((c) => c.status === "perdido").length}
          color="border-red-300 bg-red-50/50"
          dotColor="bg-red-300"
          contatos={contatos.filter((c) => c.status === "perdido")}
        />
      </div>

      {/* TABELA */}
      <Card>
        <div className="p-6 border-b border-keu-black/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Todos os contatos</h2>
              <p className="text-sm text-keu-black/60">
                {loading ? "Carregando..." : `${totalContatos} contatos registrados`}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  placeholder="Nome, telefone ou email..."
                  className="pl-9 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4" /> Filtros
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <OrigemPill
              label="Todas as origens"
              active={!filtroOrigem}
              onClick={() => setFiltroOrigem("")}
            />
            <OrigemPill
              label="Site"
              icon={<Globe className="h-3 w-3" />}
              active={filtroOrigem === "site"}
              onClick={() => setFiltroOrigem("site")}
            />
            <OrigemPill
              label="Instagram"
              icon={<Instagram className="h-3 w-3" />}
              active={filtroOrigem === "instagram"}
              onClick={() => setFiltroOrigem("instagram")}
            />
            <OrigemPill
              label="WhatsApp"
              icon={<MessageCircle className="h-3 w-3" />}
              active={filtroOrigem === "whatsapp"}
              onClick={() => setFiltroOrigem("whatsapp")}
            />
            <OrigemPill
              label="Presencial"
              active={filtroOrigem === "presencial"}
              onClick={() => setFiltroOrigem("presencial")}
            />
            <OrigemPill
              label="Indicação"
              active={filtroOrigem === "indicacao"}
              onClick={() => setFiltroOrigem("indicacao")}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <div className="text-sm text-keu-black/60">Carregando contatos...</div>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-600 text-sm">{error}</div>
        ) : contatos.length === 0 ? (
          <div className="p-16 text-center">
            <UsersIcon className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
            <h3 className="font-bold mb-1">Nenhum contato encontrado</h3>
            <p className="text-sm text-keu-black/60 mb-4">
              {search || filtroOrigem
                ? "Tente outro filtro."
                : "Comece cadastrando o primeiro contato."}
            </p>
            <Button>
              <UserPlus className="h-4 w-4" /> Novo contato
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
                <tr>
                  <th className="text-left p-4">Contato</th>
                  <th className="text-left p-4">Origem</th>
                  <th className="text-left p-4">Interesse</th>
                  <th className="text-left p-4">Moto / Observação</th>
                  <th className="text-left p-4">Vendedor</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Cadastrado</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-keu-black/5">
                {contatos.map((c) => (
                  <tr key={c._id} className="hover:bg-keu-gray-light transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-keu-red text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm">
                          {c.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold">{c.nome}</div>
                          <div className="text-xs text-keu-black/60 flex items-center gap-2">
                            <Phone className="h-3 w-3" /> {c.telefone}
                          </div>
                          {c.email && (
                            <div className="text-xs text-keu-black/60 flex items-center gap-2">
                              <Mail className="h-3 w-3" /> {c.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <OrigemBadge origem={c.origem} />
                    </td>
                    <td className="p-4">
                      <InteresseBadge interesse={c.interesse} />
                    </td>
                    <td className="p-4 max-w-xs">
                      {c.motoInteresse && (
                        <div className="text-sm font-medium">{c.motoInteresse}</div>
                      )}
                      {c.observacoes && (
                        <div className="text-xs text-keu-black/60 truncate">
                          {c.observacoes}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {c.vendedorResponsavel ?? (
                        <span className="text-keu-black/40">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-4 text-xs text-keu-black/60">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Phone className="h-4 w-4" />
                        </Button>
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

function PipelineCol({
  title,
  count,
  color,
  dotColor,
  contatos,
}: {
  title: string;
  count: number;
  color: string;
  dotColor: string;
  contatos: ContatoApi[];
}) {
  return (
    <Card className={`border-t-4 ${color} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="font-bold text-sm">{title}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {count}
        </Badge>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
        {contatos.length === 0 ? (
          <p className="text-xs text-keu-black/40 text-center py-4">
            Nenhum contato
          </p>
        ) : (
          contatos.map((c) => (
            <div
              key={c._id}
              className="bg-white p-3 rounded-lg border border-keu-black/5 hover:border-keu-red/20 transition cursor-pointer"
            >
              <div className="font-semibold text-sm truncate">{c.nome}</div>
              <div className="text-xs text-keu-black/60 truncate">
                {c.motoInteresse ?? c.interesse}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function OrigemPill({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-semibold transition inline-flex items-center gap-1 ${
        active
          ? "bg-keu-red text-white"
          : "border border-keu-black/20 text-keu-black hover:bg-keu-gray-light"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function OrigemBadge({ origem }: { origem: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string }> = {
    site: { icon: <Globe className="h-3 w-3" />, label: "Site" },
    instagram: { icon: <Instagram className="h-3 w-3" />, label: "Instagram" },
    whatsapp: { icon: <MessageCircle className="h-3 w-3" />, label: "WhatsApp" },
    presencial: { icon: null, label: "Presencial" },
    indicacao: { icon: null, label: "Indicação" },
  };
  const conf = map[origem] || { icon: null, label: origem };
  return (
    <Badge variant="outline" className="text-xs">
      {conf.icon}
      {conf.label}
    </Badge>
  );
}

function InteresseBadge({ interesse }: { interesse: string }) {
  const map: Record<string, "default" | "info" | "warning" | "secondary"> = {
    compra: "default",
    venda: "secondary",
    troca: "warning",
    aluguel: "info",
    pecas: "secondary",
  };
  const labels: Record<string, string> = {
    compra: "Compra",
    venda: "Venda",
    troca: "Troca",
    aluguel: "Aluguel",
    pecas: "Peças",
    outro: "Outro",
  };
  return (
    <Badge variant={map[interesse] || "secondary"} className="text-xs">
      {labels[interesse] || interesse}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { v: "info" | "warning" | "success" | "danger"; l: string; i: React.ReactNode }
  > = {
    novo: { v: "info", l: "Novo", i: <Clock className="h-3 w-3" /> },
    "em-atendimento": {
      v: "warning",
      l: "Em atendimento",
      i: <MessageCircle className="h-3 w-3" />,
    },
    convertido: { v: "success", l: "Convertido", i: <CheckCircle2 className="h-3 w-3" /> },
    perdido: { v: "danger", l: "Perdido", i: <XCircle className="h-3 w-3" /> },
  };
  const conf = map[status] || { v: "warning" as const, l: status, i: null };
  return (
    <Badge variant={conf.v}>
      {conf.i}
      {conf.l}
    </Badge>
  );
}
