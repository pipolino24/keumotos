"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  CalendarClock,
  RotateCcw,
  XCircle,
  Phone,
  Mail,
  FileText,
  DollarSign,
  TrendingUp,
  Banknote,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi, invalidateApiCache } from "@/lib/hooks/use-api";
import { apiPatch, apiDelete } from "@/lib/api-client";

interface ParcelaApi {
  numero: number;
  vencimento: string;
  vencimentoOriginal?: string;
  valor: number;
  valorOriginal?: number;
  acrescimo?: number;
  motivoAcrescimo?: string;
  status: "pendente" | "paga" | "atrasada" | "postergada";
  pagoEm?: string;
  valorPago?: number;
  observacao?: string;
}

interface EmprestimoApi {
  _id: string;
  clienteId?: string;
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  clienteCpf?: string;
  valorEmprestado: number;
  valorTotal: number;
  juros: number;
  taxa: number;
  dataEmprestimo: string;
  dataPrimeiraParcela: string;
  totalParcelas: number;
  frequencia: string;
  parcelas: ParcelaApi[];
  status: "ativo" | "quitado" | "em_atraso" | "cancelado";
  observacoes?: string;
  createdAt: string;
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Deriva o status real comparando datas — backend pode estar stale. */
function statusDerivado(e: EmprestimoApi): EmprestimoApi["status"] {
  if (e.status === "cancelado" || e.status === "quitado") return e.status;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const temAtrasada = e.parcelas.some((p) => {
    if (p.status === "paga") return false;
    const venc = new Date(p.vencimento);
    venc.setHours(0, 0, 0, 0);
    return venc.getTime() < hoje.getTime();
  });
  return temAtrasada ? "em_atraso" : "ativo";
}

/* ============= helper de cores por urgência ============= */

type UrgenciaTone =
  | "paga"
  | "atrasada"
  | "postergada"
  | "urgente" // vence em ≤ 3 dias
  | "normal"; // vence em > 3 dias

interface UrgenciaInfo {
  tone: UrgenciaTone;
  label: string;
  diasRelativo: number; // negativo = atrasada N dias; positivo = vence em N dias
  // Tailwind classes pré-computadas pra esse tom
  bg: string;
  text: string;
  borderL: string;
  badge: "info" | "success" | "danger" | "warning";
}

function diasEntreHojeE(dataIso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataIso);
  venc.setHours(0, 0, 0, 0);
  return Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function urgenciaParcela(p: ParcelaApi): UrgenciaInfo {
  const dias = diasEntreHojeE(p.vencimento);
  if (p.status === "paga") {
    return {
      tone: "paga",
      label: "Paga",
      diasRelativo: dias,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      borderL: "border-l-emerald-500",
      badge: "success",
    };
  }
  if (p.status === "postergada") {
    return {
      tone: "postergada",
      label: dias < 0 ? `Postergada · vencida há ${-dias}d` : `Postergada · vence em ${dias}d`,
      diasRelativo: dias,
      bg: "bg-amber-50",
      text: "text-amber-800",
      borderL: "border-l-amber-500",
      badge: "warning",
    };
  }
  // status pendente ou atrasada — derivamos pelo cálculo de dias
  // pra evitar depender do backend ter rodado o "marca atrasada" recente.
  if (dias < 0 || p.status === "atrasada") {
    return {
      tone: "atrasada",
      label: dias < 0 ? `Em atraso há ${-dias}d` : "Em atraso",
      diasRelativo: dias,
      bg: "bg-red-50",
      text: "text-red-700",
      borderL: "border-l-red-500",
      badge: "danger",
    };
  }
  if (dias <= 3) {
    return {
      tone: "urgente",
      label: dias === 0 ? "Vence hoje" : dias === 1 ? "Vence amanhã" : `Vence em ${dias}d`,
      diasRelativo: dias,
      bg: "bg-amber-50",
      text: "text-amber-800",
      borderL: "border-l-amber-500",
      badge: "warning",
    };
  }
  return {
    tone: "normal",
    label: `Vence em ${dias}d`,
    diasRelativo: dias,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    borderL: "border-l-emerald-500",
    badge: "success",
  };
}

export default function EmprestimoDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, loading, error, refetch } = useApi<{ emprestimo: EmprestimoApi }>(
    id ? `/api/emprestimos/${id}` : null,
    [id]
  );
  const e = data?.emprestimo;

  const [pagarModal, setPagarModal] = useState<{ idx: number; parcela: ParcelaApi } | null>(
    null
  );
  const [postergarModal, setPostergarModal] = useState<{
    idx: number;
    parcela: ParcelaApi;
  } | null>(null);

  const kpis = useMemo(() => {
    if (!e) return null;
    const pagas = e.parcelas.filter((p) => p.status === "paga");
    const totalRecebido = pagas.reduce(
      (acc, p) => acc + (p.valorPago ?? p.valor),
      0
    );
    const totalEmAberto = e.parcelas
      .filter((p) => p.status !== "paga")
      .reduce((acc, p) => acc + p.valor, 0);
    const atrasadas = e.parcelas.filter((p) => p.status === "atrasada");
    const totalAcrescimos = e.parcelas.reduce(
      (acc, p) => acc + (p.acrescimo ?? 0),
      0
    );
    return {
      pagas: pagas.length,
      totalRecebido,
      totalEmAberto,
      atrasadas: atrasadas.length,
      totalAcrescimos,
      progresso: e.totalParcelas > 0 ? (pagas.length / e.totalParcelas) * 100 : 0,
    };
  }, [e]);

  if (loading && !data) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
        <div className="text-sm text-keu-black/60">Carregando empréstimo…</div>
      </div>
    );
  }

  if (error || !e) {
    return (
      <div className="p-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <div className="text-red-600">{error ?? "Empréstimo não encontrado"}</div>
        <Link href="/dashboard/emprestimos" className="text-sm text-keu-red mt-4 inline-block">
          Voltar
        </Link>
      </div>
    );
  }

  async function refreshData() {
    // Invalida cache do detail E da lista — qualquer mutação em parcela
    // muda KPIs agregados (a receber, em atraso, juros) na listagem.
    invalidateApiCache(`/api/emprestimos/${id}`);
    invalidateApiCache("/api/emprestimos");
    refetch();
  }

  async function handleCancelar() {
    if (!confirm("Cancelar este empréstimo? Esta ação registra cancelado mas preserva o histórico."))
      return;
    const r = await apiDelete<{ ok: true }>(`/api/emprestimos/${id}`);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    toast.success("Empréstimo cancelado");
    invalidateApiCache("/api/emprestimos");
    router.push("/dashboard/emprestimos");
  }

  return (
    <div>
      <PageHeader
        title={e.clienteNome}
        description={`Empréstimo · ${formatCurrency(e.valorEmprestado)} → ${formatCurrency(e.valorTotal)} · ${e.totalParcelas}x ${e.frequencia}`}
      >
        <Link href="/dashboard/emprestimos">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
        {e.status !== "cancelado" && (
          <Button variant="destructive" onClick={handleCancelar}>
            <XCircle className="h-4 w-4" /> Cancelar
          </Button>
        )}
      </PageHeader>

      {/* STATUS + INFO CLIENTE */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <div className="flex items-center gap-3">
              <StatusBadge status={statusDerivado(e)} />
              <div className="text-xs text-keu-black/50">
                criado em {formatDate(e.createdAt)}
              </div>
            </div>
            {kpis && (
              <div className="text-right">
                <div className="text-xs text-keu-black/60">progresso</div>
                <div className="font-bold">{kpis.progresso.toFixed(0)}%</div>
              </div>
            )}
          </div>

          {/* Barra de progresso */}
          {kpis && (
            <div className="w-full bg-keu-gray-light rounded-full h-2 mb-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                style={{ width: `${kpis.progresso}%` }}
              />
            </div>
          )}

          {/* Detalhes financeiros */}
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <FinanceRow
              icon={<Banknote className="h-4 w-4" />}
              label="Emprestado"
              value={formatCurrency(e.valorEmprestado)}
            />
            <FinanceRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Total a receber"
              value={formatCurrency(e.valorTotal)}
              accent={
                kpis && kpis.totalAcrescimos > 0 ? "text-amber-700" : undefined
              }
            />
            {kpis && kpis.totalAcrescimos > 0 && (
              <FinanceRow
                icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
                label="Acréscimos (postergações)"
                value={`+ ${formatCurrency(kpis.totalAcrescimos)}`}
                accent="text-amber-700"
              />
            )}
            <FinanceRow
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
              label="Juros"
              value={formatCurrency(e.juros)}
              accent="text-emerald-700"
            />
            <FinanceRow
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
              label="Taxa"
              value={`${e.taxa.toFixed(2)}%`}
              accent="text-emerald-700"
            />
            {kpis && (
              <>
                <FinanceRow
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  label="Já recebido"
                  value={formatCurrency(kpis.totalRecebido)}
                  accent="text-emerald-700"
                />
                <FinanceRow
                  icon={<Clock className="h-4 w-4 text-amber-600" />}
                  label="A receber"
                  value={formatCurrency(kpis.totalEmAberto)}
                  accent="text-amber-700"
                />
              </>
            )}
          </div>

          {e.observacoes && (
            <div className="mt-5 pt-5 border-t border-keu-black/5">
              <div className="text-xs uppercase tracking-wide text-keu-black/50 mb-1">
                <FileText className="h-3 w-3 inline mr-1" />
                Observações
              </div>
              <div className="text-sm text-keu-black/80">{e.observacoes}</div>
            </div>
          )}
        </Card>

        {/* Bloco de contato */}
        <Card className="p-6">
          <h3 className="font-bold mb-4">Contato</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-keu-black/50">
                Nome
              </div>
              <div className="font-medium">{e.clienteNome}</div>
            </div>
            {e.clienteCpf && (
              <div>
                <div className="text-xs uppercase tracking-wide text-keu-black/50">
                  CPF
                </div>
                <div className="font-medium">{e.clienteCpf}</div>
              </div>
            )}
            {e.clienteTelefone && (
              <div>
                <div className="text-xs uppercase tracking-wide text-keu-black/50">
                  Telefone
                </div>
                <a
                  href={`https://wa.me/55${e.clienteTelefone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener"
                  className="font-medium text-keu-red hover:underline inline-flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5" /> {e.clienteTelefone}
                </a>
              </div>
            )}
            {e.clienteEmail && (
              <div>
                <div className="text-xs uppercase tracking-wide text-keu-black/50">
                  Email
                </div>
                <a
                  href={`mailto:${e.clienteEmail}`}
                  className="font-medium text-keu-red hover:underline inline-flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" /> {e.clienteEmail}
                </a>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* PARCELAS */}
      <Card>
        <div className="p-6 border-b border-keu-black/5">
          <h2 className="font-bold text-lg">Parcelas</h2>
          <p className="text-sm text-keu-black/60">
            {kpis?.pagas}/{e.totalParcelas} pagas
            {kpis && kpis.atrasadas > 0 && (
              <span className="text-red-600 font-medium">
                {" "}
                · {kpis.atrasadas} em atraso
              </span>
            )}
          </p>
        </div>

        <div className="divide-y divide-keu-black/5">
          {e.parcelas.map((p, idx) => (
            <ParcelaRow
              key={p.numero}
              parcela={p}
              disabled={e.status === "cancelado"}
              onPagar={() => setPagarModal({ idx, parcela: p })}
              onPostergar={() => setPostergarModal({ idx, parcela: p })}
              onEstornar={async () => {
                if (!confirm(`Estornar pagamento da parcela ${p.numero}?`)) return;
                const r = await apiPatch<{ emprestimo: EmprestimoApi }>(
                  `/api/emprestimos/${id}/parcelas/${idx}`,
                  { action: "estornar" }
                );
                if (r.error) {
                  toast.error(r.error);
                  return;
                }
                toast.success(`Parcela ${p.numero} estornada`);
                refreshData();
              }}
            />
          ))}
        </div>
      </Card>

      {/* MODAL PAGAR */}
      {pagarModal && (
        <PagarModal
          emprestimoId={id}
          parcela={pagarModal.parcela}
          idx={pagarModal.idx}
          onClose={() => setPagarModal(null)}
          onDone={() => {
            setPagarModal(null);
            refreshData();
          }}
        />
      )}

      {/* MODAL POSTERGAR */}
      {postergarModal && (
        <PostergarModal
          emprestimoId={id}
          parcela={postergarModal.parcela}
          idx={postergarModal.idx}
          onClose={() => setPostergarModal(null)}
          onDone={() => {
            setPostergarModal(null);
            refreshData();
          }}
        />
      )}
    </div>
  );
}

/* ============= sub-components ============= */

function StatusBadge({ status }: { status: EmprestimoApi["status"] }) {
  const map = {
    ativo: { v: "info" as const, l: "Ativo", i: <DollarSign className="h-3 w-3" /> },
    quitado: {
      v: "success" as const,
      l: "Quitado",
      i: <CheckCircle2 className="h-3 w-3" />,
    },
    em_atraso: {
      v: "danger" as const,
      l: "Em atraso",
      i: <AlertCircle className="h-3 w-3" />,
    },
    cancelado: { v: "default" as const, l: "Cancelado", i: <XCircle className="h-3 w-3" /> },
  };
  const m = map[status];
  return (
    <Badge variant={m.v}>
      {m.i}
      {m.l}
    </Badge>
  );
}

function FinanceRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-keu-gray-light rounded-lg">
      <div className="flex items-center gap-2 text-keu-black/70">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={`font-bold ${accent ?? "text-keu-black"}`}>{value}</span>
    </div>
  );
}

function ParcelaRow({
  parcela,
  disabled,
  onPagar,
  onPostergar,
  onEstornar,
}: {
  parcela: ParcelaApi;
  disabled: boolean;
  onPagar: () => void;
  onPostergar: () => void;
  onEstornar: () => void;
}) {
  const urg = urgenciaParcela(parcela);
  return (
    <div
      className={`p-5 flex items-center gap-4 flex-wrap border-l-4 ${urg.borderL} ${urg.bg}`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm bg-white ${urg.text} shadow-sm`}
      >
        {parcela.numero}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{formatCurrency(parcela.valor)}</span>
          <Badge variant={urg.badge} className="text-[10px]">
            {urg.label}
          </Badge>
          {parcela.acrescimo !== undefined && parcela.acrescimo > 0 && (
            <Badge variant="warning" className="text-[10px]">
              +{formatCurrency(parcela.acrescimo)} acréscimo
            </Badge>
          )}
        </div>
        {/* Discriminação valor original + acréscimo quando aplicável */}
        {parcela.acrescimo !== undefined &&
          parcela.acrescimo > 0 &&
          parcela.valorOriginal !== undefined && (
            <div className="text-[11px] text-amber-800 mt-0.5">
              {formatCurrency(parcela.valorOriginal)} original{" "}
              <span className="text-amber-700">
                + {formatCurrency(parcela.acrescimo)}
              </span>
              {parcela.motivoAcrescimo && (
                <span className="text-keu-black/60">
                  {" "}
                  · {parcela.motivoAcrescimo}
                </span>
              )}
            </div>
          )}
        <div className="text-xs text-keu-black/60 mt-0.5 flex items-center gap-2 flex-wrap">
          <CalendarClock className="h-3 w-3" /> Vence {formatDate(parcela.vencimento)}
          {parcela.vencimentoOriginal && (
            <span className="text-amber-700">
              (orig: {formatDate(parcela.vencimentoOriginal)})
            </span>
          )}
          {parcela.pagoEm && (
            <span className="text-emerald-700">
              · pago {formatDate(parcela.pagoEm)}
              {parcela.valorPago && parcela.valorPago !== parcela.valor && (
                <span> ({formatCurrency(parcela.valorPago)})</span>
              )}
            </span>
          )}
        </div>
        {parcela.observacao && (
          <div className="text-xs text-keu-black/50 italic mt-1">
            {parcela.observacao}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        {parcela.status !== "paga" && (
          <>
            <Button
              size="sm"
              onClick={onPagar}
              disabled={disabled}
              type="button"
            >
              <CheckCircle2 className="h-4 w-4" /> Pagar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onPostergar}
              disabled={disabled}
              type="button"
            >
              <CalendarClock className="h-4 w-4" /> Postergar
            </Button>
          </>
        )}
        {parcela.status === "paga" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onEstornar}
            disabled={disabled}
            type="button"
          >
            <RotateCcw className="h-4 w-4" /> Estornar
          </Button>
        )}
      </div>
    </div>
  );
}

function PagarModal({
  emprestimoId,
  parcela,
  idx,
  onClose,
  onDone,
}: {
  emprestimoId: string;
  parcela: ParcelaApi;
  idx: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [valorPago, setValorPago] = useState(parcela.valor.toFixed(2));
  const [pagoEm, setPagoEm] = useState(isoToday());
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const r = await apiPatch<{ emprestimo: EmprestimoApi }>(
      `/api/emprestimos/${emprestimoId}/parcelas/${idx}`,
      {
        action: "pagar",
        valorPago: parseFloat(valorPago),
        pagoEm,
        observacao: observacao || undefined,
      }
    );
    setSaving(false);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    toast.success(`Parcela ${parcela.numero} marcada como paga`);
    onDone();
  }

  return (
    <Modal title={`Pagar parcela ${parcela.numero}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <Label required>Valor pago (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={valorPago}
            onChange={(e) => setValorPago(e.target.value)}
          />
          <div className="text-xs text-keu-black/60 mt-1">
            Valor original: {formatCurrency(parcela.valor)}
          </div>
        </div>
        <div>
          <Label required>Data do pagamento</Label>
          <Input
            type="date"
            value={pagoEm}
            onChange={(e) => setPagoEm(e.target.value)}
          />
        </div>
        <div>
          <Label>Observação (opcional)</Label>
          <Textarea
            rows={2}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="ex: pago via PIX, sobrou R$ 5 de troco…"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Confirmar pagamento
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PostergarModal({
  emprestimoId,
  parcela,
  idx,
  onClose,
  onDone,
}: {
  emprestimoId: string;
  parcela: ParcelaApi;
  idx: number;
  onClose: () => void;
  onDone: () => void;
}) {
  // Default: 7 dias depois do vencimento atual
  const defaultDate = useMemo(() => {
    const d = new Date(parcela.vencimento);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, [parcela.vencimento]);

  const [novaData, setNovaData] = useState(defaultDate);
  const [observacao, setObservacao] = useState("");
  const [adicionarAcrescimo, setAdicionarAcrescimo] = useState(false);
  const [acrescimo, setAcrescimo] = useState("");
  const [motivoAcrescimo, setMotivoAcrescimo] = useState("Juros por postergação");
  const [saving, setSaving] = useState(false);

  const acrescimoNum = adicionarAcrescimo ? parseFloat(acrescimo) || 0 : 0;
  const novoValor = parcela.valor + acrescimoNum;

  async function submit() {
    if (adicionarAcrescimo && acrescimoNum < 0) {
      toast.error("Acréscimo não pode ser negativo");
      return;
    }
    setSaving(true);
    const r = await apiPatch<{ emprestimo: EmprestimoApi }>(
      `/api/emprestimos/${emprestimoId}/parcelas/${idx}`,
      {
        action: "postergar",
        novaData,
        observacao: observacao || undefined,
        acrescimo: adicionarAcrescimo && acrescimoNum > 0 ? acrescimoNum : undefined,
        motivoAcrescimo:
          adicionarAcrescimo && acrescimoNum > 0 ? motivoAcrescimo : undefined,
      }
    );
    setSaving(false);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    const msgExtra =
      adicionarAcrescimo && acrescimoNum > 0
        ? ` (+${formatCurrency(acrescimoNum)})`
        : "";
    toast.success(
      `Parcela ${parcela.numero} postergada pra ${formatDate(novaData)}${msgExtra}`
    );
    onDone();
  }

  return (
    <Modal title={`Postergar parcela ${parcela.numero}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>
            Postergar mantém ou aumenta o valor da parcela e gera novo
            vencimento. A data original fica registrada como referência.
          </span>
        </div>
        <div>
          <Label>Vencimento atual</Label>
          <div className="text-sm font-medium">
            {formatDate(parcela.vencimento)} · {formatCurrency(parcela.valor)}
            {parcela.acrescimo && parcela.acrescimo > 0 && (
              <span className="text-amber-700 text-xs ml-2">
                (já tem +{formatCurrency(parcela.acrescimo)} de acréscimo)
              </span>
            )}
          </div>
        </div>
        <div>
          <Label required>Nova data de vencimento</Label>
          <Input
            type="date"
            value={novaData}
            onChange={(e) => setNovaData(e.target.value)}
          />
        </div>

        {/* Acréscimo opcional */}
        <div className="border border-keu-black/10 rounded-lg p-3 bg-keu-gray-light/50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={adicionarAcrescimo}
              onChange={(e) => setAdicionarAcrescimo(e.target.checked)}
              className="h-4 w-4 rounded border-keu-black/30 accent-keu-red"
            />
            <span className="text-sm font-semibold">
              Cobrar juros/multa por essa postergação
            </span>
          </label>
          {adicionarAcrescimo && (
            <div className="mt-3 space-y-3">
              <div>
                <Label>Valor extra (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={acrescimo}
                  onChange={(e) => setAcrescimo(e.target.value)}
                  placeholder="ex: 10.00"
                />
                <div className="text-xs text-keu-black/60 mt-1">
                  Só essa parcela vira{" "}
                  <strong className="text-keu-red">
                    {formatCurrency(novoValor)}
                  </strong>{" "}
                  · valorTotal do empréstimo aumenta em{" "}
                  {formatCurrency(acrescimoNum)}.
                </div>
              </div>
              <div>
                <Label>Motivo</Label>
                <Input
                  value={motivoAcrescimo}
                  onChange={(e) => setMotivoAcrescimo(e.target.value)}
                  placeholder="ex: juros 5% por atraso, multa por adiamento"
                  maxLength={300}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <Label>Motivo da postergação (opcional)</Label>
          <Textarea
            rows={2}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="ex: cliente pediu mais 10 dias, esperando salário…"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
              </>
            ) : (
              <>
                <CalendarClock className="h-4 w-4" /> Confirmar
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-keu-black/40 hover:text-keu-black"
            aria-label="Fechar"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
