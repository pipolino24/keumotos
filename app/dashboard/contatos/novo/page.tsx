"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  UserPlus,
  Phone,
  Mail,
  MessageCircle,
  Tag,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { toast } from "sonner";
import { useApi } from "@/lib/hooks/use-api";
import { formatPhoneInput } from "@/lib/utils";

interface MotoApi {
  _id: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  placa?: string;
}

interface UserApi {
  _id: string;
  nome: string;
  role: string;
}

export default function NovoContatoPage() {
  const router = useRouter();

  const { data: motosData } = useApi<{ motos: MotoApi[] }>(
    "/api/motos?status=disponivel"
  );
  const motos = motosData?.motos ?? [];

  const { data: usersData } = useApi<{ users: UserApi[] }>(
    "/api/users?role=vendedor"
  );
  const vendedores = usersData?.users ?? [];

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [origem, setOrigem] = useState("");
  const [interesse, setInteresse] = useState("");
  const [motoInteresse, setMotoInteresse] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [vendedorResponsavel, setVendedorResponsavel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    nome.trim().length >= 2 &&
    telefone.trim().length >= 8 &&
    !!origem &&
    !!interesse;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError(
        "Preencha nome, telefone (mínimo 8 dígitos), origem e interesse."
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        origem,
        interesse,
      };
      if (email.trim()) body.email = email.trim();
      if (whatsapp.trim()) body.whatsapp = whatsapp.trim();
      if (motoInteresse) body.motoInteresse = motoInteresse;
      if (observacoes.trim()) body.observacoes = observacoes.trim();
      if (vendedorResponsavel) body.vendedorResponsavel = vendedorResponsavel;

      const res = await fetch("/api/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar contato");
      toast.success("Contato cadastrado com sucesso");
      router.push("/dashboard/contatos");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href="/dashboard/contatos"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para contatos
      </Link>

      <PageHeader
        title="Novo contato"
        description="Cadastre um novo lead no pipeline"
      >
        <Link href="/dashboard/contatos">
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
              <Save className="h-4 w-4" /> Cadastrar contato
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
          {/* DADOS DO CONTATO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Dados do contato</h2>
                <p className="text-sm text-keu-black/60">
                  Informações para falar com o lead
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
                  placeholder="Ex: João da Silva"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="telefone" required>
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(88) 99999-9999"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhoneInput(e.target.value))}
                  inputMode="numeric"
                  maxLength={15}
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(88) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhoneInput(e.target.value))}
                  inputMode="numeric"
                  maxLength={15}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* ORIGEM & INTERESSE */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-keu-black/5">
              <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Origem & Interesse</h2>
                <p className="text-sm text-keu-black/60">
                  Por onde chegou e o que está procurando
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origem" required>
                  Origem do contato
                </Label>
                <Select
                  id="origem"
                  required
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                >
                  <option value="">— Selecione —</option>
                  <option value="site">Site</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="presencial">Presencial</option>
                  <option value="indicacao">Indicação</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="interesse" required>
                  Tipo de interesse
                </Label>
                <Select
                  id="interesse"
                  required
                  value={interesse}
                  onChange={(e) => setInteresse(e.target.value)}
                >
                  <option value="">— Selecione —</option>
                  <option value="compra">Compra</option>
                  <option value="venda">Venda</option>
                  <option value="troca">Troca</option>
                  <option value="aluguel">Aluguel</option>
                  <option value="pecas">Peças</option>
                  <option value="outro">Outro</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="motoInteresse">
                  Moto de interesse (estoque disponível)
                </Label>
                <Select
                  id="motoInteresse"
                  value={motoInteresse}
                  onChange={(e) => setMotoInteresse(e.target.value)}
                >
                  <option value="">— Nenhuma específica —</option>
                  {motos.map((m) => (
                    <option key={m._id} value={`${m.marca} ${m.modelo} ${m.anoModelo}`}>
                      {m.marca} {m.modelo} ({m.anoModelo})
                      {m.placa ? ` — ${m.placa}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          {/* OBSERVAÇÕES */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-keu-black/5">
              <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Observações</h2>
                <p className="text-sm text-keu-black/60">
                  Anotações livres sobre o lead
                </p>
              </div>
            </div>
            <Textarea
              rows={4}
              placeholder="Ex: Cliente pediu para retornar na semana que vem, prefere financiamento em até 36x..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-keu-black/60 mb-3">
              Atribuição
            </h3>
            <div>
              <Label htmlFor="vendedor">Vendedor responsável</Label>
              <Select
                id="vendedor"
                value={vendedorResponsavel}
                onChange={(e) => setVendedorResponsavel(e.target.value)}
              >
                <option value="">— Sem responsável —</option>
                {vendedores.map((v) => (
                  <option key={v._id} value={v.nome}>
                    {v.nome}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-keu-black/60 mt-2">
                O vendedor poderá ver e atualizar o lead no pipeline.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-keu-black/60 mb-3">
              Resumo
            </h3>
            <div className="space-y-3 text-sm">
              <Row icon={<UserPlus className="h-4 w-4" />} label="Nome">
                {nome || (
                  <span className="text-keu-black/40">não informado</span>
                )}
              </Row>
              <Row icon={<Phone className="h-4 w-4" />} label="Telefone">
                {telefone || (
                  <span className="text-keu-black/40">não informado</span>
                )}
              </Row>
              {email && (
                <Row icon={<Mail className="h-4 w-4" />} label="Email">
                  {email}
                </Row>
              )}
              {whatsapp && (
                <Row
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="WhatsApp"
                >
                  {whatsapp}
                </Row>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
        <Link href="/dashboard/contatos">
          <Button type="button" variant="outline" disabled={saving}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" size="lg" disabled={saving || !valid}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Cadastrar contato
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-keu-black/40 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-keu-black/60">{label}</div>
        <div className="font-semibold text-keu-black truncate">{children}</div>
      </div>
    </div>
  );
}
