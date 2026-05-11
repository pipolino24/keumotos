"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Handshake,
  Save,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Banknote,
  Info,
  Percent,
  CheckCircle2,
} from "lucide-react";
import { Instagram } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import { formatCurrency } from "@/lib/utils";

type Form = {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  instagram: string;
  whatsapp: string;
  bio: string;
  avatar: string[];

  tipoComissao: "percentual" | "fixo";
  comissaoPercentual: number | "";
  comissaoFixa: number | "";
  valorMinimoVenda: number | "";
  comissaoMaxima: number | "";

  pixTipo: "" | "cpf" | "email" | "telefone" | "aleatoria";
  pixChave: string;
  banco: string;
  agencia: string;
  conta: string;
  contaTipo: "" | "corrente" | "poupanca";
  cpfTitular: string;

  aprovado: boolean;
  observacoes: string;
};

const initial: Form = {
  nome: "",
  email: "",
  telefone: "",
  cidade: "",
  estado: "",
  instagram: "",
  whatsapp: "",
  bio: "",
  avatar: [],
  tipoComissao: "percentual",
  comissaoPercentual: 3,
  comissaoFixa: "",
  valorMinimoVenda: "",
  comissaoMaxima: "",
  pixTipo: "",
  pixChave: "",
  banco: "",
  agencia: "",
  conta: "",
  contaTipo: "",
  cpfTitular: "",
  aprovado: true,
  observacoes: "",
};

export default function NovoAfiliadoPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/afiliados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          avatar: form.avatar[0],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao cadastrar");
      router.push("/dashboard/afiliados");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setSaving(false);
    }
  }

  // Simulação de comissão
  const exemploVenda = 15000;
  const comissaoExemplo =
    form.tipoComissao === "percentual"
      ? (exemploVenda * Number(form.comissaoPercentual || 0)) / 100
      : Number(form.comissaoFixa || 0);

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href="/dashboard/afiliados"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para afiliados
      </Link>

      <PageHeader
        title="Novo afiliado"
        description="Cadastre uma pessoa para divulgar motos da KEU"
      >
        <Button type="button" variant="outline" disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Cadastrar afiliado
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* DADOS PESSOAIS */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-purple-500/10 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Dados pessoais</h2>
                <p className="text-sm text-keu-black/60">
                  Informações de contato do afiliado
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome" required>Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="nome"
                    placeholder="João Silva"
                    className="pl-10"
                    required
                    value={form.nome}
                    onChange={(e) => set("nome", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" required>E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    className="pl-10"
                    required
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="telefone" required>Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="telefone"
                    placeholder="(88) 99999-9999"
                    className="pl-10"
                    required
                    value={form.telefone}
                    onChange={(e) => set("telefone", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="cidade"
                    placeholder="Juazeiro do Norte"
                    className="pl-10"
                    value={form.cidade}
                    onChange={(e) => set("cidade", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  placeholder="CE"
                  maxLength={2}
                  className="uppercase"
                  value={form.estado}
                  onChange={(e) => set("estado", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="instagram"
                    placeholder="@usuario"
                    className="pl-10"
                    value={form.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="(88) 99999-9999"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="bio">Bio / Sobre</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder="Breve descrição do afiliado, sua audiência, etc..."
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* COMISSÃO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Comissionamento</h2>
                <p className="text-sm text-keu-black/60">
                  Defina como esse afiliado será remunerado
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label required>Tipo de comissão</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => set("tipoComissao", "percentual")}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      form.tipoComissao === "percentual"
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
                    onClick={() => set("tipoComissao", "fixo")}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      form.tipoComissao === "fixo"
                        ? "border-keu-red bg-keu-red/5"
                        : "border-keu-black/10 hover:border-keu-black/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-keu-red" />
                      <span className="font-bold">Valor fixo</span>
                    </div>
                    <div className="text-xs text-keu-black/60">
                      Valor em R$ por venda
                    </div>
                  </button>
                </div>
              </div>

              {form.tipoComissao === "percentual" ? (
                <div>
                  <Label htmlFor="percentual" required>Percentual de comissão</Label>
                  <div className="relative">
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                    <Input
                      id="percentual"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="3"
                      value={form.comissaoPercentual}
                      onChange={(e) =>
                        set(
                          "comissaoPercentual",
                          e.target.value ? Number(e.target.value) : ""
                        )
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
                      placeholder="200"
                      className="pl-9"
                      value={form.comissaoFixa}
                      onChange={(e) =>
                        set(
                          "comissaoFixa",
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vmin">
                    Venda mínima
                    <span className="text-xs text-keu-black/50 ml-1 font-normal">
                      (opcional)
                    </span>
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
                      placeholder="0"
                      className="pl-9"
                      value={form.valorMinimoVenda}
                      onChange={(e) =>
                        set(
                          "valorMinimoVenda",
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cmax">
                    Teto da comissão
                    <span className="text-xs text-keu-black/50 ml-1 font-normal">
                      (opcional)
                    </span>
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
                      value={form.comissaoMaxima}
                      onChange={(e) =>
                        set(
                          "comissaoMaxima",
                          e.target.value ? Number(e.target.value) : ""
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
                  Simulação
                </div>
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-keu-black/70">Venda exemplo:</span>
                    <span className="font-semibold">
                      {formatCurrency(exemploVenda)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 font-bold">
                    <span>Afiliado ganha:</span>
                    <span className="text-lg">
                      {formatCurrency(comissaoExemplo)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* PAGAMENTO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Dados de pagamento</h2>
                <p className="text-sm text-keu-black/60">
                  Onde transferir as comissões (PIX ou conta bancária)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pixTipo">Tipo de chave PIX</Label>
                  <Select
                    id="pixTipo"
                    value={form.pixTipo}
                    onChange={(e) =>
                      set("pixTipo", e.target.value as Form["pixTipo"])
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
                  <Label htmlFor="pixChave">Chave PIX</Label>
                  <Input
                    id="pixChave"
                    placeholder="000.000.000-00"
                    value={form.pixChave}
                    onChange={(e) => set("pixChave", e.target.value)}
                  />
                </div>
              </div>

              <div className="text-xs text-keu-black/50 italic">
                Ou preencha conta bancária:
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    placeholder="Caixa, BB, Itaú..."
                    value={form.banco}
                    onChange={(e) => set("banco", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="agencia">Agência</Label>
                  <Input
                    id="agencia"
                    placeholder="0001"
                    value={form.agencia}
                    onChange={(e) => set("agencia", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="conta">Conta</Label>
                  <Input
                    id="conta"
                    placeholder="00000-0"
                    value={form.conta}
                    onChange={(e) => set("conta", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ctipo">Tipo de conta</Label>
                  <Select
                    id="ctipo"
                    value={form.contaTipo}
                    onChange={(e) =>
                      set("contaTipo", e.target.value as Form["contaTipo"])
                    }
                  >
                    <option value="">Selecione...</option>
                    <option value="corrente">Corrente</option>
                    <option value="poupanca">Poupança</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cpfTitular">CPF do titular</Label>
                  <Input
                    id="cpfTitular"
                    placeholder="000.000.000-00"
                    value={form.cpfTitular}
                    onChange={(e) => set("cpfTitular", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Foto do afiliado</h3>
            <ImageUpload
              value={form.avatar}
              onChange={(v) => set("avatar", v)}
              max={1}
              maxSizeKB={80}
              maxWidth={400}
              quality={0.8}
              shape="round"
              hint="Auto-comprimido ~80KB"
            />
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4">Status inicial</h3>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-keu-gray-light hover:bg-keu-red/5 transition">
              <input
                type="checkbox"
                className="mt-1 rounded border-keu-black/20 text-keu-red focus:ring-keu-red"
                checked={form.aprovado}
                onChange={(e) => set("aprovado", e.target.checked)}
              />
              <div>
                <div className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Aprovar imediatamente
                </div>
                <div className="text-xs text-keu-black/60 mt-0.5">
                  Afiliado já poderá gerar links e divulgar. Desmarque para
                  manter como pendente.
                </div>
              </div>
            </label>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4">Observações internas</h3>
            <Textarea
              rows={4}
              placeholder="Anotações privadas (não visíveis ao afiliado)..."
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </Card>

          <Card className="p-5 bg-gradient-to-br from-purple-500/5 to-keu-red/5">
            <div className="flex items-start gap-2">
              <Handshake className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-keu-black/70">
                Após cadastrar, o afiliado receberá um <strong>código único</strong> e
                poderá acessar o painel com seu e-mail. Você pode editar comissão,
                pausar ou bloquear a qualquer momento.
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
        <Button type="button" variant="outline" disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Cadastrar afiliado
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
