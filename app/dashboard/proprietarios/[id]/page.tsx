"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Banknote,
  FileText,
  IdCard,
  Home,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  Bike,
  ShoppingBag,
  Handshake,
  KeyRound,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApi } from "@/lib/hooks/use-api";
import { apiDelete } from "@/lib/api-client";
import { formatDate, formatCurrency, formatPhone } from "@/lib/utils";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/confirm-dialog";

interface Prop {
  _id: string;
  nome: string;
  cpf: string;
  rg?: string;
  cnh?: string;
  email?: string;
  telefone: string;
  whatsapp?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pixTipo?: string;
  pixChave?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  fotoPessoal?: string;
  fotoCnh?: string;
  fotoComprovanteResidencia?: string;
  fotoDocMoto?: string;
  observacoes?: string;
  createdAt: string;
}

interface MotoApi {
  _id: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  cor: string;
  origem: string;
  status: string;
  valorAnunciado: number;
  valorCompra: number;
  proprietarioId?: string;
  compra?: { valorPago?: number; dataAquisicao?: string };
  repasse?: { valorCombinadoDono?: number; dataInicioConsignacao?: string };
}

interface AluguelApi {
  _id: string;
  motoId: string;
  motoModelo: string;
  motoMarca?: string;
  dataInicio: string;
  dataFim: string;
  dataDevolucao?: string;
  diasContratados: number;
  valorTotal: number;
  status: string;
  clienteCpf?: string;
  clienteNome: string;
}

export default function PessoaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, loading, error } = useApi<{ proprietario: Prop }>(
    id ? `/api/proprietarios/${id}` : null
  );
  const { data: motosData } = useApi<{ motos: MotoApi[] }>("/api/motos");
  const { data: alugueisData } = useApi<{ alugueis: AluguelApi[] }>(
    "/api/alugueis"
  );

  const proprietario = data?.proprietario;

  // Motos consignadas/vendidas para a KEU por esta pessoa
  const motosDaPessoa = (motosData?.motos ?? []).filter(
    (m) => m.proprietarioId === id
  );

  // Aluguéis em que esta pessoa foi cliente (match por CPF se disponível)
  const alugueisDaPessoa = (alugueisData?.alugueis ?? []).filter((a) => {
    if (!proprietario) return false;
    if (a.clienteCpf && proprietario.cpf) {
      return (
        a.clienteCpf.replace(/\D/g, "") ===
        proprietario.cpf.replace(/\D/g, "")
      );
    }
    return (
      a.clienteNome?.toLowerCase().trim() ===
      proprietario.nome.toLowerCase().trim()
    );
  });

  const totalRecebidoConsignacao = motosDaPessoa
    .filter((m) => m.origem === "comprada")
    .reduce((s, m) => s + (m.compra?.valorPago ?? m.valorCompra), 0);
  const totalAReceberRepasse = motosDaPessoa
    .filter((m) => m.origem === "repasse")
    .reduce((s, m) => s + (m.repasse?.valorCombinadoDono ?? 0), 0);
  const totalGastoAluguel = alugueisDaPessoa.reduce(
    (s, a) => s + a.valorTotal,
    0
  );

  async function handleDelete() {
    const ok = await confirmDialog({
      title: "Remover pessoa",
      message:
        "Tem certeza? Os dados pessoais serão excluídos. Motos vinculadas a essa pessoa ficarão sem proprietário cadastrado. Essa ação não pode ser desfeita.",
      confirmText: "Remover",
      variant: "destructive",
    });
    if (!ok) return;
    const res = await apiDelete(`/api/proprietarios/${id}`);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Pessoa removida");
    router.push("/dashboard/proprietarios");
  }

  function openImage(base64?: string) {
    if (!base64) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<img src="${base64}" style="max-width:100%;height:auto" />`
      );
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
        <div className="text-sm text-keu-black/60">Carregando...</div>
      </div>
    );
  }

  if (error || !proprietario) {
    return (
      <div>
        <Link
          href="/dashboard/proprietarios"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <Card className="p-16 text-center">
          <div className="bg-red-100 text-red-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="font-bold mb-1">Pessoa não encontrada</h3>
          <p className="text-sm text-keu-black/60 mb-4">
            {error ?? "A pessoa pode ter sido removida."}
          </p>
          <Link href="/dashboard/proprietarios">
            <Button variant="outline">Voltar para lista</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const enderecoCompleto = [
    proprietario.endereco,
    proprietario.numero,
    proprietario.bairro,
    proprietario.cidade && proprietario.estado
      ? `${proprietario.cidade}/${proprietario.estado}`
      : proprietario.cidade ?? proprietario.estado,
    proprietario.cep,
  ]
    .filter(Boolean)
    .join(", ");

  const docs = [
    {
      label: "CNH",
      foto: proprietario.fotoCnh,
      icon: <IdCard className="h-3 w-3" />,
    },
    {
      label: "Residência",
      foto: proprietario.fotoComprovanteResidencia,
      icon: <Home className="h-3 w-3" />,
    },
    {
      label: "CRLV",
      foto: proprietario.fotoDocMoto,
      icon: <FileText className="h-3 w-3" />,
    },
  ];

  return (
    <div>
      <Link
        href="/dashboard/proprietarios"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para pessoas
      </Link>

      <PageHeader
        title={proprietario.nome}
        description={`Cadastrado em ${formatDate(proprietario.createdAt)}`}
      >
        <Button type="button" variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" /> Excluir
        </Button>
      </PageHeader>

      {/* STATS DE RELACIONAMENTO */}
      {(motosDaPessoa.length > 0 || alugueisDaPessoa.length > 0) && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-5 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0">
            <ShoppingBag className="h-5 w-5 mb-2 opacity-80" />
            <div className="text-2xl font-black">
              {motosDaPessoa.filter((m) => m.origem === "comprada").length}
            </div>
            <div className="text-xs text-white/80">Motos vendidas pra KEU</div>
            <div className="text-xs text-white/70 mt-1">
              {formatCurrency(totalRecebidoConsignacao)} recebido
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0">
            <Handshake className="h-5 w-5 mb-2 opacity-80" />
            <div className="text-2xl font-black">
              {motosDaPessoa.filter((m) => m.origem === "repasse").length}
            </div>
            <div className="text-xs text-white/80">Em repasse / consignação</div>
            <div className="text-xs text-white/70 mt-1">
              {formatCurrency(totalAReceberRepasse)} combinado
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0">
            <KeyRound className="h-5 w-5 mb-2 opacity-80" />
            <div className="text-2xl font-black">
              {alugueisDaPessoa.length}
            </div>
            <div className="text-xs text-white/80">Aluguéis feitos</div>
            <div className="text-xs text-white/70 mt-1">
              {formatCurrency(totalGastoAluguel)} pago
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0">
            <TrendingUp className="h-5 w-5 mb-2 opacity-80" />
            <div className="text-2xl font-black">
              {motosDaPessoa.length + alugueisDaPessoa.length}
            </div>
            <div className="text-xs text-white/80">Total de operações</div>
            <div className="text-xs text-white/70 mt-1">
              com a KEU Empreendimentos
            </div>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          {/* DADOS PESSOAIS */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-red text-white w-10 h-10 rounded-lg flex items-center justify-center">
                <UserIcon className="h-5 w-5" />
              </div>
              <h2 className="font-bold">Dados pessoais</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="font-mono">
                  <IdCard className="h-3 w-3" /> CPF: {proprietario.cpf}
                </Badge>
                {proprietario.rg && (
                  <Badge variant="outline" className="font-mono">
                    <FileText className="h-3 w-3" /> RG: {proprietario.rg}
                  </Badge>
                )}
                {proprietario.cnh && (
                  <Badge variant="outline" className="font-mono">
                    <IdCard className="h-3 w-3" /> CNH: {proprietario.cnh}
                  </Badge>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-keu-black/60 mb-1">Telefone</div>
                  <div className="flex items-center gap-2 font-medium">
                    <Phone className="h-3.5 w-3.5 text-keu-black/40" />
                    {formatPhone(proprietario.telefone)}
                  </div>
                </div>
                {proprietario.whatsapp && (
                  <div>
                    <div className="text-xs text-keu-black/60 mb-1">
                      WhatsApp
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Phone className="h-3.5 w-3.5 text-keu-black/40" />
                      {formatPhone(proprietario.whatsapp)}
                    </div>
                  </div>
                )}
                {proprietario.email && (
                  <div className="sm:col-span-2">
                    <div className="text-xs text-keu-black/60 mb-1">Email</div>
                    <div className="flex items-center gap-2 font-medium">
                      <Mail className="h-3.5 w-3.5 text-keu-black/40" />
                      {proprietario.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* MOTOS ENTREGUES PARA A KEU */}
          {motosDaPessoa.length > 0 && (
            <Card className="overflow-hidden">
              <div className="p-5 border-b border-keu-black/5 bg-gradient-to-r from-keu-red/5 to-purple-500/5">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-keu-red to-purple-600 text-white w-10 h-10 rounded-lg flex items-center justify-center">
                    <Bike className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold">Motos entregues à KEU</h2>
                    <p className="text-xs text-keu-black/60">
                      Compras diretas + repasses por consignação
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-keu-black/5">
                {motosDaPessoa.map((m) => {
                  const isRepasse = m.origem === "repasse";
                  const valor = isRepasse
                    ? m.repasse?.valorCombinadoDono ?? 0
                    : m.compra?.valorPago ?? m.valorCompra;
                  const data = isRepasse
                    ? m.repasse?.dataInicioConsignacao
                    : m.compra?.dataAquisicao;
                  return (
                    <Link
                      key={m._id}
                      href={`/dashboard/estoque/${m._id}`}
                      className="block p-4 hover:bg-keu-gray-light transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bike className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">
                              {m.marca} {m.modelo}
                            </span>
                            {isRepasse ? (
                              <Badge
                                variant="default"
                                className="bg-purple-500 hover:bg-purple-500 text-[10px]"
                              >
                                Repasse
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-[10px]">
                                Comprada
                              </Badge>
                            )}
                            <StatusMotoBadge status={m.status} />
                          </div>
                          <div className="text-xs text-keu-black/60 flex items-center gap-3 mt-0.5">
                            <span>
                              {m.anoModelo} · {m.cor}
                            </span>
                            {data && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(data)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold">
                            {formatCurrency(valor)}
                          </div>
                          <div className="text-xs text-keu-black/60">
                            {isRepasse ? "combinado" : "pago"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ALUGUÉIS FEITOS */}
          {alugueisDaPessoa.length > 0 && (
            <Card className="overflow-hidden">
              <div className="p-5 border-b border-keu-black/5 bg-blue-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 text-white w-10 h-10 rounded-lg flex items-center justify-center">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold">Histórico de aluguéis</h2>
                    <p className="text-xs text-keu-black/60">
                      Locações realizadas por essa pessoa
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-keu-black/5">
                {alugueisDaPessoa.map((a) => (
                  <Link
                    key={a._id}
                    href={`/dashboard/aluguel/${a._id}`}
                    className="block p-4 hover:bg-keu-gray-light transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{a.motoModelo}</span>
                          <AluguelStatusBadge status={a.status} />
                        </div>
                        <div className="text-xs text-keu-black/60 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(a.dataInicio)} → {formatDate(a.dataFim)}
                          </span>
                          <span>{a.diasContratados} dias</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold">
                          {formatCurrency(a.valorTotal)}
                        </div>
                        <div className="text-xs text-keu-black/60">total</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* ENDEREÇO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-keu-black/5">
              <div className="bg-emerald-600 text-white w-10 h-10 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="font-bold">Endereço</h2>
            </div>
            {enderecoCompleto ? (
              <p className="text-sm">{enderecoCompleto}</p>
            ) : (
              <p className="text-sm text-keu-black/40">
                Nenhum endereço cadastrado
              </p>
            )}
          </Card>

          {/* DADOS BANCÁRIOS */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-black text-white w-10 h-10 rounded-lg flex items-center justify-center">
                <Banknote className="h-5 w-5" />
              </div>
              <h2 className="font-bold">Dados bancários</h2>
            </div>
            {proprietario.pixChave ||
            proprietario.banco ||
            proprietario.agencia ||
            proprietario.conta ? (
              <div className="space-y-4">
                {proprietario.pixChave && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="text-xs font-semibold uppercase text-emerald-700 mb-1 flex items-center gap-1.5">
                      <CreditCard className="h-3 w-3" /> PIX
                      {proprietario.pixTipo && (
                        <span className="capitalize">
                          ({proprietario.pixTipo})
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-sm break-all">
                      {proprietario.pixChave}
                    </div>
                  </div>
                )}
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  {proprietario.banco && (
                    <div>
                      <div className="text-xs text-keu-black/60 mb-1">Banco</div>
                      <div className="font-medium">{proprietario.banco}</div>
                    </div>
                  )}
                  {proprietario.agencia && (
                    <div>
                      <div className="text-xs text-keu-black/60 mb-1">
                        Agência
                      </div>
                      <div className="font-mono">{proprietario.agencia}</div>
                    </div>
                  )}
                  {proprietario.conta && (
                    <div>
                      <div className="text-xs text-keu-black/60 mb-1">Conta</div>
                      <div className="font-mono">{proprietario.conta}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-keu-black/40">
                Nenhum dado bancário cadastrado
              </p>
            )}
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* FOTO + STATUS */}
          <Card className="p-6 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              {proprietario.fotoPessoal ? (
                // Foto pessoal — provavelmente base64; lazy + decoding async
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proprietario.fotoPessoal}
                  alt={proprietario.nome}
                  loading="lazy"
                  decoding="async"
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-keu-red/20"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-keu-red to-keu-red-dark text-white flex items-center justify-center text-5xl font-black ring-4 ring-keu-red/20">
                  {proprietario.nome.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="font-bold mb-2">{proprietario.nome}</h3>
            <Badge variant="success">
              <CheckCircle2 className="h-3 w-3" /> Ativo
            </Badge>
          </Card>

          {/* DOCUMENTOS */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-keu-red" />
              <h3 className="font-bold">Documentos</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {docs.filter((d) => d.foto).length === 0 ? (
                <p className="text-xs text-keu-black/40">
                  Nenhum documento anexado
                </p>
              ) : (
                docs.map((d) =>
                  d.foto ? (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => openImage(d.foto)}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    >
                      {d.icon}
                      {d.label}
                    </button>
                  ) : null
                )
              )}
            </div>
          </Card>

          {/* OBSERVAÇÕES */}
          <Card className="p-6">
            <h3 className="font-bold mb-3 text-sm">Observações internas</h3>
            {proprietario.observacoes ? (
              <p className="text-sm text-keu-black/70 whitespace-pre-wrap">
                {proprietario.observacoes}
              </p>
            ) : (
              <p className="text-xs text-keu-black/40">Sem observações</p>
            )}
          </Card>
        </div>
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
    lavagem: { v: "info", l: "Lavagem" },
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

function AluguelStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { v: "success" | "info" | "warning" | "danger"; l: string }
  > = {
    ativo: { v: "info", l: "Ativo" },
    concluido: { v: "success", l: "Concluído" },
    atrasado: { v: "danger", l: "Atrasado" },
    cancelado: { v: "warning", l: "Cancelado" },
  };
  const conf = map[status] || { v: "warning" as const, l: status };
  return (
    <Badge variant={conf.v} className="text-[10px]">
      {conf.l}
    </Badge>
  );
}
