"use client";

import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  ShoppingBag,
  KeyRound,
  Eye,
  Calendar,
  TrendingUp,
  MessageCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonStatCard } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";

interface Profile {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
  role?: string;
  status?: string;
  created_at?: string;
}

interface Stats {
  interesses: number;
  vendas: number;
  alugueis: number;
  alugueisAtivos: number;
  totalGasto: number;
}

interface Interesse {
  _id: string;
  tipo: string;
  motoModelo: string;
  motoMarca?: string;
  motoId: string;
  mensagem?: string;
  createdAt: string;
}

interface Venda {
  _id: string;
  motoModelo: string;
  motoMarca?: string;
  valorVendido: number;
  status: string;
  data: string;
}

interface Aluguel {
  _id: string;
  motoModelo: string;
  motoMarca?: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  valorTotal: number;
}

interface ClienteData {
  profile: Profile | null;
  stats: Stats;
  interesses: Interesse[];
  vendas: Venda[];
  alugueis: Aluguel[];
}

const tipoLabels: Record<string, string> = {
  visualizou: "Visualizou",
  simulou_financiamento: "Simulou financiamento",
  enviou_lead: "Enviou lead",
  solicitou_aluguel: "Solicitou aluguel",
  solicitou_compra: "Solicitou compra",
  favoritou: "Favoritou",
};

export default function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading, error } = useApi<ClienteData>(`/api/clientes/${id}`);

  if (loading) {
    return (
      <div>
        <PageHeader title={<Skeleton className="h-8 w-64" />} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Link
          href="/dashboard/clientes"
          className="inline-flex items-center gap-1 text-sm text-keu-black/60 hover:text-keu-red mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <EmptyState
          icon={<User className="h-7 w-7" />}
          title="Cliente não encontrado"
          description="Verifique se o link está correto ou volte pra lista de clientes."
        />
      </div>
    );
  }

  const { profile, stats, interesses, vendas, alugueis } = data;
  const nome = profile?.nome ?? "Cliente";

  // Timeline combinada (vendas + alugueis + interesses) ordenada cronologicamente
  type Event = {
    type: "venda" | "aluguel" | "interesse";
    date: string;
    title: string;
    description?: string;
    badge?: string;
  };
  const timeline: Event[] = [
    ...vendas.map((v) => ({
      type: "venda" as const,
      date: v.data,
      title: `Compra: ${v.motoMarca ?? ""} ${v.motoModelo}`.trim(),
      description: formatCurrency(v.valorVendido),
      badge: v.status,
    })),
    ...alugueis.map((a) => ({
      type: "aluguel" as const,
      date: a.dataInicio,
      title: `Aluguel: ${a.motoMarca ?? ""} ${a.motoModelo}`.trim(),
      description: `Até ${formatDate(a.dataFim)} · ${formatCurrency(a.valorTotal)}`,
      badge: a.status,
    })),
    ...interesses.slice(0, 30).map((i) => ({
      type: "interesse" as const,
      date: i.createdAt,
      title: `${tipoLabels[i.tipo] ?? i.tipo}: ${i.motoMarca ?? ""} ${i.motoModelo}`.trim(),
      description: i.mensagem,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="animate-fade-up">
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-1 text-sm text-keu-black/60 hover:text-keu-red mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Todos os clientes
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-keu-red to-keu-red-dark text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0">
          {nome.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-black truncate">{nome}</h1>
          <div className="text-sm text-keu-black/60 flex flex-wrap gap-3 mt-1">
            {profile?.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {profile.email}
              </span>
            )}
            {profile?.telefone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {profile.telefone}
              </span>
            )}
            {profile?.created_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Cliente desde{" "}
                {formatDate(profile.created_at)}
              </span>
            )}
          </div>
        </div>
        {profile?.telefone && (
          <a
            href={`https://wa.me/55${profile.telefone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener"
            className="hidden sm:inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total faturado"
          value={formatCurrency(stats.totalGasto)}
          color="bg-keu-red"
        />
        <StatCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Compras"
          value={stats.vendas.toString()}
          color="bg-emerald-500"
        />
        <StatCard
          icon={<KeyRound className="h-5 w-5" />}
          label="Aluguéis"
          value={`${stats.alugueis} (${stats.alugueisAtivos} ativos)`}
          color="bg-amber-500"
        />
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="Interesses"
          value={stats.interesses.toString()}
          color="bg-blue-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 border-b border-keu-black/5">
            <h2 className="font-bold text-lg">Atividade</h2>
            <p className="text-sm text-keu-black/60">
              Histórico completo de compras, aluguéis e interesses
            </p>
          </div>
          {timeline.length === 0 ? (
            <EmptyState
              icon={<Eye className="h-7 w-7" />}
              title="Sem atividade ainda"
            />
          ) : (
            <div className="divide-y divide-keu-black/5 max-h-[600px] overflow-y-auto">
              {timeline.slice(0, 40).map((e, i) => (
                <div
                  key={i}
                  className="p-4 px-6 flex items-start gap-3"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      e.type === "venda"
                        ? "bg-emerald-500"
                        : e.type === "aluguel"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{e.title}</div>
                    {e.description && (
                      <div className="text-xs text-keu-black/60 mt-0.5 truncate">
                        {e.description}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {e.badge && (
                      <Badge
                        variant={
                          e.badge === "concluida" || e.badge === "ativo"
                            ? "success"
                            : e.badge === "atrasado" || e.badge === "cancelada"
                            ? "danger"
                            : "info"
                        }
                        className="text-[10px] mb-1"
                      >
                        {e.badge}
                      </Badge>
                    )}
                    <div className="text-[10px] text-keu-black/40 uppercase font-bold">
                      {formatDate(e.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="p-6 border-b border-keu-black/5">
              <h3 className="font-bold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-600" />
                Compras ({vendas.length})
              </h3>
            </div>
            {vendas.length === 0 ? (
              <div className="p-6 text-center text-sm text-keu-black/40">
                Sem compras
              </div>
            ) : (
              <div className="divide-y divide-keu-black/5">
                {vendas.slice(0, 5).map((v) => (
                  <div key={v._id} className="p-3 px-6 flex justify-between text-sm">
                    <div className="truncate">
                      {v.motoMarca} {v.motoModelo}
                    </div>
                    <div className="font-bold text-emerald-600 flex-shrink-0">
                      {formatCurrency(v.valorVendido)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="p-6 border-b border-keu-black/5">
              <h3 className="font-bold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-600" />
                Aluguéis ({alugueis.length})
              </h3>
            </div>
            {alugueis.length === 0 ? (
              <div className="p-6 text-center text-sm text-keu-black/40">
                Sem aluguéis
              </div>
            ) : (
              <div className="divide-y divide-keu-black/5">
                {alugueis.slice(0, 5).map((a) => (
                  <div key={a._id} className="p-3 px-6 flex justify-between text-sm gap-2">
                    <div className="truncate">
                      {a.motoMarca} {a.motoModelo}
                    </div>
                    <Badge
                      variant={
                        a.status === "ativo"
                          ? "success"
                          : a.status === "atrasado"
                          ? "danger"
                          : "info"
                      }
                      className="text-[10px] flex-shrink-0"
                    >
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* CONTRATOS DO CLIENTE */}
      <ContratosDoCliente clienteId={id} />
    </div>
  );
}

interface ContratoMini {
  _id: string;
  contratante: { nome: string };
  moto: { marca: string; modelo: string; placa?: string };
  plano: { parcelas: number; valorParcela: number };
  status: string;
  dataContrato: string;
  geradoPorNome?: string;
}

function ContratosDoCliente({ clienteId }: { clienteId: string }) {
  const { data, loading } = useApi<{ contratos: ContratoMini[] }>(
    `/api/contratos?clienteId=${clienteId}`
  );
  const contratos = data?.contratos ?? [];
  return (
    <div className="mt-6">
      <Card>
        <div className="p-5 border-b border-keu-black/5 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-keu-red" />
              Contratos ({contratos.length})
            </h3>
            <p className="text-xs text-keu-black/60">
              Histórico de contratos de locação gerados pra esse cliente
            </p>
          </div>
          {contratos.length > 0 && (
            <Link
              href="/dashboard/contratos"
              className="text-xs text-keu-red font-semibold hover:underline"
            >
              Ver todos
            </Link>
          )}
        </div>
        {loading ? (
          <div className="p-6 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-keu-red mx-auto" />
          </div>
        ) : contratos.length === 0 ? (
          <div className="p-6 text-center text-sm text-keu-black/40">
            Nenhum contrato gerado pra esse cliente ainda
          </div>
        ) : (
          <div className="divide-y divide-keu-black/5">
            {contratos.slice(0, 10).map((c) => {
              const numero = c._id.slice(-6).toUpperCase();
              return (
                <div
                  key={c._id}
                  className="p-3 px-6 flex items-center justify-between gap-3 text-sm flex-wrap"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-keu-black/40">
                        #{numero}
                      </span>
                      <Badge
                        variant={
                          c.status === "assinado" || c.status === "concluido"
                            ? "success"
                            : c.status === "rescindido"
                            ? "danger"
                            : "warning"
                        }
                        className="text-[10px] uppercase"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-keu-black/60 mt-0.5">
                      {c.moto.marca} {c.moto.modelo}
                      {c.moto.placa ? ` · ${c.moto.placa}` : ""} ·{" "}
                      {c.plano.parcelas}x · {formatDate(c.dataContrato)}
                    </div>
                  </div>
                  <a
                    href={`/api/contratos/${c._id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-keu-red text-white font-semibold hover:bg-keu-red-dark transition inline-flex items-center gap-1.5"
                  >
                    PDF
                  </a>
                </div>
              );
            })}
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
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="p-6 card-hover">
      <div
        className={`${color} text-white w-10 h-10 rounded-lg flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <div className="text-2xl font-black mb-1 truncate">{value}</div>
      <div className="text-sm text-keu-black/60">{label}</div>
    </Card>
  );
}
