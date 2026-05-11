import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Bike,
  Users,
  DollarSign,
  Package,
  KeyRound,
  ArrowRight,
  Phone,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  mockMotos,
  mockVendas,
  mockContatos,
  mockAlugueis,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const motosDisponiveis = mockMotos.filter(
    (m) => m.status === "disponivel"
  ).length;
  const motosAlugadas = mockMotos.filter((m) => m.status === "alugada").length;
  const vendasMes = mockVendas
    .filter((v) => v.status === "concluida")
    .reduce((acc, v) => acc + v.valorVendido, 0);
  const contatosNovos = mockContatos.filter((c) => c.status === "novo").length;

  return (
    <div>
      <PageHeader
        title="Olá, Marcos! 👋"
        description="Aqui está um resumo de hoje na KEU."
      >
        <Link href="/dashboard/estoque/novo">
          <Button>
            <Bike className="h-4 w-4" /> Cadastrar Moto
          </Button>
        </Link>
      </PageHeader>

      {/* STATS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Vendas no mês"
          value={formatCurrency(vendasMes)}
          trend="+12.5%"
          trendUp
          color="bg-emerald-500"
        />
        <StatCard
          icon={<Bike className="h-5 w-5" />}
          label="Motos em estoque"
          value={motosDisponiveis.toString()}
          trend="3 novas"
          trendUp
          color="bg-keu-red"
        />
        <StatCard
          icon={<KeyRound className="h-5 w-5" />}
          label="Motos alugadas"
          value={motosAlugadas.toString()}
          trend="-1 vs ontem"
          color="bg-amber-500"
        />
        <StatCard
          icon={<Phone className="h-5 w-5" />}
          label="Leads novos"
          value={contatosNovos.toString()}
          trend="+5 hoje"
          trendUp
          color="bg-blue-500"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* VENDAS RECENTES */}
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Vendas recentes</h2>
              <p className="text-sm text-keu-black/60">
                Últimas transações realizadas
              </p>
            </div>
            <Link
              href="/dashboard/vendas"
              className="text-sm text-keu-red font-semibold hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-keu-black/5">
            {mockVendas.slice(0, 4).map((v) => (
              <div
                key={v.id}
                className="p-4 px-6 flex items-center gap-4 hover:bg-keu-gray-light transition"
              >
                <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
                  <Bike className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{v.motoModelo}</div>
                  <div className="text-xs text-keu-black/60 flex items-center gap-2">
                    <span>{v.clienteNome}</span>
                    <span>•</span>
                    <span className="capitalize">{v.formaPagamento.replace("-", " ")}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-keu-red">
                    {formatCurrency(v.valorVendido)}
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* QUICK ACTIONS */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0">
            <div className="bg-white/20 backdrop-blur w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-1">Acompanhe seu time</h3>
            <p className="text-sm text-white/80 mb-4">
              Veja desempenho de vendedores e comissões
            </p>
            <Link href="/dashboard/usuarios">
              <Button
                variant="white"
                className="w-full text-keu-red font-bold"
              >
                Ver vendedores <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Próximas devoluções</h3>
            <div className="space-y-3">
              {mockAlugueis
                .filter((a) => a.status === "ativo")
                .map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="bg-amber-100 text-amber-700 w-9 h-9 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {a.motoModelo}
                      </div>
                      <div className="text-xs text-keu-black/60">
                        {a.clienteNome} • até {new Date(a.dataFim).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                ))}
              {mockAlugueis.filter((a) => a.status === "ativo").length === 0 && (
                <p className="text-sm text-keu-black/40 text-center py-4">
                  Nenhum aluguel ativo
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* MOTOS EM DESTAQUE */}
      <div className="mt-6">
        <Card>
          <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Estoque em destaque</h2>
              <p className="text-sm text-keu-black/60">
                Motos prioritárias para venda
              </p>
            </div>
            <Link
              href="/dashboard/estoque"
              className="text-sm text-keu-red font-semibold hover:underline flex items-center gap-1"
            >
              Ver estoque <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockMotos
                .filter((m) => m.destaque)
                .slice(0, 4)
                .map((m) => (
                  <Card key={m.id} className="overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-keu-black to-keu-gray relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Bike className="h-12 w-12 text-keu-red/40" />
                      </div>
                      <Badge className="absolute top-2 left-2" variant="default">
                        Destaque
                      </Badge>
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-bold text-keu-red">
                        {m.marca}
                      </div>
                      <div className="font-semibold text-sm truncate">
                        {m.modelo}
                      </div>
                      <div className="text-xs text-keu-black/60 mt-1">
                        {m.anoModelo} • {m.cor}
                      </div>
                      <div className="font-black text-keu-red mt-2">
                        {formatCurrency(m.valorAnunciado)}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
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
  trendUp,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  trendUp?: boolean;
  color: string;
}) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`${color} text-white w-10 h-10 rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-semibold ${
            trendUp ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {trendUp ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {trend}
        </div>
      </div>
      <div className="text-3xl font-black mb-1">{value}</div>
      <div className="text-sm text-keu-black/60">{label}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "success" | "warning" | "danger"> = {
    concluida: "success",
    pendente: "warning",
    cancelada: "danger",
  };
  const labels: Record<string, string> = {
    concluida: "Concluída",
    pendente: "Pendente",
    cancelada: "Cancelada",
  };
  return (
    <Badge variant={variants[status] || "secondary"} className="text-[10px]">
      {labels[status] || status}
    </Badge>
  );
}
