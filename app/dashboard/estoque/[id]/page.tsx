"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Bike,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  DollarSign,
  Tag,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Handshake,
  Package,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { canSeeFinancialData } from "@/lib/current-user";
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
  numeroMotor?: string;
  cilindrada: number;
  combustivel: string;
  cambio: string;
  partida?: string;
  km: number;
  potencia?: string;
  valorFipe: number;
  valorCompra: number;
  valorAnunciado: number;
  valorMinimo: number;
  comissao?: number;
  valorDiaria?: number;
  valorSemanal?: number;
  valorMensal?: number;
  caucao?: number;
  tipo: string;
  status: string;
  destaque?: boolean;
  fotos?: string[];
  descricao?: string;
  observacoes?: string;
  origem: "propria" | "comprada" | "repasse";
  proprietarioId?: string;
  proprietarioNome?: string;
  compra?: {
    valorPago: number;
    formaPagamento: string;
    numeroNotaFiscal?: string;
    dataAquisicao: string;
  };
  repasse?: {
    valorCombinadoDono: number;
    tipoComissao: "percentual" | "fixo";
    comissaoPercentual?: number;
    comissaoFixa?: number;
    prazoConsignacao: number;
    dataInicioConsignacao: string;
    contratoAssinado: boolean;
    observacoesAcordo?: string;
  };
  setor: string;
  dataEntrada: string;
  vendedorResponsavel?: string;
}

interface ProprietarioApi {
  _id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone: string;
  whatsapp?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
}

export default function VisualizarMotoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const verFinanceiro = canSeeFinancialData();

  const { data, loading, error } = useApi<{ moto: MotoApi }>(
    id ? `/api/motos/${id}` : null
  );
  const moto = data?.moto;

  const { data: propData } = useApi<{ proprietario: ProprietarioApi }>(
    moto?.proprietarioId ? `/api/proprietarios/${moto.proprietarioId}` : null,
    [moto?.proprietarioId]
  );
  const proprietario = propData?.proprietario;

  const [fotoAtual, setFotoAtual] = useState(0);

  async function handleDelete() {
    const ok = await confirmDialog({
      title: "Excluir moto",
      message:
        "Tem certeza? Esta ação removerá a moto permanentemente do estoque e não pode ser desfeita.",
      confirmText: "Excluir",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/motos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Falha ao excluir");
      }
      toast.success("Moto excluída com sucesso");
      router.push("/dashboard/estoque");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
        <div className="text-sm text-keu-black/60">Carregando moto...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          href="/dashboard/estoque"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao estoque
        </Link>
        <Card className="p-8 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold">Erro ao carregar a moto</h3>
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
        <p className="text-sm text-keu-black/60 mb-4">
          A moto solicitada não existe ou foi removida.
        </p>
        <Link href="/dashboard/estoque">
          <Button>
            <ArrowLeft className="h-4 w-4" /> Voltar ao estoque
          </Button>
        </Link>
      </div>
    );
  }

  const fotos = moto.fotos ?? [];
  const temFotos = fotos.length > 0;

  return (
    <div>
      <Link
        href="/dashboard/estoque"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao estoque
      </Link>

      <PageHeader
        title={`${moto.marca} ${moto.modelo}`}
        description={`${moto.placa ?? "Sem placa"} · ${moto.anoFabricacao}/${moto.anoModelo} · ${moto.cor}`}
      >
        <Link href="/dashboard/estoque">
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
        <Link href={`/dashboard/estoque/${id}/editar`}>
          <Button type="button">
            <Edit className="h-4 w-4" /> Editar
          </Button>
        </Link>
        <Button type="button" variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" /> Excluir
        </Button>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carrossel de fotos */}
          {temFotos && (
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-keu-gray-light">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotos[fotoAtual]}
                  alt={`${moto.marca} ${moto.modelo} - foto ${fotoAtual + 1}`}
                  className="w-full h-full object-cover"
                />
                {fotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setFotoAtual((i) =>
                          i === 0 ? fotos.length - 1 : i - 1
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFotoAtual((i) =>
                          i === fotos.length - 1 ? 0 : i + 1
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                      aria-label="Próxima foto"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {fotoAtual + 1} / {fotos.length}
                    </div>
                  </>
                )}
              </div>
              {fotos.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto">
                  {fotos.map((foto, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFotoAtual(i)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        i === fotoAtual
                          ? "border-keu-red"
                          : "border-transparent hover:border-keu-black/30"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto}
                        alt={`Thumb ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Identificação */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-keu-black/5">
              <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
                <Bike className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Identificação</h2>
                <p className="text-sm text-keu-black/60">
                  Dados básicos do veículo
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Marca" value={moto.marca} />
              <Field label="Modelo" value={moto.modelo} />
              <Field label="Versão" value={moto.versao ?? "—"} />
              <Field label="Ano fabricação" value={moto.anoFabricacao} />
              <Field label="Ano modelo" value={moto.anoModelo} />
              <Field label="Cor" value={moto.cor} />
            </div>
          </Card>

          {/* Documentação */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-keu-black/5">
              <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Documentação</h2>
                <p className="text-sm text-keu-black/60">
                  Placa, chassi e demais documentos
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Placa" value={moto.placa ?? "—"} mono />
              <Field label="Chassi" value={moto.chassi ?? "—"} mono />
              <Field label="RENAVAM" value={moto.renavam ?? "—"} mono />
              <Field
                label="Número do motor"
                value={moto.numeroMotor ?? "—"}
                mono
              />
            </div>
          </Card>

          {/* Técnico */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-keu-black/5">
              <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Especificações técnicas</h2>
                <p className="text-sm text-keu-black/60">
                  Motor, câmbio e quilometragem
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Cilindrada" value={`${moto.cilindrada} cc`} />
              <Field
                label="Combustível"
                value={moto.combustivel}
                capitalize
              />
              <Field label="Câmbio" value={moto.cambio} capitalize />
              <Field
                label="Partida"
                value={moto.partida ?? "—"}
                capitalize
              />
              <Field
                label="Quilometragem"
                value={`${moto.km.toLocaleString("pt-BR")} km`}
              />
              <Field label="Potência" value={moto.potencia ?? "—"} />
            </div>
          </Card>

          {/* Valores comerciais */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-keu-black/5">
              <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Valores comerciais</h2>
                <p className="text-sm text-keu-black/60">
                  Preços, FIPE e comissão
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field
                label="FIPE"
                value={formatCurrency(moto.valorFipe)}
              />
              {verFinanceiro && (
                <Field
                  label={
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Valor de compra
                    </span>
                  }
                  value={formatCurrency(moto.valorCompra)}
                  highlight
                />
              )}
              <Field
                label="Valor anunciado"
                value={formatCurrency(moto.valorAnunciado)}
                emphasis
              />
              {verFinanceiro && (
                <Field
                  label={
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Valor mínimo
                    </span>
                  }
                  value={formatCurrency(moto.valorMinimo)}
                  highlight
                />
              )}
              {moto.comissao != null && (
                <Field
                  label="Comissão"
                  value={formatCurrency(moto.comissao)}
                />
              )}
            </div>

            {(moto.tipo === "aluguel" || moto.tipo === "ambos") && (
              <div className="mt-6 pt-6 border-t border-keu-black/5">
                <h3 className="text-sm font-bold text-keu-black/70 mb-3 uppercase tracking-wide">
                  Aluguel
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field
                    label="Diária"
                    value={
                      moto.valorDiaria != null
                        ? formatCurrency(moto.valorDiaria)
                        : "—"
                    }
                  />
                  <Field
                    label="Semanal"
                    value={
                      moto.valorSemanal != null
                        ? formatCurrency(moto.valorSemanal)
                        : "—"
                    }
                  />
                  <Field
                    label="Mensal"
                    value={
                      moto.valorMensal != null
                        ? formatCurrency(moto.valorMensal)
                        : "—"
                    }
                  />
                  <Field
                    label="Caução"
                    value={
                      moto.caucao != null
                        ? formatCurrency(moto.caucao)
                        : "—"
                    }
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Origem */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-keu-black/5">
              <div className="bg-purple-500/10 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Handshake className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Origem</h2>
                <p className="text-sm text-keu-black/60">
                  Como a moto entrou no estoque
                </p>
              </div>
            </div>

            <div className="mb-4">
              <OrigemBadge origem={moto.origem} />
            </div>

            {moto.origem === "comprada" && moto.compra && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {verFinanceiro && (
                  <Field
                    label="Valor pago"
                    value={formatCurrency(moto.compra.valorPago)}
                    highlight
                  />
                )}
                <Field
                  label="Forma de pagamento"
                  value={moto.compra.formaPagamento}
                  capitalize
                />
                <Field
                  label="Nota fiscal"
                  value={moto.compra.numeroNotaFiscal ?? "—"}
                  mono
                />
                <Field
                  label="Data de aquisição"
                  value={formatDate(moto.compra.dataAquisicao)}
                />
              </div>
            )}

            {moto.origem === "repasse" && moto.repasse && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {verFinanceiro && (
                    <Field
                      label="Combinado com dono"
                      value={formatCurrency(
                        moto.repasse.valorCombinadoDono
                      )}
                      highlight
                    />
                  )}
                  <Field
                    label="Tipo de comissão"
                    value={moto.repasse.tipoComissao}
                    capitalize
                  />
                  {moto.repasse.tipoComissao === "percentual" &&
                    moto.repasse.comissaoPercentual != null && (
                      <Field
                        label="Percentual"
                        value={`${moto.repasse.comissaoPercentual}%`}
                      />
                    )}
                  {moto.repasse.tipoComissao === "fixo" &&
                    moto.repasse.comissaoFixa != null && (
                      <Field
                        label="Comissão fixa"
                        value={formatCurrency(moto.repasse.comissaoFixa)}
                      />
                    )}
                  <Field
                    label="Prazo (dias)"
                    value={moto.repasse.prazoConsignacao}
                  />
                  <Field
                    label="Início consignação"
                    value={formatDate(moto.repasse.dataInicioConsignacao)}
                  />
                  <Field
                    label="Contrato assinado"
                    value={moto.repasse.contratoAssinado ? "Sim" : "Não"}
                  />
                </div>
                {moto.repasse.observacoesAcordo && (
                  <div>
                    <div className="text-xs font-semibold text-keu-black/60 uppercase tracking-wide mb-1">
                      Observações do acordo
                    </div>
                    <p className="text-sm text-keu-black/80 whitespace-pre-wrap bg-keu-gray-light rounded-lg p-3">
                      {moto.repasse.observacoesAcordo}
                    </p>
                  </div>
                )}
              </div>
            )}

            {moto.origem === "propria" && (
              <p className="text-sm text-keu-black/60">
                Moto própria da concessionária.
              </p>
            )}
          </Card>

          {/* Descrição */}
          {moto.descricao && (
            <Card className="p-6">
              <h2 className="font-bold mb-3">Descrição</h2>
              <p className="text-sm text-keu-black/80 whitespace-pre-wrap leading-relaxed">
                {moto.descricao}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-keu-black/60 mb-3">
              Status
            </h3>
            <div className="flex flex-col gap-2">
              <StatusMotoBadge status={moto.status} />
              <TipoBadge tipo={moto.tipo} />
              {moto.destaque && (
                <Badge variant="warning">
                  <Star className="h-3 w-3" /> Destaque
                </Badge>
              )}
            </div>
          </Card>

          {/* Operacional */}
          <Card className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-keu-black/60 mb-4">
              Operacional
            </h3>
            <div className="space-y-3 text-sm">
              <SidebarItem
                icon={<Package className="h-4 w-4" />}
                label="Setor"
                value={
                  <span className="capitalize">{moto.setor}</span>
                }
              />
              <SidebarItem
                icon={<User className="h-4 w-4" />}
                label="Vendedor responsável"
                value={moto.vendedorResponsavel ?? "—"}
              />
              <SidebarItem
                icon={<Calendar className="h-4 w-4" />}
                label="Data de entrada"
                value={formatDate(moto.dataEntrada)}
              />
            </div>
          </Card>

          {/* Proprietário */}
          {(proprietario || moto.proprietarioNome) && (
            <Card className="p-6">
              <h3 className="text-xs font-bold uppercase tracking-wide text-keu-black/60 mb-4">
                Proprietário
              </h3>
              {proprietario ? (
                <div className="space-y-3">
                  <div>
                    <div className="font-bold">{proprietario.nome}</div>
                    <div className="text-xs text-keu-black/60 font-mono">
                      {proprietario.cpf}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-keu-black/70">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{proprietario.telefone}</span>
                    </div>
                    {proprietario.email && (
                      <div className="flex items-center gap-2 text-keu-black/70">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{proprietario.email}</span>
                      </div>
                    )}
                    {(proprietario.cidade || proprietario.estado) && (
                      <div className="flex items-center gap-2 text-keu-black/70">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                          {[proprietario.cidade, proprietario.estado]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-bold">{moto.proprietarioNome}</div>
                  <div className="text-xs text-keu-black/60 mt-1">
                    Sem dados detalhados do proprietário
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Observações internas */}
          {moto.observacoes && (
            <Card className="p-6 bg-amber-50 border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-amber-700" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-amber-800">
                  Observações internas
                </h3>
              </div>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">
                {moto.observacoes}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  capitalize,
  highlight,
  emphasis,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  mono?: boolean;
  capitalize?: boolean;
  highlight?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        highlight ? "bg-keu-red/5 rounded-lg px-3 py-2 -mx-1" : undefined
      }
    >
      <div className="text-xs font-semibold text-keu-black/60 uppercase tracking-wide mb-0.5">
        {label}
      </div>
      <div
        className={`${mono ? "font-mono" : ""} ${
          capitalize ? "capitalize" : ""
        } ${
          emphasis
            ? "text-keu-red font-black text-lg"
            : "text-keu-black font-semibold"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-keu-black/40 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-keu-black/60">{label}</div>
        <div className="font-semibold text-keu-black">{value}</div>
      </div>
    </div>
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
  return <Badge variant={conf.v}>{conf.l}</Badge>;
}

function TipoBadge({ tipo }: { tipo: string }) {
  const map: Record<
    string,
    { v: "default" | "info" | "secondary"; l: string }
  > = {
    venda: { v: "default", l: "Venda" },
    aluguel: { v: "info", l: "Aluguel" },
    ambos: { v: "secondary", l: "Venda e aluguel" },
  };
  const conf = map[tipo] || { v: "secondary" as const, l: tipo };
  return <Badge variant={conf.v}>{conf.l}</Badge>;
}

function OrigemBadge({ origem }: { origem: string }) {
  const map: Record<
    string,
    { v: "default" | "info" | "secondary"; l: string }
  > = {
    propria: { v: "default", l: "Própria" },
    comprada: { v: "info", l: "Comprada" },
    repasse: { v: "secondary", l: "Repasse / Consignação" },
  };
  const conf = map[origem] || { v: "secondary" as const, l: origem };
  return <Badge variant={conf.v}>{conf.l}</Badge>;
}
