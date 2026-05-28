"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  Gauge,
  Camera,
  FileText,
  DollarSign,
  User,
  Phone,
  KeyRound,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { PageHeader } from "@/components/dashboard/page-header";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";
import { apiPost } from "@/lib/api-client";

interface AvariaApi {
  _id?: string;
  descricao: string;
  fotos: string[];
  custoEstimado?: number;
  cobradoCaucao?: boolean;
  reparado?: boolean;
  registradoEm?: string;
}

interface ParcelaApi {
  _id?: string;
  numero: number;
  vencimento: string;
  valor: number;
  status: "pendente" | "paga" | "atrasada";
  pagoEm?: string;
  valorPago?: number;
  multa?: number;
  juros?: number;
  formaPagamento?: string;
  observacao?: string;
}

interface AluguelApi {
  _id: string;
  motoId: string;
  motoModelo: string;
  motoMarca?: string;
  motoAno?: number;

  clienteId?: string;
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;

  vendedorNome?: string;

  dataInicio: string;
  dataFim: string;
  dataConclusao?: string;
  dataDevolucao?: string; // alias legado

  diasContratados: number;
  modalidadeAplicada?: "diaria" | "semanal" | "mensal";
  valorTotal: number;

  // Locação periódica
  valorParcela?: number;
  numeroParcelas?: number;
  parcelasPagas?: number;
  frequenciaParcela?: "semanal" | "quinzenal" | "mensal" | "personalizada";
  cicloDias?: number;
  proximaParcelaEm?: string;
  parcelasLocacao?: ParcelaApi[];
  multaPorAtrasoPercent?: number;
  jurosDiaPercent?: number;
  // Legados (Plano Conquista — só pra ler docs antigos)
  tipoPlano?: "conquista" | "venda-direta";
  valorEntrada?: number;
  dataEntrada?: string;

  km_inicial: number;
  km_final?: number;
  caucao?: number;

  fotosInicio: string[];
  fotosFim: string[];
  observacoesInicio?: string;
  observacoesFim?: string;

  avarias: AvariaApi[];
  custoTotalAvarias?: number;
  multaAtraso?: number;

  status: "ativo" | "concluido" | "atrasado" | "cancelado";
  observacoes?: string;
}

interface AvariaForm {
  descricao: string;
  custoEstimado: number | "";
  fotos: string[];
  cobradoCaucao: boolean;
}

const onlyDigits = (s?: string) => (s ?? "").replace(/\D/g, "");

export default function AluguelDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const { data, loading, error, refetch } = useApi<{ aluguel: AluguelApi }>(
    id ? `/api/alugueis/${id}` : null
  );
  const [modalOpen, setModalOpen] = useState(false);

  const aluguel = data?.aluguel;

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
        <div className="text-sm text-keu-black/60">Carregando locação...</div>
      </div>
    );
  }

  if (error || !aluguel) {
    return (
      <div>
        <Link
          href="/dashboard/aluguel"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para aluguel
        </Link>
        <Card className="p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-bold mb-1">Locação não encontrada</h3>
          <p className="text-sm text-keu-black/60">
            {error ?? "Verifique se o link está correto."}
          </p>
        </Card>
      </div>
    );
  }

  const isAtivo = aluguel.status === "ativo" || aluguel.status === "atrasado";
  const isConcluido = aluguel.status === "concluido";
  const kmRodado =
    aluguel.km_final !== undefined && aluguel.km_final !== null
      ? Math.max(0, aluguel.km_final - aluguel.km_inicial)
      : null;

  return (
    <div>
      <Link
        href="/dashboard/aluguel"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para aluguel
      </Link>

      <PageHeader
        title={
          <span>
            {aluguel.motoMarca ? `${aluguel.motoMarca} ` : ""}
            {aluguel.motoModelo}
            <span className="text-keu-black/40"> — </span>
            <span className="text-keu-black/70">{aluguel.clienteNome}</span>
          </span>
        }
        description={`Locação #${aluguel._id.slice(-6).toUpperCase()}`}
      >
        <ContratosBotao aluguelId={aluguel._id} />
        <AluguelStatusBadge status={aluguel.status} />
      </PageHeader>

      {isAtivo && (
        <div className="mb-6">
          <Button
            type="button"
            variant="destructive"
            size="xl"
            className="w-full md:w-auto"
            onClick={() => setModalOpen(true)}
          >
            <KeyRound className="h-5 w-5" /> Concluir contrato
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* COLUNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          {/* VISTORIA DE RETIRADA */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Vistoria de retirada</h2>
                <p className="text-sm text-keu-black/60">
                  Estado da moto na entrega ao cliente
                </p>
              </div>
            </div>

            {aluguel.fotosInicio && aluguel.fotosInicio.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {aluguel.fotosInicio.map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-square rounded-xl overflow-hidden bg-keu-gray-light border border-keu-black/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Vistoria ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-sm text-keu-black/60 italic mb-4">
                Sem fotos registradas na retirada.
              </div>
            )}

            {aluguel.observacoesInicio && (
              <div className="p-4 bg-keu-gray-light rounded-lg">
                <div className="text-xs uppercase tracking-wide font-semibold text-keu-black/60 mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Observações da retirada
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {aluguel.observacoesInicio}
                </p>
              </div>
            )}
          </Card>

          {/* VISTORIA DE DEVOLUÇÃO (só se concluido) */}
          {isConcluido && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
                <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Vistoria de conclusão</h2>
                  <p className="text-sm text-keu-black/60">
                    Estado da moto na conclusão do contrato
                  </p>
                </div>
              </div>

              {aluguel.fotosFim && aluguel.fotosFim.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  {aluguel.fotosFim.map((src, i) => (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-square rounded-xl overflow-hidden bg-keu-gray-light border border-keu-black/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Conclusão ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-keu-black/60 italic mb-4">
                  Sem fotos na conclusão.
                </div>
              )}

              {aluguel.observacoesFim && (
                <div className="p-4 bg-keu-gray-light rounded-lg mb-4">
                  <div className="text-xs uppercase tracking-wide font-semibold text-keu-black/60 mb-1 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Observações da conclusão
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {aluguel.observacoesFim}
                  </p>
                </div>
              )}

              {/* Avarias mostradas no card dedicado AvariasCard abaixo */}
            </Card>
          )}

          {/* DATAS E KM */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Datas e quilometragem</h2>
                <p className="text-sm text-keu-black/60">
                  Período contratado e KM registrados
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoBox
                label="Início"
                value={formatDate(aluguel.dataInicio)}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
              <InfoBox
                label="Fim previsto"
                value={formatDate(aluguel.dataFim)}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
              <InfoBox
                label="Data de conclusão"
                value={
                  aluguel.dataConclusao
                    ? formatDate(aluguel.dataConclusao)
                    : aluguel.dataDevolucao
                    ? formatDate(aluguel.dataDevolucao)
                    : "—"
                }
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                highlight={!!(aluguel.dataConclusao || aluguel.dataDevolucao)}
              />
              <InfoBox
                label="KM inicial"
                value={`${aluguel.km_inicial.toLocaleString("pt-BR")} km`}
                icon={<Gauge className="h-3.5 w-3.5" />}
              />
              <InfoBox
                label="KM final"
                value={
                  aluguel.km_final !== undefined && aluguel.km_final !== null
                    ? `${aluguel.km_final.toLocaleString("pt-BR")} km`
                    : "—"
                }
                icon={<Gauge className="h-3.5 w-3.5" />}
              />
              <InfoBox
                label="KM rodado"
                value={
                  kmRodado !== null
                    ? `${kmRodado.toLocaleString("pt-BR")} km`
                    : "—"
                }
                icon={<Gauge className="h-3.5 w-3.5" />}
                highlight={kmRodado !== null}
              />
            </div>

            {aluguel.observacoes && (
              <div className="mt-4 p-4 bg-keu-gray-light rounded-lg">
                <div className="text-xs uppercase tracking-wide font-semibold text-keu-black/60 mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Observações do contrato
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {aluguel.observacoes}
                </p>
              </div>
            )}
          </Card>

          {/* PARCELAS DA LOCAÇÃO */}
          {aluguel.parcelasLocacao && aluguel.parcelasLocacao.length > 0 && (
            <ParcelasCard
              aluguelId={aluguel._id}
              parcelas={aluguel.parcelasLocacao}
              multaPercent={aluguel.multaPorAtrasoPercent ?? 10}
              jurosDiaPercent={aluguel.jurosDiaPercent ?? 2}
              clienteTelefone={aluguel.clienteTelefone}
              clienteNome={aluguel.clienteNome}
              onChange={refetch}
            />
          )}

          {/* AVARIAS — registráveis durante OU depois da locação */}
          <AvariasCard
            aluguelId={aluguel._id}
            avarias={aluguel.avarias ?? []}
            custoTotalAvarias={aluguel.custoTotalAvarias ?? 0}
            onChange={refetch}
          />
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* Resumo financeiro */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-keu-black/5 text-xs font-bold uppercase text-emerald-700">
              <DollarSign className="h-3.5 w-3.5" /> Resumo financeiro
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-keu-black/60">Valor da locação</span>
                <span className="font-bold text-keu-red">
                  {formatCurrency(aluguel.valorTotal)}
                </span>
              </div>
              {aluguel.valorEntrada !== undefined &&
                aluguel.valorEntrada > 0 && (
                  <div className="flex justify-between">
                    <span className="text-keu-black/60">Entrada paga</span>
                    <span className="font-semibold">
                      {formatCurrency(aluguel.valorEntrada)}
                    </span>
                  </div>
                )}
              {aluguel.valorParcela !== undefined &&
                aluguel.numeroParcelas !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-keu-black/60">
                      Parcelas{" "}
                      {aluguel.frequenciaParcela === "personalizada" &&
                      aluguel.cicloDias
                        ? `(a cada ${aluguel.cicloDias} dias)`
                        : aluguel.frequenciaParcela
                          ? `(${aluguel.frequenciaParcela})`
                          : ""}
                    </span>
                    <span className="font-semibold">
                      {aluguel.parcelasPagas ?? 0}/{aluguel.numeroParcelas} ×{" "}
                      {formatCurrency(aluguel.valorParcela)}
                    </span>
                  </div>
                )}

              {isConcluido && (
                <>
                  <div className="pt-3 border-t border-keu-black/5 flex justify-between">
                    <span className="text-keu-black/60 inline-flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Avarias
                    </span>
                    <span className="font-semibold text-red-600">
                      − {formatCurrency(aluguel.custoTotalAvarias ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-keu-black/60">Multa por atraso</span>
                    <span className="font-semibold text-red-600">
                      − {formatCurrency(aluguel.multaAtraso ?? 0)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-keu-black/5 text-xs text-keu-black/60 space-y-1">
              <div>
                {aluguel.diasContratados} dia
                {aluguel.diasContratados > 1 ? "s" : ""} contratado
                {aluguel.diasContratados > 1 ? "s" : ""}
              </div>
              {aluguel.modalidadeAplicada && (
                <div>
                  Plano <strong className="capitalize">{aluguel.modalidadeAplicada}</strong>
                </div>
              )}
            </div>
          </Card>

          {/* Cliente */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-keu-black/5 text-xs font-bold uppercase text-keu-black/60">
              <User className="h-3.5 w-3.5" /> Cliente
            </div>
            <div className="font-bold mb-1">{aluguel.clienteNome}</div>
            {aluguel.clienteEmail && (
              <div className="text-xs text-keu-black/60 mb-3">
                {aluguel.clienteEmail}
              </div>
            )}
            {aluguel.clienteTelefone && (
              <a
                href={`https://wa.me/55${onlyDigits(aluguel.clienteTelefone)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <Phone className="h-3.5 w-3.5" /> {aluguel.clienteTelefone}
              </a>
            )}
            {aluguel.vendedorNome && (
              <div className="mt-4 pt-3 border-t border-keu-black/5">
                <div className="text-xs uppercase tracking-wide font-semibold text-keu-black/60 mb-1">
                  Vendedor
                </div>
                <div className="text-sm">{aluguel.vendedorNome}</div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {modalOpen && aluguel && (
        <DevolucaoModal
          aluguel={aluguel}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            refetch();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function InfoBox({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg ${
        highlight ? "bg-emerald-50 border border-emerald-200" : "bg-keu-gray-light"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wide font-semibold text-keu-black/60 mb-0.5 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  );
}

// ============================================================================
// PARCELAS DA LOCAÇÃO — lista + marcar paga + box de inadimplência
// ============================================================================

function ParcelasCard({
  aluguelId,
  parcelas,
  multaPercent,
  jurosDiaPercent,
  clienteTelefone,
  clienteNome,
  onChange,
}: {
  aluguelId: string;
  parcelas: ParcelaApi[];
  multaPercent: number;
  jurosDiaPercent: number;
  clienteTelefone?: string;
  clienteNome: string;
  onChange: () => void;
}) {
  const [pagandoIdx, setPagandoIdx] = useState<number | null>(null);
  const hoje = new Date();

  // Status derivado: atrasada se vencimento < hoje && !paga
  const parcelasComStatus = useMemo(() => {
    return parcelas
      .map((p) => {
        const venc = new Date(p.vencimento);
        const atrasada =
          p.status !== "paga" && venc.getTime() < hoje.getTime();
        // Calcula multa + juros pra parcela atrasada não paga
        let multa = 0;
        let juros = 0;
        let diasAtraso = 0;
        if (atrasada) {
          const diasMs = hoje.getTime() - venc.getTime();
          diasAtraso = Math.max(0, Math.floor(diasMs / (24 * 60 * 60 * 1000)));
          multa = (p.valor * multaPercent) / 100;
          juros = (p.valor * jurosDiaPercent * diasAtraso) / 100;
        }
        return {
          ...p,
          statusReal: (p.status === "paga"
            ? "paga"
            : atrasada
              ? "atrasada"
              : "pendente") as "paga" | "atrasada" | "pendente",
          multaCalc: Math.round(multa * 100) / 100,
          jurosCalc: Math.round(juros * 100) / 100,
          diasAtraso,
          totalDevido: Math.round((p.valor + multa + juros) * 100) / 100,
          vencDate: venc,
        };
      })
      .sort((a, b) => a.numero - b.numero);
  }, [parcelas, multaPercent, jurosDiaPercent]);

  const atrasadas = parcelasComStatus.filter((p) => p.statusReal === "atrasada");
  const pendentes = parcelasComStatus.filter(
    (p) => p.statusReal === "pendente"
  );
  const pagas = parcelasComStatus.filter((p) => p.status === "paga");
  const totalDevido = atrasadas.reduce((s, p) => s + p.totalDevido, 0);
  const totalMultas = atrasadas.reduce((s, p) => s + p.multaCalc, 0);
  const totalJuros = atrasadas.reduce((s, p) => s + p.jurosCalc, 0);
  const totalRecebido = pagas.reduce(
    (s, p) => s + (p.valorPago ?? p.valor),
    0
  );

  async function marcarPaga(numero: number) {
    setPagandoIdx(numero);
    try {
      const res = await fetch(
        `/api/alugueis/${aluguelId}/parcelas/${numero}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "paga" }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha ao marcar parcela");
      }
      toast.success(`Parcela ${numero} marcada como paga`);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setPagandoIdx(null);
    }
  }

  async function desfazerPagamento(numero: number) {
    if (!(await confirmDialog({
      title: "Desfazer pagamento",
      message: `Voltar parcela ${numero} para pendente? Use só pra corrigir lançamento errado.`,
      confirmText: "Desfazer",
      variant: "destructive",
    }))) return;
    setPagandoIdx(numero);
    try {
      const res = await fetch(
        `/api/alugueis/${aluguelId}/parcelas/${numero}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "pendente" }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha ao desfazer");
      }
      toast.success(`Parcela ${numero} voltou para pendente`);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setPagandoIdx(null);
    }
  }

  function msgCobranca(): string {
    if (atrasadas.length === 0) return "";
    const partes = atrasadas
      .map(
        (p) =>
          `• Parcela ${p.numero}: venceu ${formatDate(p.vencimento)} (${p.diasAtraso}d) → ${formatCurrency(p.totalDevido)}`
      )
      .join("\n");
    return encodeURIComponent(
      `Olá ${clienteNome}, sobre sua locação na KEU Motos:\n\n${partes}\n\nTotal a receber: ${formatCurrency(totalDevido)}\nPodemos combinar o pagamento?`
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
        <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
          <DollarSign className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold">Parcelas da locação</h2>
          <p className="text-sm text-keu-black/60">
            {pagas.length}/{parcelasComStatus.length} pagas
            {pendentes.length > 0 ? ` · ${pendentes.length} pendentes` : ""}
            {atrasadas.length > 0 ? ` · ${atrasadas.length} atrasadas` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-keu-black/60 uppercase tracking-wide">
            Recebido
          </div>
          <div className="font-bold text-emerald-600">
            {formatCurrency(totalRecebido)}
          </div>
        </div>
      </div>

      {/* ALERTA DE INADIMPLÊNCIA */}
      {atrasadas.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-2">
                <AlertTriangle className="h-4 w-4" /> INADIMPLENTE
              </div>
              <div className="text-sm text-keu-black/80">
                {atrasadas.length} parcela
                {atrasadas.length > 1 ? "s" : ""} atrasada
                {atrasadas.length > 1 ? "s" : ""} —{" "}
                {Math.max(...atrasadas.map((p) => p.diasAtraso))} dia
                {atrasadas.length > 1 ? "s" : ""} de atraso
              </div>
              <div className="mt-2 text-xs text-keu-black/60">
                Multa: {formatCurrency(totalMultas)} · Juros:{" "}
                {formatCurrency(totalJuros)}
              </div>
              <div className="mt-1 text-lg font-black text-red-700">
                Total devido: {formatCurrency(totalDevido)}
              </div>
            </div>
            {clienteTelefone && (
              <a
                href={`https://wa.me/55${onlyDigits(clienteTelefone)}?text=${msgCobranca()}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition flex-shrink-0"
              >
                <Phone className="h-4 w-4" /> Cobrar via WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-keu-black/5">
        {parcelasComStatus.map((p) => {
          const isPaga = p.status === "paga";
          const isAtrasada = p.statusReal === "atrasada";
          return (
            <div
              key={p.numero}
              className={`py-3 flex items-center justify-between gap-3 flex-wrap ${
                isAtrasada ? "bg-red-50/40 -mx-2 px-2 rounded" : ""
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isPaga
                      ? "bg-emerald-100 text-emerald-700"
                      : isAtrasada
                        ? "bg-red-100 text-red-700"
                        : "bg-keu-gray-light text-keu-black/60"
                  }`}
                >
                  {p.numero}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {formatCurrency(p.valor)}
                    </span>
                    {isPaga && (
                      <Badge variant="success" className="text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Paga
                      </Badge>
                    )}
                    {isAtrasada && (
                      <Badge variant="danger" className="text-[10px]">
                        <AlertCircle className="h-3 w-3" /> Atrasada{" "}
                        {p.diasAtraso}d
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-keu-black/60 mt-0.5">
                    {isPaga && p.pagoEm
                      ? `Paga em ${formatDate(p.pagoEm)}`
                      : `Vence em ${formatDate(p.vencimento)}`}
                    {isAtrasada && (
                      <>
                        {" · "}
                        <span className="text-red-700 font-semibold">
                          +{formatCurrency(p.multaCalc + p.jurosCalc)} multa+juros
                        </span>
                      </>
                    )}
                    {isPaga &&
                      p.valorPago !== undefined &&
                      p.valorPago !== p.valor && (
                        <span>
                          {" "}
                          (pagou {formatCurrency(p.valorPago)})
                        </span>
                      )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {isPaga ? (
                  <button
                    type="button"
                    onClick={() => desfazerPagamento(p.numero)}
                    disabled={pagandoIdx === p.numero}
                    className="text-[11px] text-keu-black/60 hover:text-keu-red transition"
                    title="Desfazer (correção)"
                  >
                    {pagandoIdx === p.numero ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "↺ desfazer"
                    )}
                  </button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant={isAtrasada ? "destructive" : "outline"}
                    onClick={() => marcarPaga(p.numero)}
                    disabled={pagandoIdx === p.numero}
                  >
                    {pagandoIdx === p.numero ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Marcar paga
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

interface ContratoMini {
  _id: string;
  status: string;
  dataContrato: string;
}

function ContratosBotao({ aluguelId }: { aluguelId: string }) {
  const { data, loading } = useApi<{ contratos: ContratoMini[] }>(
    `/api/contratos?aluguelId=${aluguelId}`
  );
  const contratos = data?.contratos ?? [];
  const ativo = contratos.find(
    (c) => c.status === "ativo" || c.status === "assinado"
  );

  if (loading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin" /> Contratos
      </Button>
    );
  }

  if (ativo) {
    const numero = ativo._id.slice(-6).toUpperCase();
    return (
      <div className="flex gap-2 flex-wrap">
        <a
          href={`/api/contratos/${ativo._id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          title={`Abrir contrato #${numero}`}
        >
          <Button variant="outline">
            <FileText className="h-4 w-4" /> Ver contrato #{numero}
          </Button>
        </a>
        <Link href={`/dashboard/aluguel/${aluguelId}/contrato`}>
          <Button variant="ghost" size="sm">
            + novo
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Link href={`/dashboard/aluguel/${aluguelId}/contrato`}>
      <Button variant="outline">
        <FileText className="h-4 w-4" /> Gerar contrato
      </Button>
    </Link>
  );
}

// ============================================================================
// AVARIAS CARD — registrar/editar/remover durante ou após locação
// ============================================================================

function AvariasCard({
  aluguelId,
  avarias,
  custoTotalAvarias,
  onChange,
}: {
  aluguelId: string;
  avarias: AvariaApi[];
  custoTotalAvarias: number;
  onChange: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [salvando, setSalvando] = useState<string | null>(null);

  const totalReparadas = avarias.filter((a) => a.reparado).length;
  const totalPendentes = avarias.length - totalReparadas;

  async function toggleReparado(av: AvariaApi) {
    if (!av._id) return;
    setSalvando(av._id);
    try {
      const res = await fetch(
        `/api/alugueis/${aluguelId}/avarias/${av._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reparado: !av.reparado }),
        }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha");
      }
      toast.success(av.reparado ? "Marcada como pendente" : "Marcada como reparada");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSalvando(null);
    }
  }

  async function removerAvaria(av: AvariaApi) {
    if (!av._id) return;
    if (
      !(await confirmDialog({
        title: "Remover avaria",
        message: `Remover "${av.descricao}"? Esta ação não pode ser desfeita.`,
        confirmText: "Remover",
        variant: "destructive",
      }))
    )
      return;
    setSalvando(av._id);
    try {
      const res = await fetch(
        `/api/alugueis/${aluguelId}/avarias/${av._id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha ao remover");
      }
      toast.success("Avaria removida");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
          <div className="bg-red-500/10 text-red-600 w-10 h-10 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold">Avarias da moto</h2>
            <p className="text-sm text-keu-black/60">
              {avarias.length === 0
                ? "Nenhuma avaria registrada"
                : `${avarias.length} registrada${avarias.length > 1 ? "s" : ""} · ${totalReparadas} reparada${totalReparadas !== 1 ? "s" : ""} · ${totalPendentes} pendente${totalPendentes !== 1 ? "s" : ""}`}
            </p>
          </div>
          {custoTotalAvarias > 0 && (
            <div className="text-right">
              <div className="text-xs text-keu-black/60 uppercase tracking-wide">
                Total
              </div>
              <div className="font-bold text-red-700">
                {formatCurrency(custoTotalAvarias)}
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Registrar
          </Button>
        </div>

        {avarias.length === 0 ? (
          <div className="text-center py-6 text-sm text-keu-black/60">
            <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-emerald-500 opacity-60" />
            Nenhuma avaria. Quando o cliente devolver com algum dano, registre
            aqui pra rastrear no histórico da moto.
          </div>
        ) : (
          <div className="space-y-3">
            {avarias.map((av) => (
              <div
                key={av._id}
                className={`p-4 rounded-xl border ${
                  av.reparado
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">
                        {av.descricao}
                      </span>
                      {av.reparado && (
                        <Badge variant="success" className="text-[10px]">
                          <Wrench className="h-3 w-3" /> Reparado
                        </Badge>
                      )}
                      {av.cobradoCaucao && (
                        <Badge variant="warning" className="text-[10px]">
                          Descontado da entrada
                        </Badge>
                      )}
                    </div>
                    {av.registradoEm && (
                      <div className="text-xs text-keu-black/60">
                        Registrado em {formatDate(av.registradoEm)}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-red-700">
                      {formatCurrency(av.custoEstimado ?? 0)}
                    </div>
                  </div>
                </div>
                {av.fotos && av.fotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 my-3">
                    {av.fotos.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="block aspect-square rounded-lg overflow-hidden bg-white border border-keu-black/10"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap mt-2">
                  <button
                    type="button"
                    onClick={() => toggleReparado(av)}
                    disabled={salvando === av._id}
                    className="text-xs px-2.5 py-1 rounded-lg border border-keu-black/10 hover:bg-white inline-flex items-center gap-1"
                  >
                    {salvando === av._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : av.reparado ? (
                      <X className="h-3 w-3" />
                    ) : (
                      <Wrench className="h-3 w-3" />
                    )}
                    {av.reparado ? "Marcar pendente" : "Marcar reparada"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removerAvaria(av)}
                    disabled={salvando === av._id}
                    className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-100 inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {modalOpen && (
        <RegistrarAvariaModal
          aluguelId={aluguelId}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            onChange();
          }}
        />
      )}
    </>
  );
}

// Catálogo de avarias comuns com custo médio sugerido. Permite registrar
// avaria em 2 cliques em vez de digitar do zero. Valores baseados em média
// de oficina (atualizar conforme realidade local).
const AVARIAS_COMUNS: Array<{ desc: string; custoMedio: number }> = [
  { desc: "Arranhão leve na lateral", custoMedio: 80 },
  { desc: "Arranhão profundo no tanque", custoMedio: 250 },
  { desc: "Retrovisor quebrado", custoMedio: 90 },
  { desc: "Manopla danificada", custoMedio: 60 },
  { desc: "Carenagem rachada", custoMedio: 350 },
  { desc: "Piscas/lanterna quebrados", custoMedio: 70 },
  { desc: "Pedal de câmbio entortado", custoMedio: 120 },
  { desc: "Banco rasgado", custoMedio: 200 },
  { desc: "Pneu furado/cortado", custoMedio: 180 },
  { desc: "Avaria sem categoria", custoMedio: 0 },
];

function RegistrarAvariaModal({
  aluguelId,
  onClose,
  onSuccess,
}: {
  aluguelId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [descricao, setDescricao] = useState("");
  const [custoEstimado, setCustoEstimado] = useState<number | "">("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [cobradoCaucao, setCobradoCaucao] = useState(false);
  const [reparado, setReparado] = useState(false);
  const [criarRevisao, setCriarRevisao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function escolherPreset(p: (typeof AVARIAS_COMUNS)[number]) {
    setDescricao(p.desc);
    setCustoEstimado(p.custoMedio > 0 ? p.custoMedio : "");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (descricao.trim().length < 3) {
      setError("Descreva a avaria (mín. 3 letras).");
      return;
    }
    setSalvando(true);
    try {
      const res = await apiPost(`/api/alugueis/${aluguelId}/avarias`, {
        descricao: descricao.trim(),
        custoEstimado:
          typeof custoEstimado === "number" && custoEstimado >= 0
            ? custoEstimado
            : undefined,
        fotos,
        cobradoCaucao,
        reparado,
        criarRevisao,
      });
      if (res.error) throw new Error(res.error);
      toast.success("Avaria registrada");
      onSuccess();
    } catch (err) {
      const m = err instanceof Error ? err.message : "Erro";
      setError(m);
      toast.error(m);
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={salvar}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg">Registrar avaria</h3>
            <p className="text-sm text-keu-black/60">
              Documente o dano com fotos + custo estimado pra cobrar o cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-keu-gray-light rounded-lg"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <Label>Atalhos — avarias comuns</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVARIAS_COMUNS.map((p) => (
                <button
                  key={p.desc}
                  type="button"
                  onClick={() => escolherPreset(p)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-keu-gray-light hover:bg-keu-red hover:text-white transition border border-keu-black/10"
                >
                  {p.desc}
                  {p.custoMedio > 0 && (
                    <span className="ml-1 opacity-70">
                      · R$ {p.custoMedio}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-keu-black/50 mt-2">
              Clique pra preencher rapidamente. Custo é só sugestão, pode ajustar.
            </p>
          </div>

          <div>
            <Label>Descrição *</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: arranhão profundo na lateral direita, espelho retrovisor quebrado..."
              rows={3}
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Custo estimado (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={custoEstimado}
                onChange={(e) =>
                  setCustoEstimado(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                placeholder="200.00"
              />
              <p className="text-[11px] text-keu-black/50 mt-1">
                Soma deste valor entra em "Total avarias" do resumo financeiro.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={cobradoCaucao}
                  onChange={(e) => setCobradoCaucao(e.target.checked)}
                  className="rounded"
                />
                Descontar da entrada
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={reparado}
                  onChange={(e) => setReparado(e.target.checked)}
                  className="rounded"
                />
                Já reparado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={criarRevisao}
                  onChange={(e) => setCriarRevisao(e.target.checked)}
                  className="rounded"
                />
                Criar revisão no histórico da moto
              </label>
            </div>
          </div>

          <div>
            <Label>Fotos da avaria (até 20)</Label>
            <ImageUpload
              value={fotos}
              onChange={setFotos}
              max={20}
              hint="Tire fotos do dano por vários ângulos. Servem de prova se cliente contestar."
            />
            <p className="text-[11px] text-keu-black/50 mt-1">
              Fotos servem de comprovante se cliente contestar a cobrança.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-keu-black/5 flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Registrar avaria
          </Button>
        </div>
      </form>
    </div>
  );
}

function AluguelStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    {
      v: "success" | "warning" | "danger" | "info";
      l: string;
      i: React.ReactNode;
    }
  > = {
    ativo: { v: "info", l: "Ativo", i: <Clock className="h-3 w-3" /> },
    concluido: {
      v: "success",
      l: "Concluído",
      i: <CheckCircle2 className="h-3 w-3" />,
    },
    atrasado: {
      v: "danger",
      l: "Atrasado",
      i: <AlertCircle className="h-3 w-3" />,
    },
    cancelado: { v: "warning", l: "Cancelado", i: null },
  };
  const conf = map[status] || { v: "warning" as const, l: status, i: null };
  return (
    <Badge variant={conf.v} className="text-sm px-3 py-1">
      {conf.i}
      {conf.l}
    </Badge>
  );
}

// ============================================================================
// MODAL DE DEVOLUÇÃO
// ============================================================================

function DevolucaoModal({
  aluguel,
  onClose,
  onSuccess,
}: {
  aluguel: AluguelApi;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [kmFinal, setKmFinal] = useState<number | "">(aluguel.km_inicial);
  const [fotosFim, setFotosFim] = useState<string[]>([]);
  const [observacoesFim, setObservacoesFim] = useState("");
  const [multaAtraso, setMultaAtraso] = useState<number | "">(0);
  const [avarias, setAvarias] = useState<AvariaForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const custoTotalAvarias = useMemo(
    () =>
      avarias.reduce(
        (s, a) => s + (typeof a.custoEstimado === "number" ? a.custoEstimado : 0),
        0
      ),
    [avarias]
  );

  const multa = typeof multaAtraso === "number" ? multaAtraso : 0;

  function addAvaria() {
    setAvarias((prev) => [
      ...prev,
      { descricao: "", custoEstimado: "", fotos: [], cobradoCaucao: true },
    ]);
  }

  function updateAvaria<K extends keyof AvariaForm>(
    idx: number,
    key: K,
    value: AvariaForm[K]
  ) {
    setAvarias((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [key]: value } : a))
    );
  }

  function removeAvaria(idx: number) {
    setAvarias((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (kmFinal === "" || Number(kmFinal) < 0) {
      const m = "Informe o KM final.";
      setError(m);
      toast.error(m);
      return;
    }
    if (Number(kmFinal) < aluguel.km_inicial) {
      const m = `KM final (${kmFinal}) não pode ser menor que o KM inicial (${aluguel.km_inicial}).`;
      setError(m);
      toast.error(m);
      return;
    }
    for (const av of avarias) {
      if (!av.descricao.trim()) {
        const m = "Descreva todas as avarias adicionadas (ou remova as vazias).";
        setError(m);
        toast.error(m);
        return;
      }
    }

    const ok = await confirmDialog({
      title: "Concluir contrato",
      message: `O contrato será encerrado.${
        custoTotalAvarias + multa > 0
          ? ` Encargos: ${formatCurrency(custoTotalAvarias + multa)}.`
          : ""
      } Confirmar?`,
      confirmText: "Confirmar conclusão",
      variant: "destructive",
    });
    if (!ok) return;

    setSaving(true);
    try {
      const payload = {
        km_final: Number(kmFinal),
        fotosFim,
        observacoesFim: observacoesFim || undefined,
        multaAtraso: multa,
        avarias: avarias.map((a) => ({
          descricao: a.descricao,
          fotos: a.fotos,
          custoEstimado:
            typeof a.custoEstimado === "number" ? a.custoEstimado : 0,
          cobradoCaucao: a.cobradoCaucao,
        })),
      };

      const res = await apiPost(
        `/api/alugueis/${aluguel._id}/devolver`,
        payload
      );
      if (res.error) throw new Error(res.error);

      toast.success("Devolução registrada com sucesso!");
      onSuccess();
    } catch (err) {
      const m =
        err instanceof Error ? err.message : "Erro ao registrar devolução";
      setError(m);
      toast.error(m);
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-keu-black/10 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Concluir contrato</h2>
              <p className="text-xs text-keu-black/60">
                {aluguel.motoModelo} — {aluguel.clienteNome}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-8 h-8 rounded-lg hover:bg-keu-gray-light flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* KM final */}
            <div>
              <Label required>KM final</Label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  type="number"
                  min={aluguel.km_inicial}
                  required
                  className="pl-9"
                  value={kmFinal}
                  onChange={(e) =>
                    setKmFinal(e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>
              <div className="text-xs text-keu-black/60 mt-1">
                KM inicial: {aluguel.km_inicial.toLocaleString("pt-BR")} km
                {typeof kmFinal === "number" && kmFinal >= aluguel.km_inicial && (
                  <>
                    {" "}
                    · Rodado:{" "}
                    <strong>
                      {(kmFinal - aluguel.km_inicial).toLocaleString("pt-BR")} km
                    </strong>
                  </>
                )}
              </div>
            </div>

            {/* Fotos */}
            <div>
              <Label>Fotos do estado atual da moto</Label>
              <ImageUpload
                value={fotosFim}
                onChange={setFotosFim}
                max={8}
                maxSizeKB={250}
                maxWidth={1400}
                hint="Até 8 fotos do estado da moto na devolução"
              />
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="observacoesFim">Observações da devolução</Label>
              <Textarea
                id="observacoesFim"
                rows={3}
                placeholder="Estado geral, combustível, acessórios devolvidos..."
                value={observacoesFim}
                onChange={(e) => setObservacoesFim(e.target.value)}
              />
            </div>

            {/* Avarias */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="mb-0">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    Avarias ({avarias.length})
                  </span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAvaria}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar avaria
                </Button>
              </div>

              {avarias.length === 0 ? (
                <div className="text-sm text-keu-black/60 italic p-4 bg-keu-gray-light rounded-lg text-center">
                  Nenhuma avaria registrada.
                </div>
              ) : (
                <div className="space-y-4">
                  {avarias.map((av, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-red-200 bg-red-50/50 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase text-red-700">
                          Avaria #{idx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAvaria(idx)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div>
                        <Label required>Descrição</Label>
                        <Input
                          required
                          placeholder="Ex: Riscos no tanque, retrovisor quebrado..."
                          value={av.descricao}
                          onChange={(e) =>
                            updateAvaria(idx, "descricao", e.target.value)
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Custo estimado</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                              R$
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              className="pl-9"
                              value={av.custoEstimado}
                              onChange={(e) =>
                                updateAvaria(
                                  idx,
                                  "custoEstimado",
                                  e.target.value ? Number(e.target.value) : ""
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={av.cobradoCaucao}
                              onChange={(e) =>
                                updateAvaria(
                                  idx,
                                  "cobradoCaucao",
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 rounded text-keu-red"
                            />
                            <span>Descontar da entrada</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <Label>Fotos da avaria</Label>
                        <ImageUpload
                          value={av.fotos}
                          onChange={(imgs) => updateAvaria(idx, "fotos", imgs)}
                          max={3}
                          maxSizeKB={200}
                          maxWidth={1200}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Multa */}
            <div>
              <Label>Multa por atraso</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                  R$
                </span>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  className="pl-9"
                  value={multaAtraso}
                  onChange={(e) =>
                    setMultaAtraso(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                />
              </div>
            </div>

            {/* Resumo de encargos */}
            {(custoTotalAvarias > 0 || multa > 0) && (
              <Card className="p-4 bg-amber-50 border-amber-200">
                <div className="text-xs uppercase tracking-wide font-bold text-amber-800 mb-3 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> Encargos da conclusão
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-keu-black/70">Custo das avarias</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(custoTotalAvarias)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-keu-black/70">Multa por atraso</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(multa)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-amber-200 flex justify-between items-center">
                    <span className="font-bold text-amber-800">Total</span>
                    <span className="font-black text-xl text-amber-700">
                      {formatCurrency(custoTotalAvarias + multa)}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 bg-keu-gray-light px-6 py-4 border-t border-keu-black/10 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Confirmar conclusão
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
