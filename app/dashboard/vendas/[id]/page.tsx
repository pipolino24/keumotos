"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Bike,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApi } from "@/lib/hooks/use-api";

interface PagamentoApi {
  forma: string;
  valor: number;
  parcelasCartao?: number;
  parcelasLoja?: number;
  parcelasPagasLoja?: number;
  valorParcelaLoja?: number;
  banco?: string;
  numeroContratoBanco?: string;
  observacoes?: string;
}

interface VendaApi {
  _id: string;
  motoId?: string;
  clienteId?: string;
  clienteNome?: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  clienteCpf?: string;
  vendedorId?: string;
  vendedorNome?: string;
  status: string;
  data?: string;
  valorVendido?: number;
  valorTabela?: number;
  comissaoVendedor?: number;
  pagamentos?: PagamentoApi[];
  observacoes?: string;
}

interface MotoSnap {
  _id: string;
  marca: string;
  modelo: string;
  anoModelo?: number;
  placa?: string;
  cor?: string;
  fotoCapa?: string | null;
}

const fmtMoney = (v: number | undefined) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

const fmtDate = (s: string | undefined) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
};

const FORMA_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  transferencia: "Transferência",
  "cartao-debito": "Cartão de débito",
  "cartao-credito": "Cartão de crédito",
  "financiamento-banco": "Financiamento bancário",
  "parcelado-loja": "Parcelado na loja",
  troca: "Troca",
  cheque: "Cheque",
  consorcio: "Consórcio",
};

export default function VendaDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, loading, error } = useApi<{
    venda: VendaApi;
    moto: MotoSnap | null;
  }>(id ? `/api/vendas/${id}` : "");

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
        <div className="text-sm text-keu-black/60">Carregando venda...</div>
      </div>
    );
  }
  if (error || !data?.venda) {
    return (
      <div>
        <Link
          href="/dashboard/vendas"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para vendas
        </Link>
        <Card className="p-10 text-center bg-red-50 border-red-200">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">
            {error || "Venda não encontrada"}
          </p>
        </Card>
      </div>
    );
  }

  const { venda, moto } = data;
  const statusColor =
    venda.status === "concluida"
      ? "success"
      : venda.status === "cancelada"
      ? "danger"
      : "warning";

  const totalPago = (venda.pagamentos ?? []).reduce(
    (acc, p) => acc + (p.valor ?? 0),
    0
  );

  return (
    <div>
      <Link
        href="/dashboard/vendas"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para vendas
      </Link>

      <PageHeader
        title={`Venda ${venda._id.slice(-6).toUpperCase()}`}
        description={`Registrada em ${fmtDate(venda.data)}`}
      >
        <Badge variant={statusColor} className="uppercase text-[10px]">
          {venda.status === "concluida" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : venda.status === "cancelada" ? (
            <XCircle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {venda.status}
        </Badge>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        {/* Coluna esquerda: moto + cliente */}
        <div className="lg:col-span-2 space-y-4">
          {/* Moto */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-keu-black/5">
              <Bike className="h-4 w-4 text-keu-red" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-keu-black/70">
                Moto vendida
              </h3>
            </div>
            {moto ? (
              <div className="flex items-center gap-4">
                {moto.fotoCapa ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={moto.fotoCapa}
                    alt={`${moto.marca} ${moto.modelo}`}
                    className="w-24 h-24 rounded-lg object-cover bg-keu-gray-light"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-keu-gray-light flex items-center justify-center">
                    <Bike className="h-8 w-8 text-keu-black/20" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-lg">
                    {moto.marca} {moto.modelo}
                  </div>
                  <div className="text-sm text-keu-black/60">
                    {moto.anoModelo ?? "?"} · {moto.cor ?? "—"}
                    {moto.placa ? ` · ${moto.placa}` : ""}
                  </div>
                  <Link
                    href={`/dashboard/estoque/${moto._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-keu-red hover:underline mt-1"
                  >
                    Ver moto <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-keu-black/50">
                Moto associada não está mais no estoque
              </p>
            )}
          </Card>

          {/* Cliente */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-keu-black/5">
              <User className="h-4 w-4 text-keu-red" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-keu-black/70">
                Cliente
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-bold text-base">
                {venda.clienteNome || "—"}
              </div>
              {venda.clienteCpf && (
                <div className="flex items-center gap-2 text-keu-black/60">
                  <FileText className="h-3.5 w-3.5" />
                  CPF: {venda.clienteCpf}
                </div>
              )}
              {venda.clienteTelefone && (
                <div className="flex items-center gap-2 text-keu-black/60">
                  <Phone className="h-3.5 w-3.5" />
                  {venda.clienteTelefone}
                </div>
              )}
              {venda.clienteEmail && (
                <div className="flex items-center gap-2 text-keu-black/60">
                  <Mail className="h-3.5 w-3.5" />
                  {venda.clienteEmail}
                </div>
              )}
              {venda.clienteId && (
                <Link
                  href={`/dashboard/clientes/${venda.clienteId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-keu-red hover:underline mt-2"
                >
                  Ver perfil do cliente <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </Card>

          {/* Pagamentos */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-keu-black/5">
              <CreditCard className="h-4 w-4 text-keu-red" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-keu-black/70">
                Formas de pagamento
              </h3>
            </div>
            {(venda.pagamentos ?? []).length === 0 ? (
              <p className="text-sm text-keu-black/50">
                Nenhum pagamento registrado
              </p>
            ) : (
              <div className="space-y-2">
                {venda.pagamentos!.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-keu-gray-light"
                  >
                    <div>
                      <div className="font-semibold text-sm">
                        {FORMA_LABEL[p.forma] ?? p.forma}
                      </div>
                      {p.parcelasCartao && (
                        <div className="text-xs text-keu-black/60">
                          {p.parcelasCartao}x no cartão
                        </div>
                      )}
                      {p.parcelasLoja && (
                        <div className="text-xs text-keu-black/60">
                          {p.parcelasPagasLoja ?? 0} / {p.parcelasLoja} parcelas
                          pagas
                          {p.valorParcelaLoja
                            ? ` · ${fmtMoney(p.valorParcelaLoja)}/parcela`
                            : ""}
                        </div>
                      )}
                      {p.banco && (
                        <div className="text-xs text-keu-black/60">
                          Banco: {p.banco}
                          {p.numeroContratoBanco
                            ? ` · Contrato ${p.numeroContratoBanco}`
                            : ""}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-bold tabular-nums">
                      {fmtMoney(p.valor)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {venda.observacoes && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-keu-black/5">
                <FileText className="h-4 w-4 text-keu-red" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-keu-black/70">
                  Observações
                </h3>
              </div>
              <p className="text-sm text-keu-black/70 whitespace-pre-wrap">
                {venda.observacoes}
              </p>
            </Card>
          )}
        </div>

        {/* Coluna direita: resumo financeiro */}
        <div className="space-y-4">
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <div className="text-xs uppercase tracking-wider text-emerald-700/70 font-bold mb-1">
              Valor vendido
            </div>
            <div className="text-3xl font-black text-emerald-700 tabular-nums">
              {fmtMoney(venda.valorVendido)}
            </div>
            {venda.valorTabela && venda.valorTabela !== venda.valorVendido && (
              <div className="text-xs text-keu-black/60 mt-2">
                Tabela: {fmtMoney(venda.valorTabela)}
                {venda.valorVendido && venda.valorTabela > venda.valorVendido
                  ? ` · Desconto ${fmtMoney(venda.valorTabela - venda.valorVendido)}`
                  : ""}
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-keu-black/50 font-semibold mb-0.5">
                Total recebido
              </div>
              <div className="text-lg font-bold tabular-nums">
                {fmtMoney(totalPago)}
              </div>
            </div>
            {typeof venda.comissaoVendedor === "number" && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-keu-black/50 font-semibold mb-0.5">
                  Comissão do vendedor
                </div>
                <div className="text-lg font-bold tabular-nums text-keu-red">
                  {fmtMoney(venda.comissaoVendedor)}
                </div>
              </div>
            )}
            {venda.vendedorNome && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-keu-black/50 font-semibold mb-0.5">
                  Vendedor
                </div>
                <div className="text-sm font-semibold">
                  {venda.vendedorNome}
                </div>
              </div>
            )}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-keu-black/50 font-semibold mb-0.5">
                Data
              </div>
              <div className="text-sm flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-keu-black/40" />
                {fmtDate(venda.data)}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
