"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Handshake,
  Save,
  Loader2,
  DollarSign,
  Banknote,
  Percent,
  Copy,
  Phone,
  Mail,
  MapPin,
  Pause,
  CheckCircle2,
  Ban,
  Info,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/confirm-dialog";

interface Afiliado {
  _id: string;
  codigo: string;
  nome: string;
  email: string;
  telefone: string;
  cidade?: string;
  estado?: string;
  bio?: string;
  instagram?: string;
  whatsapp?: string;
  avatar?: string;
  tipoComissao: "percentual" | "fixo";
  comissaoPercentual: number;
  comissaoFixa: number;
  valorMinimoVenda?: number;
  comissaoMaxima?: number;
  pixTipo?: "cpf" | "email" | "telefone" | "aleatoria";
  pixChave?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  contaTipo?: "corrente" | "poupanca";
  cpfTitular?: string;
  status: "ativo" | "pausado" | "bloqueado";
  aprovado: boolean;
  totalCliques: number;
  totalIndicacoes: number;
  totalVendas: number;
  comissaoAcumulada: number;
  comissaoPaga: number;
  comissaoPendente: number;
  observacoes?: string;
  createdAt: string;
}

export default function EditarAfiliadoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [afiliado, setAfiliado] = useState<Afiliado | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAfiliado();
  }, [id]);

  async function fetchAfiliado() {
    try {
      const res = await fetch(`/api/afiliados/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAfiliado(data.afiliado);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof Afiliado>(key: K, value: Afiliado[K]) {
    setAfiliado((a) => (a ? { ...a, [key]: value } : a));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!afiliado) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/afiliados/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(afiliado),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAfiliado(json.afiliado);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirmDialog({
      title: "Remover afiliado",
      message:
        "Tem certeza? O afiliado perderá acesso à área dele e os links pararão de funcionar. Essa ação não pode ser desfeita.",
      confirmText: "Remover",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/afiliados/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover");
      toast.success("Afiliado removido");
      router.push("/dashboard/afiliados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
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

  if (!afiliado) {
    return (
      <div className="p-16 text-center">
        <div className="text-red-600">{error ?? "Afiliado não encontrado"}</div>
      </div>
    );
  }

  const linkAfiliado =
    typeof window !== "undefined"
      ? `${window.location.origin}/m/${afiliado.codigo}`
      : `/m/${afiliado.codigo}`;

  const exemploVenda = 15000;
  const comissaoExemplo =
    afiliado.tipoComissao === "percentual"
      ? (exemploVenda * afiliado.comissaoPercentual) / 100
      : afiliado.comissaoFixa;

  return (
    <form onSubmit={handleSave}>
      <Link
        href="/dashboard/afiliados"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para afiliados
      </Link>

      <PageHeader
        title={afiliado.nome}
        description={`Código: /m/${afiliado.codigo}`}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(linkAfiliado);
            toast.success("Link copiado para a área de transferência");
          }}
        >
          <Copy className="h-4 w-4" /> Copiar link
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Salvo!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Salvar alterações
            </>
          )}
        </Button>
      </PageHeader>

      {error && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* HEADER do afiliado */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-purple-500/5 via-white to-keu-red/5">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="bg-gradient-to-br from-purple-500 to-keu-red text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-lg">
            {afiliado.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black">{afiliado.nome}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-keu-black/70 flex-wrap">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {afiliado.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {afiliado.telefone}
              </span>
              {afiliado.cidade && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {afiliado.cidade}
                  {afiliado.estado && `, ${afiliado.estado}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={afiliado.status} aprovado={afiliado.aprovado} />
              <Badge variant="outline" className="font-mono text-xs">
                /m/{afiliado.codigo}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat
          icon={<Users />}
          label="Cliques"
          value={afiliado.totalCliques}
          color="text-blue-600"
        />
        <MiniStat
          icon={<TrendingUp />}
          label="Vendas"
          value={afiliado.totalVendas}
          color="text-emerald-600"
        />
        <MiniStat
          icon={<DollarSign />}
          label="Comissão acumulada"
          value={formatCurrency(afiliado.comissaoAcumulada)}
          color="text-keu-red"
          isString
        />
        <MiniStat
          icon={<Info />}
          label="A pagar"
          value={formatCurrency(afiliado.comissaoPendente)}
          color="text-amber-600"
          isString
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* COMISSÃO */}
          <Card className="p-6 border-keu-red/30 bg-gradient-to-br from-keu-red/5 to-white">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-red/10">
              <div className="bg-keu-red text-white w-10 h-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Comissionamento</h2>
                <p className="text-sm text-keu-black/60">
                  Altere a qualquer momento — vale para vendas futuras
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label required>Tipo de comissão</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => update("tipoComissao", "percentual")}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      afiliado.tipoComissao === "percentual"
                        ? "border-keu-red bg-keu-red/5"
                        : "border-keu-black/10 hover:border-keu-black/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="h-4 w-4 text-keu-red" />
                      <span className="font-bold">Percentual</span>
                    </div>
                    <div className="text-xs text-keu-black/60">
                      % do valor da venda
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => update("tipoComissao", "fixo")}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      afiliado.tipoComissao === "fixo"
                        ? "border-keu-red bg-keu-red/5"
                        : "border-keu-black/10 hover:border-keu-black/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-keu-red" />
                      <span className="font-bold">Valor fixo</span>
                    </div>
                    <div className="text-xs text-keu-black/60">
                      R$ por venda
                    </div>
                  </button>
                </div>
              </div>

              {afiliado.tipoComissao === "percentual" ? (
                <div>
                  <Label htmlFor="percentual" required>Percentual</Label>
                  <div className="relative">
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                    <Input
                      id="percentual"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={afiliado.comissaoPercentual}
                      onChange={(e) =>
                        update("comissaoPercentual", Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="fixo" required>Valor por venda (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                      R$
                    </span>
                    <Input
                      id="fixo"
                      type="number"
                      min="0"
                      step="50"
                      className="pl-9"
                      value={afiliado.comissaoFixa}
                      onChange={(e) =>
                        update("comissaoFixa", Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vmin">
                    Venda mínima
                    <span className="text-xs text-keu-black/50 ml-1">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                      R$
                    </span>
                    <Input
                      id="vmin"
                      type="number"
                      min="0"
                      step="500"
                      placeholder="Sem mínimo"
                      className="pl-9"
                      value={afiliado.valorMinimoVenda ?? ""}
                      onChange={(e) =>
                        update(
                          "valorMinimoVenda",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cmax">
                    Teto
                    <span className="text-xs text-keu-black/50 ml-1">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                      R$
                    </span>
                    <Input
                      id="cmax"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="Sem teto"
                      className="pl-9"
                      value={afiliado.comissaoMaxima ?? ""}
                      onChange={(e) =>
                        update(
                          "comissaoMaxima",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Simulação */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase text-emerald-700">
                  <Info className="h-3 w-3" />
                  Simulação com venda exemplo
                </div>
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-keu-black/70">
                      Venda de {formatCurrency(exemploVenda)}:
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 font-bold">
                    <span>Afiliado recebe:</span>
                    <span className="text-lg">
                      {formatCurrency(comissaoExemplo)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* DADOS PESSOAIS */}
          <Card className="p-6">
            <h2 className="font-bold mb-4">Dados pessoais</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={afiliado.nome}
                  onChange={(e) => update("nome", e.target.value)}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={afiliado.telefone}
                  onChange={(e) => update("telefone", e.target.value)}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={afiliado.cidade ?? ""}
                  onChange={(e) => update("cidade", e.target.value)}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={afiliado.estado ?? ""}
                  onChange={(e) =>
                    update("estado", e.target.value.toUpperCase())
                  }
                  maxLength={2}
                  className="uppercase"
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input
                  value={afiliado.instagram ?? ""}
                  onChange={(e) => update("instagram", e.target.value)}
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={afiliado.whatsapp ?? ""}
                  onChange={(e) => update("whatsapp", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label>Bio</Label>
                <Textarea
                  rows={3}
                  value={afiliado.bio ?? ""}
                  onChange={(e) => update("bio", e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* PAGAMENTO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Banknote className="h-5 w-5 text-emerald-600" />
              <h2 className="font-bold">Dados de pagamento</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de chave PIX</Label>
                  <Select
                    value={afiliado.pixTipo ?? ""}
                    onChange={(e) =>
                      update(
                        "pixTipo",
                        (e.target.value || undefined) as Afiliado["pixTipo"]
                      )
                    }
                  >
                    <option value="">Selecione...</option>
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Chave aleatória</option>
                  </Select>
                </div>
                <div>
                  <Label>Chave PIX</Label>
                  <Input
                    value={afiliado.pixChave ?? ""}
                    onChange={(e) => update("pixChave", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Banco</Label>
                  <Input
                    value={afiliado.banco ?? ""}
                    onChange={(e) => update("banco", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Agência</Label>
                  <Input
                    value={afiliado.agencia ?? ""}
                    onChange={(e) => update("agencia", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Conta</Label>
                  <Input
                    value={afiliado.conta ?? ""}
                    onChange={(e) => update("conta", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de conta</Label>
                  <Select
                    value={afiliado.contaTipo ?? ""}
                    onChange={(e) =>
                      update(
                        "contaTipo",
                        (e.target.value || undefined) as Afiliado["contaTipo"]
                      )
                    }
                  >
                    <option value="">Selecione...</option>
                    <option value="corrente">Corrente</option>
                    <option value="poupanca">Poupança</option>
                  </Select>
                </div>
                <div>
                  <Label>CPF titular</Label>
                  <Input
                    value={afiliado.cpfTitular ?? ""}
                    onChange={(e) => update("cpfTitular", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Status do afiliado</h3>
            <div className="space-y-2">
              <StatusToggle
                active={afiliado.status === "ativo" && afiliado.aprovado}
                icon={<CheckCircle2 />}
                label="Ativo"
                description="Pode divulgar e gerar comissão"
                color="emerald"
                onClick={() => {
                  update("aprovado", true);
                  update("status", "ativo");
                }}
              />
              <StatusToggle
                active={afiliado.status === "pausado"}
                icon={<Pause />}
                label="Pausado"
                description="Vendas não geram comissão temporariamente"
                color="amber"
                onClick={() => update("status", "pausado")}
              />
              <StatusToggle
                active={afiliado.status === "bloqueado"}
                icon={<Ban />}
                label="Bloqueado"
                description="Afiliado não pode acessar o sistema"
                color="red"
                onClick={() => update("status", "bloqueado")}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4">Link do afiliado</h3>
            <div className="bg-keu-gray-light rounded-lg p-3 mb-3">
              <code className="text-xs font-mono break-all">{linkAfiliado}</code>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(linkAfiliado);
                toast.success("Link copiado");
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copiar link
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-3">Observações internas</h3>
            <Textarea
              rows={4}
              value={afiliado.observacoes ?? ""}
              onChange={(e) => update("observacoes", e.target.value)}
              placeholder="Anotações privadas..."
            />
          </Card>

          <Card className="p-6 border-red-200 bg-red-50">
            <h3 className="font-bold mb-3 text-red-700">Zona perigosa</h3>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
            >
              Remover afiliado
            </Button>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
        <Link href="/dashboard/afiliados">
          <Button type="button" variant="outline" disabled={saving}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Salvar alterações
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function MiniStat({
  icon,
  label,
  value,
  color,
  isString,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  isString?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className={`text-xl font-black ${isString ? "" : color}`}>
        {value}
      </div>
      <div className="text-xs text-keu-black/60">{label}</div>
    </Card>
  );
}

function StatusBadge({
  status,
  aprovado,
}: {
  status: string;
  aprovado: boolean;
}) {
  if (!aprovado) {
    return (
      <Badge variant="warning">
        <Info className="h-3 w-3" /> Pendente aprovação
      </Badge>
    );
  }
  const map: Record<
    string,
    { v: "success" | "warning" | "danger"; l: string; i: React.ReactNode }
  > = {
    ativo: { v: "success", l: "Ativo", i: <CheckCircle2 className="h-3 w-3" /> },
    pausado: { v: "warning", l: "Pausado", i: <Pause className="h-3 w-3" /> },
    bloqueado: { v: "danger", l: "Bloqueado", i: <Ban className="h-3 w-3" /> },
  };
  const conf = map[status] || { v: "warning" as const, l: status, i: null };
  return (
    <Badge variant={conf.v}>
      {conf.i}
      {conf.l}
    </Badge>
  );
}

function StatusToggle({
  active,
  icon,
  label,
  description,
  color,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: "emerald" | "amber" | "red";
  onClick: () => void;
}) {
  const colors = {
    emerald: "border-emerald-500 bg-emerald-50 text-emerald-700",
    amber: "border-amber-500 bg-amber-50 text-amber-700",
    red: "border-red-500 bg-red-50 text-red-700",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-3 rounded-lg border-2 text-left transition ${
        active
          ? colors[color]
          : "border-keu-black/10 hover:border-keu-black/30 bg-white"
      }`}
    >
      <div className="flex items-center gap-2 font-semibold text-sm mb-0.5">
        <span className="h-4 w-4">{icon}</span>
        {label}
      </div>
      <div className="text-xs text-keu-black/60">{description}</div>
    </button>
  );
}
