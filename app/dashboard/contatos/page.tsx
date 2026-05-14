"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MessageCircle,
  UserPlus,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Globe,
  Users as UsersIcon,
  Loader2,
  Handshake,
} from "lucide-react";
import { toast } from "sonner";
import { Instagram } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";
import { apiPatch } from "@/lib/api-client";

type LeadStatus = "novo" | "em-atendimento" | "convertido" | "perdido";

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

const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novos",
  "em-atendimento": "Em atendimento",
  convertido: "Convertidos",
  perdido: "Perdidos",
};

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

  // Estado local otimista para drag & drop
  const [items, setItems] = useState<ContatoApi[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<LeadStatus | null>(null);

  useEffect(() => {
    // setTimeout 0 contorna react-hooks/set-state-in-effect do React 19
    // sem mudar o comportamento: sincroniza items locais com o fetch
    // quando os dados chegam.
    const t = setTimeout(() => setItems(data?.contatos ?? []), 0);
    return () => clearTimeout(t);
  }, [data]);

  const totalContatos = items.length;
  const novosLeads = items.filter((c) => c.status === "novo").length;
  const emAtendimento = items.filter(
    (c) => c.status === "em-atendimento"
  ).length;
  const convertidos = items.filter((c) => c.status === "convertido").length;
  const taxaConversao = totalContatos
    ? ((convertidos / totalContatos) * 100).toFixed(0)
    : "0";

  async function moverStatus(id: string, novoStatus: LeadStatus) {
    const original = items.find((c) => c._id === id);
    if (!original || original.status === novoStatus) return;

    // Atualização otimista
    setItems((prev) =>
      prev.map((c) => (c._id === id ? { ...c, status: novoStatus } : c))
    );

    const { error: err } = await apiPatch<{ contato: ContatoApi }>(
      `/api/contatos/${id}`,
      { status: novoStatus }
    );

    if (err) {
      // Rollback
      setItems((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, status: original.status } : c
        )
      );
      toast.error(`Não rolou mover: ${err}`);
    } else {
      toast.success(`${original.nome} → ${STATUS_LABEL[novoStatus]}`);
    }
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggingId(null);
    setHoverCol(null);
  }

  function handleDragOver(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (hoverCol !== status) setHoverCol(status);
  }

  function handleDragLeave(status: LeadStatus) {
    if (hoverCol === status) setHoverCol(null);
  }

  function handleDrop(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setHoverCol(null);
    setDraggingId(null);
    if (id) {
      void moverStatus(id, status);
    }
  }

  const colDefs: {
    status: LeadStatus;
    title: string;
    color: string;
    dotColor: string;
  }[] = [
    {
      status: "novo",
      title: "Novos",
      color: "border-blue-500 bg-blue-50/50",
      dotColor: "bg-blue-500",
    },
    {
      status: "em-atendimento",
      title: "Em atendimento",
      color: "border-amber-500 bg-amber-50/50",
      dotColor: "bg-amber-500",
    },
    {
      status: "convertido",
      title: "Convertidos",
      color: "border-emerald-500 bg-emerald-50/50",
      dotColor: "bg-emerald-500",
    },
    {
      status: "perdido",
      title: "Perdidos",
      color: "border-red-300 bg-red-50/50",
      dotColor: "bg-red-300",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contatos & Leads"
        description="Gerencie todos os contatos de potenciais clientes"
      >
        <Link href="/dashboard/contatos/novo">
          <Button>
            <UserPlus className="h-4 w-4" /> Novo contato
          </Button>
        </Link>
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

      {/* PIPELINE DRAG & DROP */}
      <div className="mb-3 flex items-center gap-2 text-xs text-keu-black/60">
        <Handshake className="h-3.5 w-3.5" />
        Arraste os cards entre as colunas para mudar o status do lead.
      </div>
      <div className="grid lg:grid-cols-4 gap-4 mb-8">
        {colDefs.map((col) => (
          <PipelineCol
            key={col.status}
            status={col.status}
            title={col.title}
            color={col.color}
            dotColor={col.dotColor}
            contatos={items.filter((c) => c.status === col.status)}
            draggingId={draggingId}
            isHover={hoverCol === col.status}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={() => handleDragLeave(col.status)}
            onDrop={(e) => handleDrop(e, col.status)}
          />
        ))}
      </div>

      {/* TABELA */}
      <Card>
        <div className="p-6 border-b border-keu-black/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Todos os contatos</h2>
              <p className="text-sm text-keu-black/60">
                {loading
                  ? "Carregando..."
                  : `${totalContatos} contatos registrados`}
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
            <div className="text-sm text-keu-black/60">
              Carregando contatos...
            </div>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-600 text-sm">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <UsersIcon className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
            <h3 className="font-bold mb-1">Nenhum contato encontrado</h3>
            <p className="text-sm text-keu-black/60 mb-4">
              {search || filtroOrigem
                ? "Tente outro filtro."
                : "Comece cadastrando o primeiro contato."}
            </p>
            <Link href="/dashboard/contatos/novo">
              <Button>
                <UserPlus className="h-4 w-4" /> Novo contato
              </Button>
            </Link>
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
                {items.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-keu-gray-light transition"
                  >
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
                        <div className="text-sm font-medium">
                          {c.motoInteresse}
                        </div>
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
                        <a
                          href={`https://wa.me/55${c.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Olá ${c.nome.split(" ")[0]}, sou da KEU Multimarcas.`
                          )}`}
                          target="_blank"
                          rel="noopener"
                          aria-label={`WhatsApp para ${c.nome}`}
                          title="Abrir WhatsApp"
                        >
                          <Button variant="ghost" size="icon" type="button">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </a>
                        <a
                          href={`tel:+55${c.telefone.replace(/\D/g, "")}`}
                          aria-label={`Ligar para ${c.nome}`}
                          title="Ligar"
                        >
                          <Button variant="ghost" size="icon" type="button">
                            <Phone className="h-4 w-4" />
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

interface PipelineColProps {
  status: LeadStatus;
  title: string;
  color: string;
  dotColor: string;
  contatos: ContatoApi[];
  draggingId: string | null;
  isHover: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

function PipelineCol({
  title,
  color,
  dotColor,
  contatos,
  draggingId,
  isHover,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: PipelineColProps) {
  return (
    <Card
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-t-4 ${color} p-4 transition ${
        isHover ? "ring-2 ring-keu-red/40 ring-offset-2" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="font-bold text-sm">{title}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {contatos.length}
        </Badge>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin min-h-20">
        {contatos.length === 0 ? (
          <p className="text-xs text-keu-black/40 text-center py-6 border-2 border-dashed border-keu-black/10 rounded-lg">
            {isHover ? "Solte aqui" : "Nenhum contato"}
          </p>
        ) : (
          contatos.map((c) => (
            <KanbanCard
              key={c._id}
              contato={c}
              dragging={draggingId === c._id}
              onDragStart={(e) => onDragStart(e, c._id)}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </Card>
  );
}

function KanbanCard({
  contato,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  contato: ContatoApi;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const telefoneDigits = contato.telefone.replace(/\D/g, "");
  const waNumber = telefoneDigits.startsWith("55")
    ? telefoneDigits
    : `55${telefoneDigits}`;
  const waText = encodeURIComponent(
    `Olá ${contato.nome}, sou da KEU Multimarcas.`
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waText}`;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white p-3 rounded-lg border transition cursor-grab active:cursor-grabbing select-none ${
        dragging
          ? "opacity-50 border-keu-red/40 shadow-lg"
          : "border-keu-black/5 hover:border-keu-red/20 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-semibold text-sm truncate flex-1">
          {contato.nome}
        </div>
        <MiniOrigemIcon origem={contato.origem} />
      </div>
      <div className="text-xs text-keu-black/60 truncate mb-2">
        {contato.motoInteresse ?? contato.interesse}
      </div>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition"
        title={`WhatsApp ${contato.telefone}`}
      >
        <Phone className="h-3 w-3" />
        {contato.telefone}
      </a>
    </div>
  );
}

function MiniOrigemIcon({ origem }: { origem: string }) {
  const map: Record<
    string,
    { icon: React.ReactNode; title: string; cls: string }
  > = {
    site: {
      icon: <Globe className="h-3 w-3" />,
      title: "Site",
      cls: "bg-slate-100 text-slate-700",
    },
    instagram: {
      icon: <Instagram className="h-3 w-3" />,
      title: "Instagram",
      cls: "bg-pink-100 text-pink-700",
    },
    whatsapp: {
      icon: <MessageCircle className="h-3 w-3" />,
      title: "WhatsApp",
      cls: "bg-emerald-100 text-emerald-700",
    },
    presencial: {
      icon: <UsersIcon className="h-3 w-3" />,
      title: "Presencial",
      cls: "bg-amber-100 text-amber-700",
    },
    indicacao: {
      icon: <Handshake className="h-3 w-3" />,
      title: "Indicação",
      cls: "bg-violet-100 text-violet-700",
    },
  };
  const conf = map[origem] ?? {
    icon: <Globe className="h-3 w-3" />,
    title: origem,
    cls: "bg-keu-gray-light text-keu-black/60",
  };
  return (
    <span
      title={conf.title}
      className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${conf.cls}`}
    >
      {conf.icon}
    </span>
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
    convertido: {
      v: "success",
      l: "Convertido",
      i: <CheckCircle2 className="h-3 w-3" />,
    },
    perdido: {
      v: "danger",
      l: "Perdido",
      i: <XCircle className="h-3 w-3" />,
    },
  };
  const conf = map[status] || { v: "warning" as const, l: status, i: null };
  return (
    <Badge variant={conf.v}>
      {conf.i}
      {conf.l}
    </Badge>
  );
}
