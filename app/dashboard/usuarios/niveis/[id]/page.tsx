"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
  KeyRound,
  Package,
  Phone,
  Users,
  TrendingUp,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/confirm-dialog";
import { useApi } from "@/lib/hooks/use-api";
import { PERMISSION_MODULES, type Permission } from "@/lib/permissions";

const COLORS = [
  "#dc1f1f",
  "#0a0a0a",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> =
  {
    vendas: ShoppingCart,
    aluguel: KeyRound,
    estoque: Package,
    contatos: Phone,
    usuarios: Users,
    niveis: Shield,
    relatorios: TrendingUp,
    configuracoes: Settings,
  };

interface RoleApi {
  _id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  permissoes: string[];
  ativo: boolean;
  sistema: boolean;
}

export default function EditarNivelPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, loading, error } = useApi<{ role: RoleApi }>(
    id ? `/api/roles/${id}` : null
  );
  const role = data?.role;

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("#dc1f1f");
  const [ativo, setAtivo] = useState(true);
  const [permissoes, setPermissoes] = useState<Permission[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setNome(role.nome);
      setDescricao(role.descricao ?? "");
      setCor(role.cor ?? "#dc1f1f");
      setAtivo(role.ativo);
      setPermissoes((role.permissoes ?? []) as Permission[]);
    }
  }, [role]);

  function togglePermission(p: Permission) {
    setPermissoes((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function toggleModule(modId: string, allOn: boolean) {
    const mod = PERMISSION_MODULES.find((m) => m.id === modId);
    if (!mod) return;
    const keys = mod.permissions.map((p) => p.key);
    setPermissoes((prev) =>
      allOn
        ? prev.filter((p) => !keys.includes(p))
        : [...new Set([...prev, ...keys])]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/roles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descricao, cor, ativo, permissoes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar cargo");
      toast.success("Alterações salvas");
      router.push("/dashboard/usuarios/niveis");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido";
      setFormError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!role) return;
    const ok = await confirmDialog({
      title: "Excluir cargo",
      message: `Tem certeza que quer remover "${role.nome}"? Usuários com esse cargo perdem as permissões.`,
      confirmText: "Excluir",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao excluir");
      }
      toast.success(`Cargo "${role.nome}" removido`);
      router.push("/dashboard/usuarios/niveis");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
      setDeleting(false);
    }
  }

  const total = PERMISSION_MODULES.flatMap((m) => m.permissions).length;

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
        <div className="text-sm text-keu-black/60">Carregando cargo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          href="/dashboard/usuarios/niveis"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para níveis
        </Link>
        <Card className="p-8 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold">Erro ao carregar o cargo</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="p-16 text-center">
        <Shield className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
        <h3 className="font-bold mb-1">Cargo não encontrado</h3>
        <Link href="/dashboard/usuarios/niveis">
          <Button>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href="/dashboard/usuarios/niveis"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para níveis
      </Link>

      <PageHeader
        title="Editar cargo"
        description="Ajuste o nome, descrição e permissões do cargo"
      >
        {!role.sistema && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" /> Excluir cargo
              </>
            )}
          </Button>
        )}
        <Link href="/dashboard/usuarios/niveis">
          <Button type="button" variant="outline" disabled={saving}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={saving || !nome.trim() || role.sistema}>
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
      </PageHeader>

      {role.sistema && (
        <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Este é um cargo do sistema e não pode ser editado nem removido.
            </p>
          </div>
        </Card>
      )}

      {formError && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{formError}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* DADOS BÁSICOS */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: cor }}
              >
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Dados do cargo</h2>
                <p className="text-sm text-keu-black/60">
                  Nome, descrição e cor de identificação
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nome" required>
                  Nome do cargo
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Gerente de Loja, Vendedor Júnior..."
                  required
                  disabled={role.sistema}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  rows={2}
                  placeholder="Descreva responsabilidades deste cargo..."
                  disabled={role.sistema}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <div>
                <Label>Cor de identificação</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      disabled={role.sistema}
                      onClick={() => setCor(c)}
                      className={`w-9 h-9 rounded-lg transition-all ${
                        cor === c
                          ? "ring-2 ring-offset-2 ring-keu-black scale-110"
                          : "hover:scale-105"
                      } ${role.sistema ? "opacity-50 cursor-not-allowed" : ""}`}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="ativo"
                  type="checkbox"
                  checked={ativo}
                  disabled={role.sistema}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="rounded border-keu-black/20 text-keu-red focus:ring-keu-red"
                />
                <Label htmlFor="ativo" className="mb-0 cursor-pointer">
                  Cargo ativo (disponível para atribuir a usuários)
                </Label>
              </div>
            </div>
          </Card>

          {/* PERMISSÕES */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold">Sistemas com acesso</h2>
                <p className="text-sm text-keu-black/60">
                  Marque quais funcionalidades este cargo pode usar
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-keu-red">
                  {permissoes.length}
                </div>
                <div className="text-xs text-keu-black/60">de {total}</div>
              </div>
            </div>

            <div className="space-y-3">
              {PERMISSION_MODULES.map((mod) => {
                const Icon = MODULE_ICONS[mod.id] ?? Shield;
                const granted = mod.permissions.filter((p) =>
                  permissoes.includes(p.key)
                ).length;
                const allOn = granted === mod.permissions.length;
                const someOn = granted > 0 && !allOn;

                return (
                  <ModuleBlock
                    key={mod.id}
                    icon={<Icon className="h-5 w-5" />}
                    label={mod.label}
                    description={mod.description}
                    granted={granted}
                    total={mod.permissions.length}
                    allOn={allOn}
                    someOn={someOn}
                    disabled={role.sistema}
                    onToggleAll={() => toggleModule(mod.id, allOn)}
                  >
                    <div className="grid sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-keu-black/5">
                      {mod.permissions.map((p) => {
                        const checked = permissoes.includes(p.key);
                        return (
                          <label
                            key={p.key}
                            className={`flex items-start gap-2 p-2.5 rounded-lg border transition ${
                              role.sistema
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer"
                            } ${
                              checked
                                ? "border-keu-red bg-keu-red/5"
                                : "border-keu-black/10 hover:border-keu-black/20"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded border-keu-black/20 text-keu-red focus:ring-keu-red"
                              checked={checked}
                              disabled={role.sistema}
                              onChange={() => togglePermission(p.key)}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {p.label}
                              </div>
                              {p.description && (
                                <div className="text-xs text-keu-black/60 mt-0.5">
                                  {p.description}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </ModuleBlock>
                );
              })}
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-6">
            <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-keu-black/60">
              Preview do cargo
            </h3>
            <div
              className="rounded-xl p-5 mb-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${cor} 0%, ${cor}cc 100%)`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-black text-lg">
                    {nome || "Nome do cargo"}
                  </div>
                  <div className="text-xs text-white/80">
                    {permissoes.length} permissões
                  </div>
                </div>
              </div>
              {descricao && (
                <p className="text-sm text-white/90 mb-3">{descricao}</p>
              )}
            </div>

            <div className="text-xs text-keu-black/60 mb-3">
              Acesso aos módulos:
            </div>
            <div className="space-y-1.5">
              {PERMISSION_MODULES.map((mod) => {
                const granted = mod.permissions.filter((p) =>
                  permissoes.includes(p.key)
                ).length;
                const Icon = MODULE_ICONS[mod.id] ?? Shield;
                return (
                  <div
                    key={mod.id}
                    className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md ${
                      granted > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-keu-gray-light text-keu-black/40"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1 font-medium">{mod.label}</span>
                    {granted > 0 ? (
                      <span className="text-[10px] font-bold">
                        {granted}/{mod.permissions.length}
                      </span>
                    ) : (
                      <span className="text-[10px]">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
        <Link href="/dashboard/usuarios/niveis">
          <Button type="button" variant="outline" disabled={saving}>
            Cancelar
          </Button>
        </Link>
        <Button
          type="submit"
          size="lg"
          disabled={saving || !nome.trim() || role.sistema}
        >
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

function ModuleBlock({
  icon,
  label,
  description,
  granted,
  total,
  allOn,
  someOn,
  disabled,
  onToggleAll,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  granted: number;
  total: number;
  allOn: boolean;
  someOn: boolean;
  disabled?: boolean;
  onToggleAll: () => void;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const active = granted > 0;

  return (
    <div
      className={`border rounded-xl transition ${
        active
          ? "border-keu-red/30 bg-keu-red/5"
          : "border-keu-black/10 bg-white"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
            active
              ? "bg-keu-red text-white"
              : "bg-keu-gray-light text-keu-black/60"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold">{label}</div>
          <div className="text-xs text-keu-black/60">{description}</div>
        </div>
        <Badge variant={active ? "default" : "outline"} className="text-[10px]">
          {granted}/{total}
        </Badge>
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleAll}
          className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${
            allOn
              ? "bg-keu-red text-white"
              : someOn
                ? "bg-amber-100 text-amber-700"
                : "bg-keu-gray-light text-keu-black/60 hover:bg-keu-black hover:text-white"
          }`}
        >
          {allOn ? "Tudo on" : someOn ? "Parcial" : "Marcar tudo"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-xs font-semibold text-keu-red hover:underline"
        >
          {expanded ? "Ocultar" : "Detalhes"}
        </button>
      </div>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
