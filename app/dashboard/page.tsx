import Link from "next/link";
import {
  TrendingUp,
  Bike,
  Target,
  Phone,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  Trophy,
  Flame,
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

// Mock: vendedor logado. Em produção viria da sessão.
const meuId = "u2";
const meuNome = "Marcos Vinícius Lima";

export default function DashboardPage() {
  // Apenas dados do PRÓPRIO vendedor (sem ver vendas de colegas)
  const minhasVendas = mockVendas.filter((v) => v.vendedorId === meuId);
  const minhasVendasMes = minhasVendas.filter((v) => v.status === "concluida");
  const minhaComissao = minhasVendasMes.reduce(
    (acc, v) => acc + v.comissao,
    0
  );

  const motosDisponiveis = mockMotos.filter(
    (m) => m.status === "disponivel"
  ).length;

  // Leads atribuídos ao vendedor + leads novos não atribuídos
  const meusLeads = mockContatos.filter(
    (c) => c.vendedorResponsavel === meuNome || c.status === "novo"
  );
  const meusLeadsAtivos = meusLeads.filter(
    (c) => c.status === "novo" || c.status === "em-atendimento"
  );

  return (
    <div>
      <PageHeader
        title={`Olá, ${meuNome.split(" ")[0]}! 👋`}
        description="Seu painel pessoal — vendas, leads e estoque do dia"
      >
        <Link href="/dashboard/estoque/novo">
          <Button>
            <Bike className="h-4 w-4" /> Cadastrar Moto
          </Button>
        </Link>
      </PageHeader>

      {/* STATS PESSOAIS — só dados do vendedor logado */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Minhas vendas do mês"
          value={minhasVendasMes.length.toString()}
          trend={`${minhasVendas.length} totais`}
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
          {minhasVendas.length === 0 ? (
            <div className="p-12 text-center">
              <Target className="h-10 w-10 text-keu-black/20 mx-auto mb-3" />
              <p className="text-sm text-keu-black/60">
                Nenhuma venda registrada ainda.
                <br />
                Vamos fechar a primeira?
              </p>
            </div>
          ) : (
            <div className="divide-y divide-keu-black/5">
              {minhasVendas.slice(0, 4).map((v) => (
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
                      <span className="capitalize">
                        {v.formaPagamento.replace("-", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-keu-black/60">
                      Comissão
                    </div>
                    <div className="font-bold text-emerald-600">
                      {formatCurrency(v.comissao)}
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    {minhasVendasMes.length} de 8 vendas
                  </span>
                  <span className="font-bold">
                    {Math.round((minhasVendasMes.length / 8) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{
                      width: `${Math.min(100, (minhasVendasMes.length / 8) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-white/70 mt-3">
                Faltam {Math.max(0, 8 - minhasVendasMes.length)} vendas pra
                bater a meta
              </p>
            </div>
          </Card>

          {/* PRÓXIMAS DEVOLUÇÕES (motos alugadas com vendedor) */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Próximas devoluções</h3>
            <div className="space-y-3">
              {mockAlugueis
                .filter((a) => a.status === "ativo")
                .slice(0, 3)
                .map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="bg-amber-100 text-amber-700 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {a.motoModelo}
                      </div>
                      <div className="text-xs text-keu-black/60">
                        {a.clienteNome} · até{" "}
                        {new Date(a.dataFim).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                ))}
              {mockAlugueis.filter((a) => a.status === "ativo").length === 0 && (
                <p className="text-sm text-keu-black/40 text-center py-4">
                  Nenhuma devolução agendada
                </p>
              )}
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
          {meusLeadsAtivos.length === 0 ? (
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
                  key={c.id}
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
    <Badge variant={variants[status] || "secondary"} className="text-[10px] mt-1">
      {labels[status] || status}
    </Badge>
  );
}
