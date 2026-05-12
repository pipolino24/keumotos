"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Save,
  Shield,
  Crown,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Lock,
  Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { toast } from "sonner";
import { useApi } from "@/lib/hooks/use-api";
import { PERMISSION_MODULES, type Permission } from "@/lib/permissions";

interface UserApi {
  _id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
  role: "admin" | "vendedor" | "cliente" | "afiliado";
  cargoId?: string;
  permissoes: string[];
  status: "ativo" | "inativo" | "pendente";
  cidade?: string;
  estado?: string;
  createdAt: string;
}

interface RoleApi {
  _id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  permissoes: string[];
  ativo: boolean;
  sistema: boolean;
}

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: userData, loading, error } = useApi<{ user: UserApi }>(
    id ? `/api/users/${id}` : null
  );
  const user = userData?.user;

  const { data: rolesData } = useApi<{ roles: RoleApi[] }>("/api/roles");
  const allRoles = rolesData?.roles ?? [];
  const activeRoles = allRoles.filter((r) => r.ativo);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [role, setRole] = useState<"admin" | "vendedor" | "cliente" | "afiliado">(
    "cliente"
  );
  const [status, setStatus] = useState<"ativo" | "inativo" | "pendente">(
    "ativo"
  );
  const [selectedCargoId, setSelectedCargoId] = useState<string>("");
  const [extraPermissions, setExtraPermissions] = useState<Permission[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setTelefone(user.telefone);
      setCidade(user.cidade ?? "");
      setEstado(user.estado ?? "");
      setRole(user.role);
      setStatus(user.status);
      setSelectedCargoId(user.cargoId ?? "");
    }
  }, [user]);

  const selectedRole = useMemo(
    () => activeRoles.find((r) => r._id === selectedCargoId),
    [activeRoles, selectedCargoId]
  );

  // Quando muda o cargo, recalcula extras a partir do que o usuário tinha
  useEffect(() => {
    if (!user) return;
    const rolePerms = new Set(selectedRole?.permissoes ?? []);
    const extras = (user.permissoes ?? []).filter(
      (p) => !rolePerms.has(p)
    ) as Permission[];
    setExtraPermissions(extras);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCargoId, user?._id]);

  function toggleExtra(p: Permission) {
    setExtraPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  const finalPermissions = useMemo(() => {
    const set = new Set<string>(selectedRole?.permissoes ?? []);
    extraPermissions.forEach((p) => set.add(p));
    return Array.from(set);
  }, [selectedRole, extraPermissions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          telefone,
          cidade,
          estado,
          role,
          status,
          cargoId: selectedCargoId || null,
          permissoes: finalPermissions,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar");
      toast.success("Usuário atualizado");
      router.push("/dashboard/usuarios");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido";
      setFormError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
        <div className="text-sm text-keu-black/60">Carregando usuário...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link
          href="/dashboard/usuarios"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para usuários
        </Link>
        <Card className="p-8 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold">Erro ao carregar o usuário</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-16 text-center">
        <UsersIcon className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
        <h3 className="font-bold mb-1">Usuário não encontrado</h3>
        <Link href="/dashboard/usuarios">
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
        href="/dashboard/usuarios"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para usuários
      </Link>

      <PageHeader
        title={user.nome}
        description="Atribua um cargo e ajuste permissões adicionais"
      >
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
              <Save className="h-4 w-4" /> Salvar
            </>
          )}
        </Button>
      </PageHeader>

      {formError && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{formError}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* COLUNA PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          {/* IDENTIFICAÇÃO */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-keu-black/5">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-white text-xl ${
                  user.role === "admin"
                    ? "bg-keu-black"
                    : user.role === "vendedor"
                      ? "bg-keu-red"
                      : "bg-blue-500"
                }`}
              >
                {user.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg truncate">{user.nome}</h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={user.status} />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-keu-black/70">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-keu-black/70">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{user.telefone}</span>
              </div>
              {(user.cidade || user.estado) && (
                <div className="flex items-center gap-2 text-keu-black/70">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {[user.cidade, user.estado].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {user.cpf && (
                <div className="flex items-center gap-2 text-keu-black/70 font-mono text-xs">
                  CPF: {user.cpf}
                </div>
              )}
            </div>
          </Card>

          {/* ATRIBUIR CARGO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Atribuir Cargo</h2>
                <p className="text-sm text-keu-black/60">
                  Selecione um cargo para herdar permissões automaticamente
                </p>
              </div>
            </div>

            {user.role === "admin" && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Administradores já têm acesso total — cargo não é necessário.
              </div>
            )}

            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Select
                id="cargo"
                value={selectedCargoId}
                onChange={(e) => setSelectedCargoId(e.target.value)}
              >
                <option value="">— Sem cargo —</option>
                {activeRoles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.nome} ({r.permissoes.length} permissões)
                  </option>
                ))}
              </Select>
            </div>

            {selectedRole && (
              <div className="mt-5 pt-5 border-t border-keu-black/5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: selectedRole.cor ?? "#dc1f1f" }}
                  >
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">{selectedRole.nome}</div>
                    {selectedRole.descricao && (
                      <div className="text-xs text-keu-black/60">
                        {selectedRole.descricao}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs font-bold text-keu-black/60 uppercase tracking-wider mb-2">
                  Permissões herdadas
                </div>
                <PermissionsPreview permissions={selectedRole.permissoes} />
              </div>
            )}
          </Card>

          {/* PERMISSÕES ADICIONAIS */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-keu-black/5">
              <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold">Permissões adicionais</h2>
                <p className="text-sm text-keu-black/60">
                  Marque permissões extras além das que o cargo já concede
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-blue-600">
                  {finalPermissions.length}
                </div>
                <div className="text-xs text-keu-black/60">total final</div>
              </div>
            </div>

            <div className="space-y-4">
              {PERMISSION_MODULES.map((mod) => (
                <div key={mod.id}>
                  <div className="text-xs font-bold text-keu-black/70 uppercase tracking-wider mb-2">
                    {mod.label}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {mod.permissions.map((p) => {
                      const fromRole = selectedRole?.permissoes.includes(p.key);
                      const checkedExtra = extraPermissions.includes(p.key);
                      const checked = fromRole || checkedExtra;
                      return (
                        <label
                          key={p.key}
                          className={`flex items-start gap-2 p-2.5 rounded-lg border transition ${
                            fromRole
                              ? "border-emerald-200 bg-emerald-50/50 cursor-not-allowed"
                              : checkedExtra
                                ? "border-blue-300 bg-blue-50 cursor-pointer"
                                : "border-keu-black/10 hover:border-keu-black/20 cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded border-keu-black/20 text-blue-600 focus:ring-blue-500"
                            checked={!!checked}
                            disabled={!!fromRole}
                            onChange={() => toggleExtra(p.key)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium flex items-center gap-2">
                              {p.label}
                              {fromRole && (
                                <Badge
                                  variant="success"
                                  className="text-[10px]"
                                >
                                  Cargo
                                </Badge>
                              )}
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
                </div>
              ))}
            </div>
          </Card>

          {/* DADOS BÁSICOS */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-black/5 text-keu-black/70 w-10 h-10 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Dados básicos</h2>
                <p className="text-sm text-keu-black/60">
                  Informações do perfil do usuário
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="nome" required>
                  Nome
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="telefone" required>
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Nível do usuário</Label>
                <Select
                  id="role"
                  value={role}
                  onChange={(e) =>
                    setRole(
                      e.target.value as
                        | "admin"
                        | "vendedor"
                        | "cliente"
                        | "afiliado"
                    )
                  }
                >
                  <option value="cliente">Cliente</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="afiliado">Afiliado</option>
                  <option value="admin">Administrador</option>
                </Select>
                <p className="text-xs text-keu-black/50 mt-1">
                  Cadastro público sempre cria como cliente. Promova aqui.
                </p>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as "ativo" | "inativo" | "pendente"
                    )
                  }
                >
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="inativo">Inativo</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado (UF)</Label>
                <Input
                  id="estado"
                  maxLength={2}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-keu-black/60 mb-3">
              Resumo
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-keu-black/60">Cargo atual</div>
                <div className="font-semibold">
                  {selectedRole?.nome ?? (
                    <span className="text-keu-black/40">Sem cargo</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-keu-black/60">
                  Permissões finais
                </div>
                <div className="font-bold text-2xl text-keu-red">
                  {finalPermissions.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-keu-black/60">Status</div>
                <StatusBadge status={status} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
        <Link href="/dashboard/usuarios">
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
              <Save className="h-4 w-4" /> Salvar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function PermissionsPreview({ permissions }: { permissions: string[] }) {
  const byModule = PERMISSION_MODULES.map((m) => ({
    ...m,
    granted: m.permissions.filter((p) => permissions.includes(p.key)),
  })).filter((m) => m.granted.length > 0);

  if (byModule.length === 0) {
    return (
      <p className="text-xs text-keu-black/40 italic">
        Esse cargo não concede nenhuma permissão.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {byModule.map((mod) => (
        <div key={mod.id} className="bg-keu-gray-light rounded-lg p-3">
          <div className="text-xs font-bold text-keu-black/70 uppercase tracking-wider mb-1.5">
            {mod.label}
          </div>
          <ul className="space-y-1">
            {mod.granted.map((p) => (
              <li
                key={p.key}
                className="text-xs text-keu-black/70 flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                {p.label}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<
    string,
    { v: "dark" | "default" | "info" | "secondary"; l: string; i: React.ReactNode }
  > = {
    admin: { v: "dark", l: "Admin", i: <Shield className="h-3 w-3" /> },
    vendedor: { v: "default", l: "Vendedor", i: <Crown className="h-3 w-3" /> },
    cliente: {
      v: "info",
      l: "Cliente",
      i: <ShoppingBag className="h-3 w-3" />,
    },
    afiliado: { v: "secondary", l: "Afiliado", i: null },
  };
  const conf = map[role] || { v: "default" as const, l: role, i: null };
  return (
    <Badge variant={conf.v}>
      {conf.i}
      {conf.l}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { v: "success" | "warning" | "danger"; l: string; i: React.ReactNode }
  > = {
    ativo: {
      v: "success",
      l: "Ativo",
      i: <CheckCircle2 className="h-3 w-3" />,
    },
    pendente: { v: "warning", l: "Pendente", i: <Clock className="h-3 w-3" /> },
    inativo: { v: "danger", l: "Inativo", i: <XCircle className="h-3 w-3" /> },
  };
  const conf = map[status] || { v: "warning" as const, l: status, i: null };
  return (
    <Badge variant={conf.v}>
      {conf.i}
      {conf.l}
    </Badge>
  );
}
