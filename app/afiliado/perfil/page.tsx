"use client";

import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Banknote,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Instagram } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import { formatCurrency } from "@/lib/utils";

// Mock — em produção viria da sessão
const initialMe = {
  codigo: "joao-silva-keu",
  nome: "João Silva",
  email: "joao@email.com",
  telefone: "(88) 99999-9999",
  cidade: "Juazeiro do Norte",
  estado: "CE",
  bio: "Apaixonado por motos e ajudo amigos a encontrar o melhor negócio.",
  instagram: "@joaosilva",
  whatsapp: "(88) 99999-9999",
  avatar: [] as string[],

  // Read-only — definido pelo admin
  tipoComissao: "percentual" as const,
  comissaoPercentual: 3,
  comissaoFixa: 0,

  // Dados de pagamento — o afiliado pode editar
  pixTipo: "cpf",
  pixChave: "123.456.789-00",
  banco: "",
  agencia: "",
  conta: "",
  contaTipo: "",
  cpfTitular: "",
};

export default function AfiliadoPerfilPage() {
  const [me, setMe] = useState(initialMe);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Refs pros timers — cleanup ao desmontar evita setState após unmount
  const fakeSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (fakeSaveRef.current) clearTimeout(fakeSaveRef.current);
      if (flashRef.current) clearTimeout(flashRef.current);
    };
  }, []);

  function update<K extends keyof typeof me>(key: K, value: (typeof me)[K]) {
    setMe((m) => ({ ...m, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Em produção: PATCH /api/afiliados/me
    await new Promise<void>((resolve) => {
      fakeSaveRef.current = setTimeout(resolve, 800);
    });
    if (!mountedRef.current) return;
    setSaving(false);
    setSaved(true);
    if (flashRef.current) clearTimeout(flashRef.current);
    flashRef.current = setTimeout(() => {
      if (mountedRef.current) setSaved(false);
    }, 2000);
  }

  return (
    <form onSubmit={handleSave}>
      <PageHeader
        title="Meu perfil"
        description="Mantenha seus dados atualizados para receber suas comissões"
      >
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Salvo!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Salvar
            </>
          )}
        </Button>
      </PageHeader>

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
                  Suas informações de contato
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome completo</Label>
                <Input
                  value={me.nome}
                  onChange={(e) => update("nome", e.target.value)}
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    value={me.email}
                    type="email"
                    className="pl-10"
                    disabled
                  />
                </div>
              </div>
              <div>
                <Label>Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    value={me.telefone}
                    className="pl-10"
                    onChange={(e) => update("telefone", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Cidade</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    value={me.cidade}
                    className="pl-10"
                    onChange={(e) => update("cidade", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Estado</Label>
                <Input
                  value={me.estado}
                  maxLength={2}
                  className="uppercase"
                  onChange={(e) =>
                    update("estado", e.target.value.toUpperCase())
                  }
                />
              </div>
              <div>
                <Label>Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    value={me.instagram}
                    className="pl-10"
                    onChange={(e) => update("instagram", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={me.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label>Bio</Label>
                <Textarea
                  rows={3}
                  value={me.bio}
                  onChange={(e) => update("bio", e.target.value)}
                />
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
                <h2 className="font-bold">Dados para receber</h2>
                <p className="text-sm text-keu-black/60">
                  PIX ou conta bancária — suas comissões serão pagas aqui
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de chave PIX</Label>
                  <Select
                    value={me.pixTipo}
                    onChange={(e) => update("pixTipo", e.target.value)}
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
                    value={me.pixChave}
                    onChange={(e) => update("pixChave", e.target.value)}
                  />
                </div>
              </div>
              <div className="text-xs text-keu-black/50 italic">
                Ou preencha conta bancária:
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Banco</Label>
                  <Input
                    value={me.banco}
                    onChange={(e) => update("banco", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Agência</Label>
                  <Input
                    value={me.agencia}
                    onChange={(e) => update("agencia", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Conta</Label>
                  <Input
                    value={me.conta}
                    onChange={(e) => update("conta", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Foto de perfil</h3>
            <ImageUpload
              value={me.avatar}
              onChange={(v) => update("avatar", v)}
              max={1}
              maxSizeKB={80}
              maxWidth={400}
              quality={0.8}
              shape="round"
            />
          </Card>

          {/* COMISSÃO (read-only) */}
          <Card className="p-6 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-3 w-3 text-white/70" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                Minha comissão
              </span>
            </div>
            <div className="text-5xl font-black">
              {me.tipoComissao === "percentual"
                ? `${me.comissaoPercentual}%`
                : formatCurrency(me.comissaoFixa)}
            </div>
            <div className="text-sm text-white/80 mt-1 mb-3">
              {me.tipoComissao === "percentual"
                ? "do valor de cada venda"
                : "por venda fechada"}
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-xs text-white/80 border border-white/20">
              <Info className="h-3 w-3 inline mr-1" />
              A comissão é definida pela KEU. Para alterações, entre em contato
              com a equipe.
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-keu-black/40" />
              <h3 className="font-bold">Meu código</h3>
            </div>
            <div className="bg-keu-gray-light rounded-lg p-3 mb-3">
              <code className="text-xs font-mono break-all">
                /m/{me.codigo}
              </code>
            </div>
            <p className="text-xs text-keu-black/50">
              O código é único e não pode ser alterado.
            </p>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
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
