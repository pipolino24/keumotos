"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  User,
  Mail,
  Phone,
  CreditCard,
  Shield,
  KeyRound,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCpfInput, formatPhoneInput } from "@/lib/utils";

// "afiliado" continua existindo como role no backend mas não é mais
// criável via UI (sistema oculto 2026-06-05).
type Role = "cliente" | "vendedor";

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    // Dados pessoais — usados no contrato (sexo, nascimento, naturalidade,
    // RG, CNH, profissão, endereço). Coletando aqui evita preencher de
    // novo na hora de gerar contrato.
    sexo: "" as "" | "masculino" | "feminino" | "outro",
    nascimento: "",
    rg: "",
    cnh: "",
    cnh_validade: "",
    naturalidade: "",
    profissao: "",
    endereco_texto: "",
    role: "vendedor" as Role,
    setor: "multimarcas",
    senha: "",
    // RG/CNH — frente e/ou verso. Salvos em profile.documentos (JSONB).
    documentos: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nome.trim() || !form.email.trim()) {
      const m = "Nome e email são obrigatórios.";
      setError(m);
      toast.error(m);
      return;
    }
    if (form.senha && form.senha.length < 8) {
      const m = "Senha deve ter pelo menos 8 caracteres.";
      setError(m);
      toast.error(m);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          telefone: form.telefone || undefined,
          cpf: form.cpf || undefined,
          // Dados pessoais (contrato)
          sexo: form.sexo || undefined,
          nascimento: form.nascimento || undefined,
          rg: form.rg || undefined,
          cnh: form.cnh || undefined,
          cnh_validade: form.cnh_validade || undefined,
          naturalidade: form.naturalidade || undefined,
          profissao: form.profissao || undefined,
          // endereco em JSONB { texto } — flexível pra futuro estruturar
          endereco: form.endereco_texto
            ? { texto: form.endereco_texto }
            : undefined,
          role: form.role,
          setor: form.setor,
          senha: form.senha || undefined,
          documentos: form.documentos.length > 0 ? form.documentos : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Erro ao criar usuário");

      toast.success(`${form.nome} cadastrado(a) com sucesso!`);
      if (json.senhaTemporaria) {
        setSenhaGerada(json.senhaTemporaria);
      } else {
        router.push("/dashboard/usuarios");
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "Erro desconhecido";
      setError(m);
      toast.error(m);
    } finally {
      setSaving(false);
    }
  }

  function copiarSenha() {
    if (!senhaGerada || typeof window === "undefined") return;
    navigator.clipboard.writeText(senhaGerada).then(
      () => toast.success("Senha copiada"),
      () => toast.error("Falha ao copiar")
    );
  }

  if (senhaGerada) {
    return (
      <div>
        <Link
          href="/dashboard/usuarios"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para usuários
        </Link>

        <PageHeader
          title="Usuário criado"
          description="Anote a senha temporária — ela só aparece uma vez"
        />

        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 max-w-xl">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-900">
              {form.nome} foi cadastrado(a) como {form.role}
            </h3>
          </div>
          <p className="text-sm text-emerald-800/80 mb-4">
            Repasse a senha temporária abaixo. O usuário deve trocá-la no
            primeiro login.
          </p>

          <div className="bg-white border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 mb-4">
            <code className="font-mono text-lg font-bold text-keu-black break-all">
              {senhaGerada}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copiarSenha}
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </Button>
          </div>

          <div className="flex gap-2">
            <Link href="/dashboard/usuarios">
              <Button variant="outline">Voltar para usuários</Button>
            </Link>
            <Button
              onClick={() => {
                setSenhaGerada(null);
                setForm({
                  nome: "",
                  email: "",
                  telefone: "",
                  cpf: "",
                  sexo: "",
                  nascimento: "",
                  rg: "",
                  cnh: "",
                  cnh_validade: "",
                  naturalidade: "",
                  profissao: "",
                  endereco_texto: "",
                  role: "vendedor",
                  setor: "multimarcas",
                  senha: "",
                  documentos: [],
                });
              }}
            >
              Cadastrar outro
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/usuarios"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para usuários
      </Link>

      <PageHeader
        title="Novo usuário"
        description="Cadastre clientes ou vendedores. Promoção para admin é feita depois pelo PATCH."
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-keu-black/5">
            <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Dados básicos</h2>
              <p className="text-sm text-keu-black/60">
                Informações de contato e identificação
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
                onChange={(e) => update("nome", e.target.value)}
                placeholder="Ex: Maria Silva"
              />
            </div>
            <div>
              <Label htmlFor="email" required>
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-9"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="usuario@exemplo.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  id="telefone"
                  className="pl-9"
                  value={form.telefone}
                  onChange={(e) =>
                    update("telefone", formatPhoneInput(e.target.value))
                  }
                  placeholder="(88) 99999-9999"
                  inputMode="numeric"
                  maxLength={15}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  id="cpf"
                  className="pl-9"
                  value={form.cpf}
                  onChange={(e) =>
                    update("cpf", formatCpfInput(e.target.value))
                  }
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  maxLength={14}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Dados pessoais — pra preencher contrato sem digitar de novo */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-keu-black/5">
            <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Dados pessoais (contrato)</h2>
              <p className="text-sm text-keu-black/60">
                Preenchendo aqui, contrato sai pronto na locação — sem
                redigitar.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sexo">Sexo</Label>
              <Select
                id="sexo"
                value={form.sexo}
                onChange={(e) =>
                  update(
                    "sexo",
                    e.target.value as "" | "masculino" | "feminino" | "outro"
                  )
                }
              >
                <option value="">Selecione…</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="nascimento">Nascimento</Label>
              <Input
                id="nascimento"
                type="date"
                value={form.nascimento}
                onChange={(e) => update("nascimento", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                value={form.rg}
                onChange={(e) => update("rg", e.target.value)}
                placeholder="00.000.000-0"
              />
            </div>
            <div>
              <Label htmlFor="naturalidade">Naturalidade</Label>
              <Input
                id="naturalidade"
                value={form.naturalidade}
                onChange={(e) => update("naturalidade", e.target.value)}
                placeholder="Cidade onde nasceu"
              />
            </div>
            <div>
              <Label htmlFor="cnh">CNH</Label>
              <Input
                id="cnh"
                value={form.cnh}
                onChange={(e) => update("cnh", e.target.value)}
                placeholder="Nº da CNH"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label htmlFor="cnh_validade">Validade da CNH</Label>
              <Input
                id="cnh_validade"
                type="date"
                value={form.cnh_validade}
                onChange={(e) => update("cnh_validade", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="profissao">Profissão</Label>
              <Input
                id="profissao"
                value={form.profissao}
                onChange={(e) => update("profissao", e.target.value)}
                placeholder="Ex: motorista, vendedor, autônomo"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="endereco_texto">Endereço completo</Label>
              <Input
                id="endereco_texto"
                value={form.endereco_texto}
                onChange={(e) => update("endereco_texto", e.target.value)}
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-keu-black/5">
            <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Permissão e acesso</h2>
              <p className="text-sm text-keu-black/60">
                Cargo no sistema e senha de primeiro login
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role" required>
                Cargo
              </Label>
              <Select
                id="role"
                value={form.role}
                onChange={(e) => update("role", e.target.value as Role)}
              >
                <option value="vendedor">Vendedor</option>
                <option value="cliente">Cliente</option>
              </Select>
              <p className="text-[11px] text-keu-black/50 mt-1">
                Para promover a admin depois, edite o perfil do usuário.
              </p>
            </div>
            <div>
              <Label htmlFor="senha">Senha (opcional)</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  id="senha"
                  type="text"
                  className="pl-9"
                  value={form.senha}
                  onChange={(e) => update("senha", e.target.value)}
                  placeholder="Em branco = gerar aleatória"
                />
              </div>
              <p className="text-[11px] text-keu-black/50 mt-1">
                Mínimo 8 caracteres. Deixe em branco para gerar automaticamente.
              </p>
            </div>
          </div>
        </Card>

        {/* DOCUMENTOS DO CLIENTE (RG/CNH frente + verso) */}
        <Card className="p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Documentos (opcional)</h2>
              <p className="text-xs text-keu-black/60">
                RG, CNH ou CPF — frente e verso. Importante pra venda /
                aluguel / empréstimo.
              </p>
            </div>
          </div>
          <ImageUpload
            value={form.documentos}
            onChange={(documentos) => update("documentos", documentos)}
            max={4}
            maxSizeKB={300}
            maxWidth={1600}
            quality={0.80}
            hint="Suba frente e verso do RG ou CNH. Comprimimos pra ~300KB"
          />
        </Card>

        <div className="flex gap-2 justify-end mt-6">
          <Link href="/dashboard/usuarios">
            <Button type="button" variant="outline" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Cadastrar usuário
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
