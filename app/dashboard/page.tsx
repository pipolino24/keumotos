"use client";

import Link from "next/link";
import {
  TrendingUp,
  Bike,
  Target,
  Phone,
  ArrowRight,
  CheckCircle2,
  Clock,
  Trophy,
  Flame,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/user-context";
import { useApi } from "@/lib/hooks/use-api";

interface MotoApi {
  _id: string;
  status: string;
  marca: string;
  modelo: string;
  destaque?: boolean;
}

interface ContatoApi {
  _id: string;
  nome: string;
  telefone: string;
  status: string;
  vendedorResponsavel?: string;
  motoInteresse?: string;
}

export default function DashboardPage() {
  const me = useCurrentUser();

  const { data: motosData, loading: lm } = useApi<{ motos: MotoApi[] }>(
    "/api/motos"
  );
  const { data: contData, loading: lc } = useApi<{ contatos: ContatoApi[] }>(
    "/api/contatos"
  );

  const motos = motosData?.motos ?? [];
  const contatos = contData?.contatos ?? [];

  const motosDisponiveis = motos.filter((m) => m.status === "disponivel").length;
  const meusLeads = contatos.filter(
    (c) => c.vendedorResponsavel === me.nome || c.status === "novo"
  );
  const meusLeadsAtivos = meusLeads.filter(
    (c) => c.status === "novo" || c.status === "em-atendimento"
  );

  // TODO: criar endpoint /api/vendas?vendedorId=:id para minhas vendas + comissão
  const minhasVendas: Array<{
    id: string;
    motoModelo: string;
    clienteNome: string;
    valorVendido: number;
    comissao: number;
    formaPagamento: string;
    status: string;
  }> = [];

  const minhaComissao = 0;
  const loading = lm || lc;

  return (
    <div>
      <PageHeader
        title={`Olá, ${me.nome.split(" ")[0]}! 👋`}
        description="Seu painel pessoal — vendas, leads e estoque do dia"
      >
        <Link href="/dashboard/estoque/novo">
          <Button>
            <Bike className="h-4 w-4" /> Cadastrar Moto
          </Button>
        </Link>
      </PageHeader>

      {/* STATS PESSOAIS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Minhas vendas do mês"
          value={minhasVendas.length.toString()}
          trend="aguardando /api/vendas"
          color="bg-emerald-500"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Minha comissão"
          value={formatCurrency(minhaComissao)}
          trend="atual no mês"
          color="bg-keu-red"
        />
        <StatCard
          icon={<Phone className="h-5 w-5" />}
          label="Meus leads ativos"
          value={meusLeadsAtivos.length.toString()}
          trend={`${meusLeads.length} no total`}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Bike className="h-5 w-5" />}
          label="Motos no estoque"
          value={motosDisponiveis.toString()}
          trend="disponíveis para venda"
          color="bg-amber-500"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* MINHAS VENDAS */}
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Minhas vendas recentes</h2>
              <p className="text-sm text-keu-black/60">
                Suas últimas transações
              </p>
            </div>
            <Link
              href="/dashboard/vendas"
              className="text-sm text-keu-red font-semibold hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-12 text-center">
            <Target className="h-10 w-10 text-keu-black/20 mx-auto mb-3" />
            <p className="text-sm text-keu-black/60">
              Endpoint <code className="bg-keu-gray-light px-1.5 py-0.5 rounded text-xs">/api/vendas</code> ainda não foi criado.
              <br />Suas vendas aparecerão aqui em breve.
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          {/* META PESSOAL */}
          <Card className="p-6 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="bg-white/20 backdrop-blur w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-1">Meta do mês</h3>
              <p className="text-sm text-white/80 mb-4">
                Acompanhe seu progresso pessoal
              </p>
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/80">
                    {minhasVendas.length} de 8 vendas
                  </span>
                  <span className="font-bold">
                    {Math.round((minhasVendas.length / 8) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{
                      width: `${Math.min(100, (minhasVendas.length / 8) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-white/70 mt-3">
                Faltam {Math.max(0, 8 - minhasVendas.length)} vendas pra
                bater a meta
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Próximas devoluções</h3>
            <div className="text-xs text-keu-black/40 text-center py-4">
              {/* TODO: endpoint /api/alugueis para listar devoluções */}
              Aguardando endpoint /api/alugueis
            </div>
          </Card>
        </div>
      </div>

      {/* MEUS LEADS */}
      <div className="mt-6">
        <Card>
          <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Meus leads ativos</h2>
              <p className="text-sm text-keu-black/60">
                Contatos para você atender
              </p>
            </div>
            <Link
              href="/dashboard/contatos"
              className="text-sm text-keu-red font-semibold hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-keu-red mx-auto" />
            </div>
          ) : meusLeadsAtivos.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm text-keu-black/60">
                Nenhum lead pendente — bom trabalho!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-keu-black/5">
              {meusLeadsAtivos.slice(0, 5).map((c) => (
                <div
                  key={c._id}
                  className="p-4 px-6 flex items-center gap-4 hover:bg-keu-gray-light transition"
                >
                  <div className="bg-keu-red text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {c.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{c.nome}</div>
                    <div className="text-xs text-keu-black/60 flex items-center gap-2 flex-wrap">
                      <span>{c.telefone}</span>
                      {c.motoInteresse && (
                        <>
                          <span>•</span>
                          <span>interessado em {c.motoInteresse}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={c.status === "novo" ? "info" : "warning"}
                    className="text-[10px]"
                  >
                    {c.status === "novo" ? (
                      <Clock className="h-3 w-3" />
                    ) : null}
                    {c.status === "novo" ? "Novo" : "Em atendimento"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  color: string;
}) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all">
      <div
        className={`${color} text-white w-10 h-10 rounded-lg flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <div className="text-3xl font-black mb-1">{value}</div>
      <div className="text-sm text-keu-black/60">{label}</div>
      <div className="text-xs text-keu-black/40 mt-2">{trend}</div>
    </Card>
  );
}
