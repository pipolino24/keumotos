"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  User as UserIcon,
  Mail,
  Phone,
  IdCard,
  MapPin,
  CreditCard,
  Upload,
  Trash2,
  Lock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeuLogo } from "@/components/keu-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile, EnderecoCompleto, DocumentoUpload } from "@/lib/types";

const TIPOS_DOC: { value: DocumentoUpload["tipo"]; label: string }[] = [
  { value: "cnh_foto", label: "Foto da CNH" },
  { value: "rg_foto", label: "Foto do RG" },
  { value: "cpf_foto", label: "Foto do CPF" },
  { value: "comprovante_endereco", label: "Comprovante de endereço" },
  { value: "foto_pessoal", label: "Foto pessoal" },
  { value: "outro", label: "Outro" },
];

export function PerfilForm({ profile: initial }: { profile: Profile }) {
  const supabase = createSupabaseBrowserClient();
  const [profile, setProfile] = useState<Profile>(initial);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");

  function setEnd<K extends keyof EnderecoCompleto>(
    key: K,
    value: EnderecoCompleto[K]
  ) {
    setProfile((p) => ({
      ...p,
      endereco: { ...(p.endereco ?? {}), [key]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        nome: profile.nome,
        telefone: profile.telefone,
        cpf: profile.cpf,
        rg: profile.rg,
        cnh: profile.cnh,
        cnh_validade: profile.cnh_validade,
        endereco: profile.endereco,
        pix: profile.pix,
        banco: profile.banco,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Dados salvos!");
    }
  }

  async function handleSenha() {
    if (novaSenha.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSavingPwd(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha alterada!");
      setNovaSenha("");
    }
  }

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: DocumentoUpload["tipo"]
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo maior que 10MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${profile.id}/${tipo}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("documentos")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }

    const novoDoc: DocumentoUpload = {
      tipo,
      url: path,
      path,
      uploaded_at: new Date().toISOString(),
    };
    const novos = [...profile.documentos, novoDoc];
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ documentos: novos })
      .eq("id", profile.id);
    setUploading(false);
    if (updErr) {
      toast.error(updErr.message);
    } else {
      setProfile((p) => ({ ...p, documentos: novos }));
      toast.success("Documento enviado!");
    }
    e.target.value = "";
  }

  async function handleRemoveDoc(doc: DocumentoUpload) {
    if (!confirm(`Remover ${doc.tipo}?`)) return;
    await supabase.storage.from("documentos").remove([doc.path]);
    const novos = profile.documentos.filter((d) => d.path !== doc.path);
    const { error } = await supabase
      .from("profiles")
      .update({ documentos: novos })
      .eq("id", profile.id);
    if (error) toast.error(error.message);
    else {
      setProfile((p) => ({ ...p, documentos: novos }));
      toast.success("Removido");
    }
  }

  async function abrirDoc(doc: DocumentoUpload) {
    const { data, error } = await supabase.storage
      .from("documentos")
      .createSignedUrl(doc.path, 60);
    if (error || !data?.signedUrl) {
      toast.error("Não foi possível abrir o documento");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <KeuLogo size="sm" />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-xl">Meu perfil</h1>
            <p className="text-sm text-keu-black/60">{profile.email}</p>
          </div>
          <Badge variant="default" className="ml-auto">
            {profile.role}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="nome" required>Nome completo</Label>
            <Input
              id="nome"
              value={profile.nome}
              onChange={(e) =>
                setProfile((p) => ({ ...p, nome: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
              <Input id="email" className="pl-10" value={profile.email} disabled />
            </div>
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
              <Input
                id="telefone"
                className="pl-10"
                placeholder="(88) 99999-9999"
                value={profile.telefone ?? ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, telefone: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={profile.cpf ?? ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, cpf: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="rg">RG</Label>
            <Input
              id="rg"
              value={profile.rg ?? ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, rg: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="cnh">CNH (opcional)</Label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
              <Input
                id="cnh"
                className="pl-10"
                value={profile.cnh ?? ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, cnh: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="cnh_validade">Validade CNH</Label>
            <Input
              id="cnh_validade"
              type="date"
              value={profile.cnh_validade ?? ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, cnh_validade: e.target.value }))
              }
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-5 w-5 text-keu-red" />
          <h2 className="font-bold">Endereço</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              placeholder="00000-000"
              value={profile.endereco?.cep ?? ""}
              onChange={(e) => setEnd("cep", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="rua">Rua</Label>
            <Input
              id="rua"
              value={profile.endereco?.rua ?? ""}
              onChange={(e) => setEnd("rua", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="numero">Número</Label>
            <Input
              id="numero"
              value={profile.endereco?.numero ?? ""}
              onChange={(e) => setEnd("numero", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              value={profile.endereco?.complemento ?? ""}
              onChange={(e) => setEnd("complemento", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={profile.endereco?.bairro ?? ""}
              onChange={(e) => setEnd("bairro", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={profile.endereco?.cidade ?? ""}
              onChange={(e) => setEnd("cidade", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="uf">UF</Label>
            <Input
              id="uf"
              maxLength={2}
              value={profile.endereco?.uf ?? ""}
              onChange={(e) => setEnd("uf", e.target.value.toUpperCase())}
            />
          </div>
        </div>
      </Card>

      {(profile.role === "vendedor" || profile.role === "afiliado") && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-5 w-5 text-keu-red" />
            <h2 className="font-bold">Dados para pagamento</h2>
          </div>
          <div>
            <Label htmlFor="pix">Chave PIX</Label>
            <Input
              id="pix"
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              value={profile.pix ?? ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, pix: e.target.value }))
              }
            />
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-keu-red" />
          <h2 className="font-bold">Documentos</h2>
        </div>

        {profile.documentos.length === 0 ? (
          <p className="text-sm text-keu-black/60 mb-4">
            Nenhum documento enviado ainda.
          </p>
        ) : (
          <div className="space-y-2 mb-4">
            {profile.documentos.map((doc) => (
              <div
                key={doc.path}
                className="flex items-center gap-3 p-3 bg-keu-gray-light rounded-lg"
              >
                <FileText className="h-5 w-5 text-keu-black/40" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {TIPOS_DOC.find((t) => t.value === doc.tipo)?.label ?? doc.tipo}
                  </div>
                  <div className="text-xs text-keu-black/50">
                    Enviado em {new Date(doc.uploaded_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => abrirDoc(doc)}
                >
                  Ver
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDoc(doc)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TIPOS_DOC.map((t) => (
            <label
              key={t.value}
              className="cursor-pointer border-2 border-dashed border-keu-black/15 hover:border-keu-red rounded-lg p-3 text-center text-xs font-medium text-keu-black/70 hover:text-keu-red transition flex flex-col items-center gap-1"
            >
              <Upload className="h-4 w-4" />
              {t.label}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleUpload(e, t.value)}
              />
            </label>
          ))}
        </div>
        {uploading && (
          <p className="text-sm text-keu-black/60 mt-2 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
          </p>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-5 w-5 text-keu-red" />
          <h2 className="font-bold">Alterar senha</h2>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor="novaSenha">Nova senha</Label>
            <Input
              id="novaSenha"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleSenha}
            disabled={savingPwd || !novaSenha}
          >
            {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : "Alterar"}
          </Button>
        </div>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Salvar alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
