"use client";

import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Crown,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Edit,
  Eye,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";

interface UserApi {
  _id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
  role: string;
  status: string;
  cidade?: string;
  estado?: string;
  vendasRealizadas?: number;
  comissaoTotal?: number;
  createdAt: string;
  ultimoAcesso?: string;
}

export default function UsuariosPage() {
  const { data, loading, error } = useApi<{ users: UserApi[] }>("/api/users");

  const users = data?.users ?? [];
  const total = users.length;
  const admins = users.filter((u) => u.role === "admin").length;
  const vendedores = users.filter((u) => u.role === "vendedor").length;
  const clientes = users.filter((u) => u.role === "cliente").length;
  const pendentes = users.filter((u) => u.status === "pendente").length;

  return (
    <div>
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Administre clientes, vendedores e administradores"
      >
        <Link href="/dashboard/usuarios/niveis">
          <Button variant="outline">
            <Shield className="h-4 w-4" /> Cargos & Níveis
          </Button>
        </Link>
        <Button>
          <UserPlus className="h-4 w-4" /> Novo usuário
        </Button>
      </PageHeader>

      {/* STATS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox
          icon={<Users />}
          label="Total cadastrados"
          value={total.toString()}
          subtitle="usuários no sistema"
          color="from-keu-red to-keu-red-dark"
        />
        <StatBox
          icon={<ShoppingBag />}
          label="Clientes"
          value={clientes.toString()}
          subtitle="compradores cadastrados"
          color="from-blue-500 to-blue-600"
        />
        <StatBox
          icon={<Crown />}
          label="Vendedores"
          value={vendedores.toString()}
          subtitle="equipe ativa"
          color="from-amber-500 to-amber-600"
        />
        <StatBox
          icon={<Clock />}
          label="Pendentes"
          value={pendentes.toString()}
          subtitle="aguardando aprovação"
          color="from-emerald-500 to-emerald-600"
        />
      </div>

      {/* RANKING VENDEDORES */}
      <Card className="mb-8">
        <div className="p-6 border-b border-keu-black/5">
          <h2 className="font-bold text-lg">🏆 Ranking de vendedores</h2>
          <p className="text-sm text-keu-black/60">
            Desempenho da equipe de vendas
          </p>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-4">
          {users
            .filter((u) => u.role === "vendedor")
            .sort((a, b) => (b.vendasRealizadas ?? 0) - (a.vendasRealizadas ?? 0))
            .map((v, idx) => (
              <div
                key={v._id}
                className="flex items-center gap-4 p-4 bg-keu-gray-light rounded-xl"
              >
                <div className="relative">
                  <div className="bg-keu-red text-white w-14 h-14 rounded-full flex items-center justify-center font-black text-xl">
                    {v.nome.charAt(0)}
                  </div>
                  {idx === 0 && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1">
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{v.nome}</div>
                  <div className="text-xs text-keu-black/60">{v.email}</div>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <div className="text-xs text-keu-black/60">Vendas</div>
                      <div className="font-bold text-keu-red flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {v.vendasRealizadas ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-keu-black/60">Comissão</div>
                      <div className="font-bold flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(v.comissaoTotal ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* TABELA */}
      <Card>
        <div className="p-6 border-b border-keu-black/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Todos os usuários</h2>
              <p className="text-sm text-keu-black/60">
                {loading ? "Carregando..." : "Gerencie permissões e classificações"}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  placeholder="Nome, email ou telefone..."
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4" /> Filtros
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="default">Todos ({total})</Badge>
            <Badge variant="outline">
              <Shield className="h-3 w-3" /> Admins ({admins})
            </Badge>
            <Badge variant="outline">
              <Crown className="h-3 w-3" /> Vendedores ({vendedores})
            </Badge>
            <Badge variant="outline">
              <ShoppingBag className="h-3 w-3" /> Clientes ({clientes})
            </Badge>
            <Badge variant="outline">Ativos</Badge>
            <Badge variant="outline">Pendentes</Badge>
            <Badge variant="outline">Inativos</Badge>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <div className="text-sm text-keu-black/60">Carregando usuários...</div>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-600 text-sm">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
            <h3 className="font-bold mb-1">Nenhum usuário encontrado</h3>
            <p className="text-sm text-keu-black/60 mb-4">
              Comece cadastrando o primeiro usuário.
            </p>
            <Button>
              <UserPlus className="h-4 w-4" /> Novo usuário
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
                <tr>
                  <th className="text-left p-4">Usuário</th>
                  <th className="text-left p-4">Contato</th>
                  <th className="text-left p-4">Localização</th>
                  <th className="text-left p-4">Classificação</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Cadastrado</th>
                  <th className="text-left p-4">Último acesso</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-keu-black/5">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-keu-gray-light transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            u.role === "admin"
                              ? "bg-keu-black"
                              : u.role === "vendedor"
                                ? "bg-keu-red"
                                : "bg-blue-500"
                          }`}
                        >
                          {u.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold">{u.nome}</div>
                          {u.cpf && (
                            <div className="text-xs text-keu-black/60 font-mono">
                              CPF: {u.cpf}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-keu-black/60 flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        {u.email}
                      </div>
                      <div className="text-xs text-keu-black/60 flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {u.telefone}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {u.cidade ? (
                        <>
                          {u.cidade}
                          {u.estado && ` - ${u.estado}`}
                        </>
                      ) : (
                        <span className="text-keu-black/40">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="p-4 text-xs text-keu-black/60">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="p-4 text-xs text-keu-black/60">
                      {u.ultimoAcesso ? formatDate(u.ultimoAcesso) : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/dashboard/usuarios/${u._id}`}
                          title="Ver / Editar"
                        >
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <Card className={`p-6 bg-gradient-to-br ${color} text-white border-0`}>
      <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm text-white/90 font-semibold">{label}</div>
      <div className="text-xs text-white/70 mt-0.5">{subtitle}</div>
    </Card>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<
    string,
    { v: "dark" | "default" | "info"; l: string; i: React.ReactNode }
  > = {
    admin: { v: "dark", l: "Admin", i: <Shield className="h-3 w-3" /> },
    vendedor: { v: "default", l: "Vendedor", i: <Crown className="h-3 w-3" /> },
    cliente: { v: "info", l: "Cliente", i: <ShoppingBag className="h-3 w-3" /> },
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
    ativo: { v: "success", l: "Ativo", i: <CheckCircle2 className="h-3 w-3" /> },
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
