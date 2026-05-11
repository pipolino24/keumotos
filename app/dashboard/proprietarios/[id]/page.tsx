"use client";

import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApi } from "@/lib/hooks/use-api";
import { apiDelete } from "@/lib/api-client";
import { formatDate, formatPhone } from "@/lib/utils";
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

export default function ProprietarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, loading, error } = useApi<{ proprietario: Prop }>(
    id ? `/api/proprietarios/${id}` : null
  );

  const proprietario = data?.proprietario;

  async function handleDelete() {
    const ok = await confirmDialog({
      title: "Remover proprietário",
      message:
        "Tem certeza? Os dados do proprietário serão excluídos. Motos vinculadas ficarão sem dono cadastrado. Essa ação não pode ser desfeita.",
      confirmText: "Remover",
      variant: "destructive",
    });
    if (!ok) return;
    const res = await apiDelete(`/api/proprietarios/${id}`);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Proprietário removido");
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
          <h3 className="font-bold mb-1">Proprietário não encontrado</h3>
          <p className="text-sm text-keu-black/60 mb-4">
            {error ?? "O proprietário pode ter sido removido."}
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
        <ArrowLeft className="h-4 w-4" /> Voltar para proprietários
      </Link>

      <PageHeader
        title={proprietario.nome}
        description={`Cadastrado em ${formatDate(proprietario.createdAt)}`}
      >
        <Button type="button" variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" /> Excluir
        </Button>
      </PageHeader>

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
                <Image
                  src={proprietario.fotoPessoal}
                  alt={proprietario.nome}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-keu-red/20"
                  unoptimized
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
