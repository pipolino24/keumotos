"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Users,
  Search,
  TrendingUp,
  ShoppingBag,
  KeyRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonListRow } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";

interface ClienteRow {
  clienteId?: string;
  clienteNome?: string;
  telefone?: string;
  email?: string;
  interesses: number;
  vendas: number;
  alugueis: number;
  totalGasto: number;
  ultimoAt?: string;
}

function tempo(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `${d}d atrás`;
  const m = Math.floor(d / 30);
  return `${m}m atrás`;
}

export default function ClientesPage() {
  const { data, loading } = useApi<{ clientes: ClienteRow[] }>(
    "/api/clientes"
  );
  const [q, setQ] = useState("");

  const clientes = data?.clientes ?? [];
  const filtered = q
    ? clientes.filter((c) =>
        (c.clienteNome ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (c.telefone ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q.toLowerCase())
      )
    : clientes;

  const totais = clientes.reduce(
    (acc, c) => ({
      total: acc.total + 1,
      compradores: acc.compradores + (c.vendas > 0 ? 1 : 0),
      locatarios: acc.locatarios + (c.alugueis > 0 ? 1 : 0),
      gasto: acc.gasto + c.totalGasto,
    }),
    { total: 0, compradores: 0, locatarios: 0, gasto: 0 }
  );

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Todos os clientes ativos com vendas, aluguéis ou interesses registrados"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatBlock
          icon={<Users className="h-5 w-5" />}
          label="Clientes ativos"
          value={totais.total.toString()}
          color="bg-blue-500"
        />
        <StatBlock
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Já compraram"
          value={totais.compradores.toString()}
          color="bg-emerald-500"
        />
        <StatBlock
          icon={<KeyRound className="h-5 w-5" />}
          label="Já alugaram"
          value={totais.locatarios.toString()}
          color="bg-amber-500"
        />
        <StatBlock
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total faturado"
          value={formatCurrency(totais.gasto)}
          color="bg-keu-red"
        />
      </div>

      <Card>
        <div className="p-4 border-b border-keu-black/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
            <Input
              placeholder="Buscar por nome, telefone ou email…"
              className="pl-10"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <div>
            <SkeletonListRow />
            <SkeletonListRow />
            <SkeletonListRow />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title={
              clientes.length === 0
                ? "Nenhum cliente registrado ainda"
                : "Nenhum cliente bate a busca"
            }
            description={
              clientes.length === 0
                ? "Conforme clientes acessarem motos, simularem ou comprarem, eles aparecem aqui automaticamente."
                : "Tente outro termo."
            }
          />
        ) : (
          <div className="divide-y divide-keu-black/5">
            {filtered.map((c, idx) => {
              const tem = c.clienteId !== undefined;
              const conteudo = (
                <div className="p-4 px-6 flex items-center gap-4 hover:bg-keu-gray-light transition">
                  <div className="bg-gradient-to-br from-keu-red to-keu-red-dark text-white w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {(c.clienteNome ?? "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {c.clienteNome ?? "Sem nome"}
                    </div>
                    <div className="text-xs text-keu-black/60 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {c.telefone && <span>{c.telefone}</span>}
                      {c.email && <span>· {c.email}</span>}
                    </div>
                  </div>
                  <div className="hidden md:flex gap-4 text-center text-xs">
                    {c.vendas > 0 && (
                      <div>
                        <div className="font-bold text-emerald-600">{c.vendas}</div>
                        <div className="text-keu-black/50">venda{c.vendas > 1 ? "s" : ""}</div>
                      </div>
                    )}
                    {c.alugueis > 0 && (
                      <div>
                        <div className="font-bold text-amber-600">{c.alugueis}</div>
                        <div className="text-keu-black/50">aluguel</div>
                      </div>
                    )}
                    {c.interesses > 0 && (
                      <div>
                        <div className="font-bold text-blue-600">{c.interesses}</div>
                        <div className="text-keu-black/50">vis.</div>
                      </div>
                    )}
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="font-bold text-sm">
                      {formatCurrency(c.totalGasto)}
                    </div>
                    <div className="text-[10px] text-keu-black/50">
                      ativ. {tempo(c.ultimoAt)}
                    </div>
                  </div>
                  {tem && (
                    <span className="text-keu-red text-xs font-bold whitespace-nowrap">
                      Ver perfil →
                    </span>
                  )}
                </div>
              );
              return tem ? (
                <Link
                  href={`/dashboard/clientes/${c.clienteId}`}
                  key={`${c.clienteId}-${idx}`}
                  className="block group"
                >
                  {conteudo}
                </Link>
              ) : (
                <div key={`anon-${idx}`}>{conteudo}</div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  // Aceita tanto color="bg-X-500" (legado) quanto "from-X to-Y" (gradient).
  // Se vier solid bg-*, converte pra gradient correspondente — assim KPIs
  // de /clientes ficam consistentes com /vendas/aluguel/contatos.
  const gradient = color.startsWith("from-")
    ? color
    : color
        .replace(/^bg-/, "from-")
        .replace(/-(\d+)$/, "-$1 to-$1") // fallback simples — vamos sobrescrever via map
        .replace(/from-blue-500.*/, "from-blue-500 to-blue-600")
        .replace(/from-emerald-500.*/, "from-emerald-500 to-emerald-600")
        .replace(/from-amber-500.*/, "from-amber-500 to-amber-600")
        .replace(/from-keu-red.*/, "from-keu-red to-keu-red-dark");
  return (
    <Card className={`p-6 bg-gradient-to-br ${gradient} text-white border-0 card-hover`}>
      <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-black mb-1 truncate">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
    </Card>
  );
}
