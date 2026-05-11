"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  KeyRound,
  Wrench,
  Loader2,
  AlertCircle,
  Bike,
  History,
  Plus,
  AlertTriangle,
  Gauge,
  Calendar,
  User,
  FileText,
  Receipt,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";
import { apiPatch } from "@/lib/api-client";

interface MotoApi {
  _id: string;
  marca: string;
  modelo: string;
  placa?: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  km: number;
  status: string;
}

interface AvariaApi {
  _id?: string;
  descricao: string;
  fotos: string[];
  custoEstimado?: number;
  cobradoCaucao?: boolean;
  reparado?: boolean;
}

interface AluguelApi {
  _id: string;
  clienteNome: string;
  clienteId?: string;
  dataInicio: string;
  dataFim: string;
  dataDevolucao?: string;
  status: "ativo" | "concluido" | "atrasado" | "cancelado";
  valorTotal: number;
  km_inicial: number;
  km_final?: number;
  fotosInicio: string[];
  fotosFim: string[];
  avarias: AvariaApi[];
  observacoes?: string;
  createdAt: string;
}

interface PecaApi {
  nome: string;
  quantidade: number;
  valorUnitario: number;
}

interface ServicoApi {
  descricao: string;
  valor: number;
}

interface RevisaoApi {
  _id: string;
  tipo: "revisao" | "manutencao" | "troca-peca" | "reparo-avaria" | "outro";
  data: string;
  descricao: string;
  pecas: PecaApi[];
  servicos: ServicoApi[];
  custoTotal: number;
  kmNaRevisao: number;
  responsavel?: string;
  notaFiscal?: string;
  fotos: string[];
  observacoes?: string;
}

type TimelineItem =
  | { tipo: "aluguel"; data: string; item: AluguelApi }
  | { tipo: "revisao"; data: string; item: RevisaoApi };

export default function HistoricoMotoPage() {
  const params = useParams();
  const id = params.id as string;

  const motoQuery = useApi<{ moto: MotoApi }>(
    id ? `/api/motos/${id}` : null
  );
  const alugueisQuery = useApi<{ alugueis: AluguelApi[] }>(
    id ? `/api/alugueis?motoId=${id}` : null
  );
  const revisoesQuery = useApi<{ revisoes: RevisaoApi[] }>(
    id ? `/api/revisoes?motoId=${id}` : null
  );

  const moto = motoQuery.data?.moto;
  const alugueis = alugueisQuery.data?.alugueis ?? [];
  const revisoes = revisoesQuery.data?.revisoes ?? [];

  const timeline = useMemo<TimelineItem[]>(() => {
    const itens: TimelineItem[] = [
      ...alugueis.map((a) => ({
        tipo: "aluguel" as const,
        data: a.dataInicio,
        item: a,
      })),
      ...revisoes.map((r) => ({
        tipo: "revisao" as const,
        data: r.data,
        item: r,
      })),
    ];
    itens.sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
    return itens;
  }, [alugueis, revisoes]);

  const stats = useMemo(() => {
    const custoManutencoes = revisoes.reduce(
      (acc, r) => acc + (r.custoTotal || 0),
      0
    );
    const totalAvarias = alugueis.reduce(
      (acc, a) => acc + (a.avarias?.length ?? 0),
      0
    );
    return {
      totalAlugueis: alugueis.length,
      totalRevisoes: revisoes.length,
      custoManutencoes,
      totalAvarias,
    };
  }, [alugueis, revisoes]);

  async function handleMarcarManutencao() {
    try {
      const res = await apiPatch(`/api/motos/${id}`, { status: "manutencao" });
      if (res.error) throw new Error(res.error);
      toast.success("Moto marcada como em manutenção");
      motoQuery.refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar status"
      );
    }
  }

  const loading =
    motoQuery.loading || alugueisQuery.loading || revisoesQuery.loading;
  const error = motoQuery.error || alugueisQuery.error || revisoesQuery.error;

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
        <div className="text-sm text-keu-black/60">Carregando histórico...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          href={`/dashboard/estoque/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à moto
        </Link>
        <Card className="p-8 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold">Erro ao carregar histórico</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!moto) {
    return (
      <div className="p-16 text-center">
        <Bike className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
        <h3 className="font-bold mb-1">Moto não encontrada</h3>
        <Link href="/dashboard/estoque">
          <Button>
            <ArrowLeft className="h-4 w-4" /> Voltar ao estoque
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/dashboard/estoque/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar à moto
      </Link>

      <PageHeader
        title={`Histórico — ${moto.marca} ${moto.modelo}`}
        description={`${moto.placa ?? "Sem placa"} · ${moto.anoFabricacao}/${moto.anoModelo} · ${moto.cor} · ${moto.km.toLocaleString("pt-BR")} km`}
      >
        <Link href={`/dashboard/estoque/${id}`}>
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<KeyRound className="h-5 w-5" />}
          label="Aluguéis"
          value={stats.totalAlugueis}
          color="blue"
        />
        <StatCard
          icon={<Wrench className="h-5 w-5" />}
          label="Revisões"
          value={stats.totalRevisoes}
          color="amber"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Custo manutenções"
          value={formatCurrency(stats.custoManutencoes)}
          color="emerald"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Avarias registradas"
          value={stats.totalAvarias}
          color="red"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          {timeline.length === 0 ? (
            <Card className="p-12 text-center">
              <History className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
              <h3 className="font-bold mb-1">
                Esta moto ainda não tem histórico
              </h3>
              <p className="text-sm text-keu-black/60">
                Aluguéis e revisões aparecerão aqui em ordem cronológica.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {timeline.map((entry, idx) =>
                entry.tipo === "aluguel" ? (
                  <AluguelCard key={`a-${entry.item._id}-${idx}`} aluguel={entry.item} />
                ) : (
                  <RevisaoCard key={`r-${entry.item._id}-${idx}`} revisao={entry.item} />
                )
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-keu-black/60 mb-4">
              Ações rápidas
            </h3>
            <div className="space-y-2">
              <Link
                href={`/dashboard/estoque/${id}/revisao/nova`}
                className="block"
              >
                <Button type="button" className="w-full justify-start">
                  <Plus className="h-4 w-4" /> Registrar revisão
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={handleMarcarManutencao}
                disabled={moto.status === "manutencao"}
              >
                <Wrench className="h-4 w-4" />
                {moto.status === "manutencao"
                  ? "Já em manutenção"
                  : "Marcar manutenção"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: "blue" | "amber" | "emerald" | "red";
}) {
  const colorMap: Record<typeof color, string> = {
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    red: "bg-red-500/10 text-red-600",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-keu-black/60 font-semibold uppercase tracking-wide">
            {label}
          </div>
          <div className="text-lg font-black text-keu-black truncate">
            {value}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AluguelCard({ aluguel }: { aluguel: AluguelApi }) {
  const statusMap: Record<
    AluguelApi["status"],
    { v: "success" | "warning" | "danger" | "info" | "secondary"; l: string }
  > = {
    ativo: { v: "info", l: "Ativo" },
    concluido: { v: "success", l: "Concluído" },
    atrasado: { v: "danger", l: "Atrasado" },
    cancelado: { v: "secondary", l: "Cancelado" },
  };
  const statusConf = statusMap[aluguel.status] || {
    v: "secondary" as const,
    l: aluguel.status,
  };

  const kmRodado =
    aluguel.km_final != null
      ? Math.max(0, aluguel.km_final - aluguel.km_inicial)
      : null;

  return (
    <Card className="overflow-hidden border-blue-200 bg-blue-50/30">
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-blue-500/15 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-black text-lg text-keu-black">
                Alugado para {aluguel.clienteNome}
              </h3>
              <Badge variant={statusConf.v}>{statusConf.l}</Badge>
            </div>
            <div className="text-sm text-keu-black/70 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(aluguel.dataInicio)} → {formatDate(aluguel.dataFim)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <MiniField
            label="Valor"
            value={formatCurrency(aluguel.valorTotal)}
            icon={<DollarSign className="h-3.5 w-3.5" />}
          />
          <MiniField
            label="KM rodado"
            value={
              kmRodado != null ? `${kmRodado.toLocaleString("pt-BR")} km` : "—"
            }
            icon={<Gauge className="h-3.5 w-3.5" />}
          />
          <MiniField
            label="Devolução"
            value={
              aluguel.dataDevolucao ? formatDate(aluguel.dataDevolucao) : "—"
            }
            icon={<Calendar className="h-3.5 w-3.5" />}
          />
        </div>

        {(aluguel.fotosInicio.length > 0 || aluguel.fotosFim.length > 0) && (
          <div className="space-y-3 mb-4">
            {aluguel.fotosInicio.length > 0 && (
              <PhotoStrip
                label="Fotos da retirada"
                fotos={aluguel.fotosInicio}
              />
            )}
            {aluguel.fotosFim.length > 0 && (
              <PhotoStrip
                label="Fotos da devolução"
                fotos={aluguel.fotosFim}
              />
            )}
          </div>
        )}

        {aluguel.avarias && aluguel.avarias.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div className="text-xs font-bold text-red-700 uppercase tracking-wide">
                Avarias ({aluguel.avarias.length})
              </div>
            </div>
            <ul className="space-y-2">
              {aluguel.avarias.map((av, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-keu-black font-medium">
                      {av.descricao}
                    </span>
                    {av.custoEstimado != null && (
                      <span className="font-bold text-red-700">
                        {formatCurrency(av.custoEstimado)}
                      </span>
                    )}
                  </div>
                  {av.fotos && av.fotos.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {av.fotos.map((f, j) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={j}
                          src={f}
                          alt={`Avaria ${i + 1} foto ${j + 1}`}
                          className="w-12 h-12 rounded object-cover border border-red-200"
                        />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href={`/dashboard/aluguel/${aluguel._id}`}
          className="text-sm font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
        >
          Ver detalhes →
        </Link>
      </div>
    </Card>
  );
}

function RevisaoCard({ revisao }: { revisao: RevisaoApi }) {
  const tipoMap: Record<RevisaoApi["tipo"], string> = {
    revisao: "Revisão",
    manutencao: "Manutenção",
    "troca-peca": "Troca de peça",
    "reparo-avaria": "Reparo de avaria",
    outro: "Outro",
  };
  const totalPecas = revisao.pecas.reduce(
    (acc, p) => acc + p.quantidade * p.valorUnitario,
    0
  );
  const totalServicos = revisao.servicos.reduce(
    (acc, s) => acc + s.valor,
    0
  );

  return (
    <Card className="overflow-hidden border-amber-200 bg-amber-50/40">
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-amber-500/15 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-black text-lg text-keu-black">
                {tipoMap[revisao.tipo]}
              </h3>
              <Badge variant="warning">{formatDate(revisao.data)}</Badge>
            </div>
            <p className="text-sm text-keu-black/80 whitespace-pre-wrap">
              {revisao.descricao}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-keu-black/60 font-semibold uppercase tracking-wide">
              Custo total
            </div>
            <div className="text-xl font-black text-amber-700">
              {formatCurrency(revisao.custoTotal)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <MiniField
            label="KM na revisão"
            value={`${revisao.kmNaRevisao.toLocaleString("pt-BR")} km`}
            icon={<Gauge className="h-3.5 w-3.5" />}
          />
          {revisao.responsavel && (
            <MiniField
              label="Responsável"
              value={revisao.responsavel}
              icon={<User className="h-3.5 w-3.5" />}
            />
          )}
          {revisao.notaFiscal && (
            <MiniField
              label="Nota fiscal"
              value={revisao.notaFiscal}
              icon={<Receipt className="h-3.5 w-3.5" />}
            />
          )}
        </div>

        {revisao.pecas.length > 0 && (
          <div className="mb-3 bg-white/80 rounded-lg p-3 border border-amber-200">
            <div className="text-xs font-bold uppercase tracking-wide text-keu-black/60 mb-2">
              Peças trocadas
            </div>
            <ul className="space-y-1">
              {revisao.pecas.map((p, i) => (
                <li
                  key={i}
                  className="text-sm flex items-center justify-between"
                >
                  <span>
                    <span className="font-semibold">{p.nome}</span>{" "}
                    <span className="text-keu-black/50">
                      × {p.quantidade}
                    </span>
                  </span>
                  <span className="font-bold">
                    {formatCurrency(p.quantidade * p.valorUnitario)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-amber-200 text-sm flex justify-between font-bold">
              <span>Subtotal peças</span>
              <span>{formatCurrency(totalPecas)}</span>
            </div>
          </div>
        )}

        {revisao.servicos.length > 0 && (
          <div className="mb-3 bg-white/80 rounded-lg p-3 border border-amber-200">
            <div className="text-xs font-bold uppercase tracking-wide text-keu-black/60 mb-2">
              Serviços
            </div>
            <ul className="space-y-1">
              {revisao.servicos.map((s, i) => (
                <li
                  key={i}
                  className="text-sm flex items-center justify-between"
                >
                  <span className="font-semibold">{s.descricao}</span>
                  <span className="font-bold">{formatCurrency(s.valor)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-amber-200 text-sm flex justify-between font-bold">
              <span>Subtotal serviços</span>
              <span>{formatCurrency(totalServicos)}</span>
            </div>
          </div>
        )}

        {revisao.fotos && revisao.fotos.length > 0 && (
          <PhotoStrip label="Fotos" fotos={revisao.fotos} />
        )}

        {revisao.observacoes && (
          <div className="mt-3 text-sm text-keu-black/70 bg-white/60 rounded-lg p-3 border border-amber-100">
            <div className="flex items-center gap-1.5 mb-1 text-xs font-bold uppercase tracking-wide text-keu-black/60">
              <FileText className="h-3 w-3" /> Observações
            </div>
            <p className="whitespace-pre-wrap">{revisao.observacoes}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function MiniField({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold text-keu-black/50 uppercase tracking-wide mb-0.5 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold text-keu-black truncate">{value}</div>
    </div>
  );
}

function PhotoStrip({ label, fotos }: { label: string; fotos: string[] }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-keu-black/50 uppercase tracking-wide mb-1.5">
        {label}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {fotos.map((f, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={f}
            alt={`${label} ${i + 1}`}
            className="w-14 h-14 rounded object-cover border border-keu-black/10"
          />
        ))}
      </div>
    </div>
  );
}
