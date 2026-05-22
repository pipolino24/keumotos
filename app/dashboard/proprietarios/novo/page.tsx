"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Building2,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { lookupCep, formatCep } from "@/lib/cep";
import { formatCpfInput, formatPhoneInput } from "@/lib/utils";

type PixTipo = "cpf" | "email" | "telefone" | "aleatoria";

export default function NovoProprietarioPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    rg: "",
    cnh: "",
    email: "",
    telefone: "",
    whatsapp: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    pixTipo: "" as PixTipo | "",
    pixChave: "",
    banco: "",
    agencia: "",
    conta: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepSuccess, setCepSuccess] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleCepChange(raw: string) {
    const formatted = formatCep(raw);
    set("cep", formatted);
    setCepSuccess(false);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await lookupCep(digits);
      if (data) {
        setForm((p) => ({
          ...p,
          endereco: data.logradouro || p.endereco,
          bairro: data.bairro || p.bairro,
          cidade: data.cidade || p.cidade,
          estado: data.estado || p.estado,
        }));
        setCepSuccess(true);
        toast.success(`CEP encontrado: ${data.cidade}/${data.estado}`);
      } else {
        toast.error("CEP não encontrado — preencha manualmente");
      }
    } finally {
      setCepLoading(false);
    }
  }

  const valid =
    form.nome.trim().length >= 2 &&
    form.cpf.replace(/\D/g, "").length >= 11 &&
    form.telefone.replace(/\D/g, "").length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      const m = "Nome, CPF (11 dígitos) e telefone são obrigatórios.";
      setError(m);
      toast.error(m);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        nome: form.nome.trim(),
        cpf: form.cpf.trim(),
        telefone: form.telefone.trim(),
      };
      // Opcionais — só envia se preenchido (Zod aceita ausência)
      const opt: (keyof typeof form)[] = [
        "rg",
        "cnh",
        "email",
        "whatsapp",
        "cep",
        "endereco",
        "numero",
        "bairro",
        "cidade",
        "estado",
        "pixChave",
        "banco",
        "agencia",
        "conta",
      ];
      for (const k of opt) {
        const v = form[k];
        if (typeof v === "string" && v.trim()) body[k] = v.trim();
      }
      if (form.pixTipo) body.pixTipo = form.pixTipo;

      const res = await fetch("/api/proprietarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Erro ao cadastrar proprietário");
      }
      toast.success(`${form.nome} cadastrado(a) com sucesso!`);
      const id = json.proprietario?._id;
      if (id) {
        router.push(`/dashboard/proprietarios/${id}`);
      } else {
        router.push("/dashboard/proprietarios");
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "Erro desconhecido";
      setError(m);
      toast.error(m);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        href="/dashboard/proprietarios"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para proprietários
      </Link>

      <PageHeader
        title="Cadastrar proprietário"
        description="Dono externo de moto, fornecedor ou pessoa de contato. Para registrar a moto vinda dele, use o botão Compra/Repasse no Estoque."
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* DADOS PESSOAIS */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-keu-black/5">
            <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Dados pessoais</h2>
              <p className="text-sm text-keu-black/60">
                Identificação do proprietário
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="nome" required>
                Nome completo
              </Label>
              <Input
                id="nome"
                required
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Ex: João da Silva"
              />
            </div>
            <div>
              <Label htmlFor="cpf" required>
                CPF
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  id="cpf"
                  required
                  className="pl-9"
                  value={form.cpf}
                  onChange={(e) => set("cpf", formatCpfInput(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  maxLength={14}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                value={form.rg}
                onChange={(e) => set("rg", e.target.value)}
                placeholder="00.000.000-0"
              />
            </div>
            <div>
              <Label htmlFor="cnh">CNH</Label>
              <Input
                id="cnh"
                value={form.cnh}
                onChange={(e) => set("cnh", e.target.value)}
                placeholder="Número da CNH"
              />
            </div>
            <div>
              <Label htmlFor="telefone" required>
                Telefone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  id="telefone"
                  required
                  className="pl-9"
                  value={form.telefone}
                  onChange={(e) =>
                    set("telefone", formatPhoneInput(e.target.value))
                  }
                  placeholder="(88) 99999-9999"
                  inputMode="numeric"
                  maxLength={15}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  id="whatsapp"
                  className="pl-9"
                  value={form.whatsapp}
                  onChange={(e) =>
                    set("whatsapp", formatPhoneInput(e.target.value))
                  }
                  placeholder="(88) 99999-9999"
                  inputMode="numeric"
                  maxLength={15}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* ENDEREÇO */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-keu-black/5">
            <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Endereço (opcional)</h2>
              <p className="text-sm text-keu-black/60">
                Para correspondência ou visita técnica
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <div className="relative">
                <Input
                  id="cep"
                  value={form.cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  inputMode="numeric"
                />
                {cepLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-keu-red" />
                )}
                {cepSuccess && !cepLoading && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                )}
              </div>
              <p className="text-[11px] text-keu-black/50 mt-1">
                Preenche logradouro/bairro/cidade automaticamente
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="endereco">Logradouro</Label>
              <Input
                id="endereco"
                value={form.endereco}
                onChange={(e) => set("endereco", e.target.value)}
                placeholder="Rua, Av..."
              />
            </div>
            <div>
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={form.numero}
                onChange={(e) => set("numero", e.target.value)}
                placeholder="123"
              />
            </div>
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={form.bairro}
                onChange={(e) => set("bairro", e.target.value)}
                placeholder="Bairro"
              />
            </div>
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={form.cidade}
                onChange={(e) => set("cidade", e.target.value)}
                placeholder="Juazeiro do Norte"
              />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input
                id="estado"
                value={form.estado}
                onChange={(e) =>
                  set("estado", e.target.value.toUpperCase().slice(0, 2))
                }
                placeholder="CE"
                maxLength={2}
              />
            </div>
          </div>
        </Card>

        {/* DADOS BANCÁRIOS / PIX */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-keu-black/5">
            <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Dados bancários / PIX (opcional)</h2>
              <p className="text-sm text-keu-black/60">
                Para repasses de venda de moto em consignação
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pixTipo">Tipo de chave PIX</Label>
              <Select
                id="pixTipo"
                value={form.pixTipo}
                onChange={(e) =>
                  set("pixTipo", e.target.value as PixTipo | "")
                }
              >
                <option value="">Selecione...</option>
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Aleatória</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="pixChave">Chave PIX</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  id="pixChave"
                  className="pl-9"
                  value={form.pixChave}
                  onChange={(e) => set("pixChave", e.target.value)}
                  placeholder="Chave do PIX"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="banco">Banco</Label>
              <Input
                id="banco"
                value={form.banco}
                onChange={(e) => set("banco", e.target.value)}
                placeholder="Ex: Caixa, BB, Itaú..."
              />
            </div>
            <div>
              <Label htmlFor="agencia">Agência</Label>
              <Input
                id="agencia"
                value={form.agencia}
                onChange={(e) => set("agencia", e.target.value)}
                placeholder="0000"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="conta">Conta</Label>
              <Input
                id="conta"
                value={form.conta}
                onChange={(e) => set("conta", e.target.value)}
                placeholder="00000-0"
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/dashboard/proprietarios">
            <Button type="button" variant="outline" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving || !valid}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Cadastrar proprietário
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
