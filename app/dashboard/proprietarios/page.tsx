"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  UserPlus,
  Search,
  Users,
  CreditCard,
  RefreshCw,
  Loader2,
  Bike,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApi } from "@/lib/hooks/use-api";
import { formatDate, formatPhone } from "@/lib/utils";

interface Prop {
  _id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string;
  cidade?: string;
  estado?: string;
  pixChave?: string;
  createdAt: string;
}

interface MotoRepasse {
  origem: string;
  status: string;
  proprietarioId?: string;
}

export default function ProprietariosPage() {
  const { data, loading, error, refetch } = useApi<{ proprietarios: Prop[] }>(
    "/api/proprietarios"
  );
  const { data: motosData } = useApi<{ motos: MotoRepasse[] }>("/api/motos");
  const [search, setSearch] = useState("");

  const proprietarios = data?.proprietarios ?? [];
  const motos = motosData?.motos ?? [];

  const filtered = proprietarios.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.nome.toLowerCase().includes(s) ||
      p.cpf.replace(/\D/g, "").includes(search.replace(/\D/g, "")) ||
      (p.email?.toLowerCase().includes(s) ?? false) ||
      (p.cidade?.toLowerCase().includes(s) ?? false)
    );
  });

  // Repasse ativo: motos com origem repasse e ainda no estoque (disponivel
  // ou reservada). Vendidas/alugadas/concluídas saem do count.
  const ativosStatus = new Set(["disponivel", "reservada"]);
  const motosRepasseAtivas = motos.filter(
    (m) => m.origem === "repasse" && ativosStatus.has(m.status)
  );
  const stats = {
    total: proprietarios.length,
    comPix: proprietarios.filter((p) => p.pixChave && p.pixChave.trim()).length,
    emRepasse: motosRepasseAtivas.length,
  };

  return (
    <div>
      <Link
        href="/dashboard/aquisicoes"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para aquisições
      </Link>

      <PageHeader
        title="Pessoas"
        description="Donos de motos consignadas, vendedores externos e clientes de aluguel"
      >
        <Link href="/dashboard/proprietarios/novo">
          <Button>
            <UserPlus className="h-4 w-4" /> Nova pessoa
          </Button>
        </Link>
      </PageHeader>

      {/* STATS */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Users />}
          label="Total de pessoas"
          value={stats.total.toString()}
          subtitle="cadastradas no sistema"
          color="from-keu-red to-keu-red-dark"
        />
        <StatCard
          icon={<CreditCard />}
          label="Com PIX cadastrado"
          value={stats.comPix.toString()}
          subtitle={`${stats.total ? Math.round((stats.comPix / stats.total) * 100) : 0}% do total`}
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          icon={<RefreshCw />}
          label="Em repasse ativo"
          value={stats.emRepasse.toString()}
          subtitle="motos consignadas"
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* LIST */}
      <Card>
        <div className="p-5 border-b border-keu-black/5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-bold text-lg">Lista de pessoas</h2>
              <p className="text-sm text-keu-black/60">
                {loading
                  ? "Carregando…"
                  : `${filtered.length} ${filtered.length === 1 ? "encontrado" : "encontrados"}`}
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
              <Input
                placeholder="Nome, CPF, email ou cidade..."
                className="pl-9 w-72"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
            <div className="text-sm text-keu-black/60">
              Carregando pessoas...
            </div>
          </div>
        ) : error ? (
          <div className="p-16 text-center">
            <div className="bg-red-100 text-red-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="font-bold mb-1">Erro ao carregar</h3>
            <p className="text-sm text-keu-black/60 mb-4">{error}</p>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          proprietarios.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="p-16 text-center">
              <div className="bg-keu-gray-light w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-keu-black/40" />
              </div>
              <h3 className="font-bold mb-1">Nenhum resultado</h3>
              <p className="text-sm text-keu-black/60">
                Tente buscar por outro nome ou CPF
              </p>
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
                <tr>
                  <th className="text-left p-4">Nome</th>
                  <th className="text-left p-4">Contato</th>
                  <th className="text-left p-4">Localização</th>
                  <th className="text-center p-4">Motos</th>
                  <th className="text-left p-4">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-keu-black/5">
                {filtered.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-keu-gray-light/50 transition"
                  >
                    <td className="p-4">
                      <Link
                        href={`/dashboard/proprietarios/${p._id}`}
                        className="block hover:text-keu-red transition"
                      >
                        <div className="font-semibold">{p.nome}</div>
                        <div className="text-xs text-keu-black/60 font-mono">
                          {p.cpf}
                        </div>
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="text-sm flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-keu-black/40" />
                        {formatPhone(p.telefone)}
                      </div>
                      {p.email && (
                        <div className="text-xs text-keu-black/60 flex items-center gap-1.5 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {p.email}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {p.cidade ? (
                        <div className="text-sm flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-keu-black/40" />
                          {p.cidade}
                          {p.estado && (
                            <span className="text-keu-black/60">
                              /{p.estado}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-keu-black/40">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/dashboard/aquisicoes?proprietario=${p._id}`}
                      >
                        <Button variant="ghost" size="sm">
                          <Bike className="h-3.5 w-3.5" /> Ver motos
                        </Button>
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-keu-black/60">
                      {formatDate(p.createdAt)}
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

function StatCard({
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

function EmptyState() {
  return (
    <div className="p-16 text-center">
      <div className="bg-gradient-to-br from-keu-red to-keu-red-dark w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="h-8 w-8 text-white" />
      </div>
      <h3 className="font-bold text-lg mb-1">Nenhuma pessoa cadastrada ainda</h3>
      <p className="text-sm text-keu-black/60 mb-6 max-w-sm mx-auto">
        Você pode cadastrar um proprietário direto, ou ele é criado
        automaticamente quando você registra uma aquisição (compra/repasse).
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Link href="/dashboard/proprietarios/novo">
          <Button>
            <UserPlus className="h-4 w-4" /> Cadastre o primeiro
          </Button>
        </Link>
        <Link href="/dashboard/aquisicoes/nova">
          <Button variant="outline">Via aquisição</Button>
        </Link>
      </div>
    </div>
  );
}
