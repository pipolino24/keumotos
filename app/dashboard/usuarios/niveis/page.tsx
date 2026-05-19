"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Crown,
  CheckCircle2,
  XCircle,
  Lock,
  Users,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { PERMISSION_MODULES } from "@/lib/permissions";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/confirm-dialog";

interface RoleItem {
  _id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  permissoes: string[];
  ativo: boolean;
  sistema: boolean;
  createdAt: string;
}

export default function NiveisPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    setLoading(true);
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoles(data.roles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(role: RoleItem) {
    if (role.sistema) return;
    const ok = await confirmDialog({
      title: "Remover cargo",
      message: `Tem certeza que quer remover "${role.nome}"? Usuários com esse cargo perdem as permissões.`,
      confirmText: "Remover",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/roles/${role._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setRoles((rs) => rs.filter((r) => r._id !== role._id));
      toast.success(`Cargo "${role.nome}" removido`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover");
    }
  }

  const filtered = roles.filter((r) =>
    r.nome.toLowerCase().includes(search.toLowerCase())
  );

  const totalPerms = PERMISSION_MODULES.flatMap((m) => m.permissions).length;

  return (
    <div>
      <Link
        href="/dashboard/usuarios"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        ← Voltar para Usuários
      </Link>

      <PageHeader
        title="Cargos & Níveis"
        description="Crie níveis de acesso e defina o que cada cargo pode fazer no sistema"
      >
        <Link href="/dashboard/usuarios/niveis/novo">
          <Button>
            <Plus className="h-4 w-4" /> Criar nível
          </Button>
        </Link>
      </PageHeader>

      {/* INFO BOX */}
      <Card className="p-5 mb-6 bg-gradient-to-br from-keu-red/5 to-amber-50 border-keu-red/20">
        <div className="flex items-start gap-3">
          <div className="bg-keu-black text-keu-red w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold mb-1">Administradores têm acesso total</h3>
            <div className="text-sm text-keu-black/70">
              Usuários com role <Badge variant="dark" className="mx-0.5">Admin</Badge>{" "}
              têm todas as permissões automaticamente, independente do cargo. Os
              cargos servem para personalizar o acesso de
              <Badge variant="default" className="mx-0.5">Vendedores</Badge>
              e outros usuários da equipe.
            </div>
          </div>
        </div>
      </Card>

      {/* STATS */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black">{roles.length}</div>
              <div className="text-xs text-keu-black/60">Cargos criados</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black">
                {roles.filter((r) => r.ativo).length}
              </div>
              <div className="text-xs text-keu-black/60">Cargos ativos</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black">{totalPerms}</div>
              <div className="text-xs text-keu-black/60">
                Permissões disponíveis
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* SEARCH */}
      <Card className="mb-6">
        <div className="p-5 border-b border-keu-black/5 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-lg">Cargos do sistema</h2>
            <p className="text-sm text-keu-black/60">
              Clique em um cargo para editar suas permissões
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
            <Input
              placeholder="Buscar cargo..."
              className="pl-9 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <div className="text-sm text-keu-black/60">Carregando cargos...</div>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-keu-black/5">
            {filtered.map((role) => (
              <RoleRow
                key={role._id}
                role={role}
                onDelete={() => handleDelete(role)}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-16 text-center">
      <div className="bg-keu-gray-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Shield className="h-8 w-8 text-keu-black/30" />
      </div>
      <h3 className="font-bold text-lg mb-1">Nenhum cargo criado ainda</h3>
      <p className="text-sm text-keu-black/60 mb-6 max-w-sm mx-auto">
        Crie níveis personalizados para definir o que cada tipo de usuário pode
        fazer no sistema. Por exemplo: Vendedor Júnior, Gerente de Loja,
        Atendimento.
      </p>
      <Link href="/dashboard/usuarios/niveis/novo">
        <Button>
          <Plus className="h-4 w-4" /> Criar primeiro cargo
        </Button>
      </Link>
    </div>
  );
}

function RoleRow({
  role,
  onDelete,
}: {
  role: RoleItem;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const permsByModule = PERMISSION_MODULES.map((m) => ({
    ...m,
    granted: m.permissions.filter((p) => role.permissoes.includes(p.key)),
  })).filter((m) => m.granted.length > 0);

  return (
    <div className="hover:bg-keu-gray-light/50 transition">
      <div className="flex items-center gap-4 p-5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
          style={{ backgroundColor: role.cor ?? "#dc1f1f" }}
        >
          <Shield className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold truncate">{role.nome}</h3>
            {role.sistema && (
              <Badge variant="dark" className="text-[10px]">
                Sistema
              </Badge>
            )}
            {!role.ativo && (
              <Badge variant="secondary" className="text-[10px]">
                Inativo
              </Badge>
            )}
          </div>
          {role.descricao && (
            <p className="text-sm text-keu-black/60 line-clamp-1">
              {role.descricao}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-keu-black/60">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              {role.permissoes.length} permissões
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />0 usuários
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Ocultar" : "Ver permissões"}
          </Button>
          {!role.sistema && (
            <>
              <Link href={`/dashboard/usuarios/niveis/${role._id}`}>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="bg-keu-gray-light/40 px-5 py-4 border-t border-keu-black/5">
          {permsByModule.length === 0 ? (
            <p className="text-xs text-keu-black/40 italic">
              Esse cargo não tem permissões atribuídas.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {permsByModule.map((mod) => (
                <div key={mod.id}>
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
          )}
        </div>
      )}
    </div>
  );
}
