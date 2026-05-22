"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FileText,
  Search,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { formatCurrency, formatDate, tempoDia } from "@/lib/utils";

interface ContratoApi {
  _id: string;
  aluguelId?: string;
  motoId?: string;
  clienteId?: string;
  contratante: { nome: string; cpf?: string; telefone?: string };
  moto: { marca: string; modelo: string; placa?: string };
  plano: { parcelas: number; valorParcela: number; valorEntrada: number };
  dataContrato: string;
  status: "rascunho" | "ativo" | "assinado" | "rescindido" | "concluido";
  geradoPorNome?: string;
  createdAt: string;
}

const STATUS_VARIANTS: Record<
  ContratoApi["status"],
  { variant: "default" | "success" | "warning" | "danger" | "outline"; label: string; icon: typeof Clock }
> = {
  rascunho: { variant: "outline", label: "Rascunho", icon: Clock },
  ativo: { variant: "warning", label: "Ativo", icon: Clock },
  assinado: { variant: "success", label: "Assinado", icon: CheckCircle2 },
  rescindido: { variant: "danger", label: "Rescindido", icon: XCircle },
  concluido: { variant: "success", label: "Concluído", icon: CheckCircle2 },
};

export default function ContratosPage() {
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  const { data, loading } = useApi<{ contratos: ContratoApi[] }>(
    `/api/contratos${filtroStatus ? `?status=${filtroStatus}` : ""}`
  );

  const contratos = data?.contratos ?? [];
  const filtered = search
    ? contratos.filter((c) => {
        const s = search.toLowerCase();
        return (
          c.contratante.nome.toLowerCase().includes(s) ||
          (c.contratante.cpf ?? "").includes(s) ||
          (c.moto.placa ?? "").toLowerCase().includes(s) ||
          c.moto.marca.toLowerCase().includes(s) ||
          c.moto.modelo.toLowerCase().includes(s)
        );
      })
    : contratos;

  const total = contratos.length;
  const ativos = contratos.filter((c) => c.status === "ativo").length;
  const assinados = contratos.filter((c) => c.status === "assinado").length;
  const rescindidos = contratos.filter((c) => c.status === "rescindido").length;

  return (
    <div>
      <PageHeader
        title="Contratos"
        description="Histórico de contratos de locação gerados pela loja"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0">
          <FileText className="h-5 w-5 mb-2" />
          <div className="text-2xl font-black">{total}</div>
          <div className="text-xs uppercase opacity-90">Total de contratos</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <Clock className="h-5 w-5 mb-2" />
          <div className="text-2xl font-black">{ativos}</div>
          <div className="text-xs uppercase opacity-90">Ativos</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CheckCircle2 className="h-5 w-5 mb-2" />
          <div className="text-2xl font-black">{assinados}</div>
          <div className="text-xs uppercase opacity-90">Assinados</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0">
          <XCircle className="h-5 w-5 mb-2" />
          <div className="text-2xl font-black">{rescindidos}</div>
          <div className="text-xs uppercase opacity-90">Rescindidos</div>
        </Card>
      </div>

      <Card>
        <div className="p-5 border-b border-keu-black/5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <h2 className="font-bold text-lg">Contratos gerados</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
              <Input
                placeholder="Nome, CPF, placa, modelo..."
                className="pl-9 w-72"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-1 flex-wrap text-xs">
            {[
              { v: "", label: `Todos (${total})` },
              { v: "ativo", label: `Ativos (${ativos})` },
              { v: "assinado", label: `Assinados (${assinados})` },
              { v: "rescindido", label: `Rescindidos (${rescindidos})` },
            ].map((p) => (
              <button
                key={p.v}
                onClick={() => setFiltroStatus(p.v)}
                className={`px-3 py-1 rounded-full font-medium transition ${
                  filtroStatus === p.v
                    ? "bg-keu-red text-white"
                    : "bg-keu-gray-light text-keu-black/70 hover:bg-keu-black/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <p className="text-sm text-keu-black/60">Carregando contratos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title={search ? "Nenhum contrato bate a busca" : "Nenhum contrato ainda"}
            description="Contratos são gerados quando você cadastra um aluguel novo e clica em Gerar contrato."
          />
        ) : (
          <div className="divide-y divide-keu-black/5">
            {filtered.map((c) => {
              const cfg = STATUS_VARIANTS[c.status];
              const numero = c._id.slice(-6).toUpperCase();
              return (
                <div
                  key={c._id}
                  className="p-5 hover:bg-keu-gray-light/40 transition flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-keu-black/40">
                        #{numero}
                      </span>
                      <Badge
                        variant={cfg.variant}
                        className="uppercase text-[10px]"
                      >
                        <cfg.icon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                      <span className="text-xs text-keu-black/40">
                        {tempoDia(c.dataContrato)}
                      </span>
                    </div>
                    <div className="font-bold">{c.contratante.nome}</div>
                    <div className="text-xs text-keu-black/60">
                      {c.contratante.cpf} · {c.moto.marca} {c.moto.modelo}
                      {c.moto.placa ? ` · ${c.moto.placa}` : ""}
                    </div>
                    <div className="text-xs text-keu-black/50 mt-1">
                      {c.plano.parcelas}x de {formatCurrency(c.plano.valorParcela)}
                      {c.plano.valorEntrada > 0
                        ? ` + entrada ${formatCurrency(c.plano.valorEntrada)}`
                        : ""}
                      {c.geradoPorNome ? ` · por ${c.geradoPorNome}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a
                      href={`/api/contratos/${c._id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Baixar contrato #${numero} (${formatDate(c.dataContrato)})`}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-keu-red text-white font-semibold hover:bg-keu-red-dark transition"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </a>
                    {c.clienteId && (
                      <Link
                        href={`/dashboard/clientes/${c.clienteId}`}
                        className="inline-flex items-center text-xs px-3 py-1.5 rounded-lg border border-keu-black/10 hover:bg-keu-gray-light"
                      >
                        Ver cliente
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
