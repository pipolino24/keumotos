"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  PERMISSION_MODULES,
  ROLE_PRESETS,
  type Permission,
} from "@/lib/permissions";

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

export default function NovoNivelPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("#dc1f1f");
  const [permissoes, setPermissoes] = useState<Permission[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function applyPreset(key: keyof typeof ROLE_PRESETS) {
    const preset = ROLE_PRESETS[key];
    setPermissoes(preset.permissions);
    if (!nome) setNome(preset.label);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descricao, cor, permissoes, ativo: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar cargo");
      router.push("/dashboard/usuarios/niveis");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setSaving(false);
    }
  }

  const total = PERMISSION_MODULES.flatMap((m) => m.permissions).length;

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href="/dashboard/usuarios/niveis"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para níveis
      </Link>

      <PageHeader
        title="Criar novo nível"
        description="Defina o cargo e marque quais sistemas esse nível terá acesso"
      >
        <Button type="button" variant="outline" disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || !nome.trim()}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Criar cargo
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
                      onClick={() => setCor(c)}
                      className={`w-9 h-9 rounded-lg transition-all ${
                        cor === c
                          ? "ring-2 ring-offset-2 ring-keu-black scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
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
                    onToggleAll={() => toggleModule(mod.id, allOn)}
                  >
                    <div className="grid sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-keu-black/5">
                      {mod.permissions.map((p) => {
                        const checked = permissoes.includes(p.key);
                        return (
                          <label
                            key={p.key}
                            className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                              checked
                                ? "border-keu-red bg-keu-red/5"
                                : "border-keu-black/10 hover:border-keu-black/20"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded border-keu-black/20 text-keu-red focus:ring-keu-red"
                              checked={checked}
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
          {/* PREVIEW */}
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

          {/* PRESETS */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-sm">Aplicar preset</h3>
            </div>
            <p className="text-xs text-keu-black/60 mb-4">
              Comece com um modelo pré-configurado e ajuste o que quiser:
            </p>
            <div className="space-y-2">
              {Object.entries(ROLE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key as keyof typeof ROLE_PRESETS)}
                  className="w-full text-left p-3 rounded-lg border border-keu-black/10 hover:border-keu-red hover:bg-keu-red/5 transition text-sm"
                >
                  <div className="font-semibold">{preset.label}</div>
                  <div className="text-xs text-keu-black/60">
                    {preset.permissions.length} permissões
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
        <Button type="button" variant="outline" disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={saving || !nome.trim()}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Criar cargo
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
          onClick={onToggleAll}
          className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${
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
