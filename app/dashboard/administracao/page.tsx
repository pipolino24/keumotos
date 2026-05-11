import Link from "next/link";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Crown,
  Bike,
  AlertTriangle,
  Trophy,
  Target,
  ArrowRight,
  Wallet,
  Receipt,
  PiggyBank,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  mockMotos,
  mockVendas,
  mockAlugueis,
  mockUsers,
  mockContatos,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function AdministracaoPage() {
  // FATURAMENTO
  const vendasConcluidas = mockVendas.filter((v) => v.status === "concluida");
  const faturamentoTotal = vendasConcluidas.reduce(
    (s, v) => s + v.valorVendido,
    0
  );
  const ticketMedio =
    vendasConcluidas.length > 0
      ? faturamentoTotal / vendasConcluidas.length
      : 0;
  const comissoesPagas = vendasConcluidas.reduce(
    (s, v) => s + v.comissao,
    0
  );

  // ESTOQUE
  const investidoEstoque = mockMotos
    .filter((m) => m.status !== "vendida")
    .reduce((s, m) => s + m.valorCompra, 0);
  const receitaPotencial = mockMotos
    .filter((m) => m.status !== "vendida")
    .reduce((s, m) => s + m.valorAnunciado, 0);
  const margemPotencial = receitaPotencial - investidoEstoque;
  const margemPercentual =
    investidoEstoque > 0
      ? ((margemPotencial / investidoEstoque) * 100).toFixed(1)
      : "0";

  // ALUGUEL
  const receitaAluguel = mockAlugueis.reduce((s, a) => s + a.valorTotal, 0);

  // RESULTADO LÍQUIDO
  const resultadoBruto = faturamentoTotal + receitaAluguel;
  const resultadoLiquido = resultadoBruto - comissoesPagas;

  // VENDEDORES
  const vendedores = mockUsers.filter((u) => u.role === "vendedor");
  const rankingVendedores = [...vendedores].sort(
    (a, b) => (b.vendasRealizadas ?? 0) - (a.vendasRealizadas ?? 0)
  );

  // LOJAS
  const porLoja = {
    multimarcas: mockMotos.filter((m) => m.loja === "multimarcas"),
    loca: mockMotos.filter((m) => m.loja === "loca"),
    pecas: mockMotos.filter((m) => m.loja === "pecas"),
  };

  // CONVERSÃO LEADS
  const totalLeads = mockContatos.length;
  const convertidos = mockContatos.filter(
    (c) => c.status === "convertido"
  ).length;
  const taxaConversao =
    totalLeads > 0 ? ((convertidos / totalLeads) * 100).toFixed(1) : "0";

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Administração
            <Badge variant="dark" className="text-[10px]">
              <Crown className="h-3 w-3" /> Admin
            </Badge>
          </span>
        }
        description="Visão executiva: faturamento, margem, P&L e desempenho da operação"
      >
        <Button variant="outline">
          <BarChart3 className="h-4 w-4" /> Relatório completo
        </Button>
      </PageHeader>

      <Card className="p-4 mb-6 bg-gradient-to-br from-keu-black to-keu-gray text-white border-0">
        <div className="flex items-center gap-3">
          <div className="bg-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold">Área restrita</div>
            <div className="text-xs text-white/70">
              Dados sensíveis (custos, margem, comissões de outros vendedores).
              Acesso apenas para administradores.
            </div>
          </div>
        </div>
      </Card>

      {/* P&L PRINCIPAL */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<DollarSign />}
          label="Faturamento bruto"
          value={formatCurrency(resultadoBruto)}
          subtitle={`${vendasConcluidas.length} vendas + ${mockAlugueis.length} aluguéis`}
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          icon={<Receipt />}
          label="Comissões pagas"
          value={formatCurrency(comissoesPagas)}
          subtitle={`vendedores + afiliados`}
          color="from-amber-500 to-amber-600"
        />
        <StatCard
          icon={<PiggyBank />}
          label="Resultado líquido"
          value={formatCurrency(resultadoLiquido)}
          subtitle="após comissões"
          color="from-keu-red to-keu-red-dark"
        />
        <StatCard
          icon={<TrendingUp />}
          label="Ticket médio"
          value={formatCurrency(ticketMedio)}
          subtitle="por venda concluída"
          color="from-blue-500 to-blue-600"
        />
      </div>

      {/* ESTOQUE FINANCEIRO */}
      <Card className="p-6 mb-8 bg-gradient-to-br from-keu-gray-light to-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-lg">Análise financeira do estoque</h2>
            <p className="text-sm text-keu-black/60">
              Capital imobilizado e margem potencial
            </p>
          </div>
          <Link
            href="/dashboard/estoque"
            className="text-sm text-keu-red font-semibold hover:underline flex items-center gap-1"
          >
            Ver estoque <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-white">
            <div className="flex items-center gap-2 text-xs text-keu-black/60 mb-2">
              <Wallet className="h-3 w-3" />
              CAPITAL INVESTIDO
            </div>
            <div className="text-2xl font-black">
              {formatCurrency(investidoEstoque)}
            </div>
            <div className="text-xs text-keu-black/60 mt-1">
              Total pago por motos não vendidas
            </div>
          </Card>

          <Card className="p-5 bg-white">
            <div className="flex items-center gap-2 text-xs text-keu-black/60 mb-2">
              <Target className="h-3 w-3" />
              RECEITA POTENCIAL
            </div>
            <div className="text-2xl font-black text-blue-600">
              {formatCurrency(receitaPotencial)}
            </div>
            <div className="text-xs text-keu-black/60 mt-1">
              Se todas vendessem pelo anunciado
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <div className="flex items-center gap-2 text-xs text-emerald-700 mb-2">
              <TrendingUp className="h-3 w-3" />
              MARGEM POTENCIAL
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {formatCurrency(margemPotencial)}
            </div>
            <div className="text-xs text-emerald-700 mt-1 font-semibold">
              +{margemPercentual}% sobre o investido
            </div>
          </Card>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* RANKING DE VENDEDORES */}
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-keu-black/5">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Ranking de
              vendedores
            </h2>
            <p className="text-sm text-keu-black/60">
              Desempenho comparativo da equipe
            </p>
          </div>
          <div className="divide-y divide-keu-black/5">
            {rankingVendedores.map((v, idx) => {
              const colorMap = [
                "bg-amber-100 text-amber-700", // ouro
                "bg-gray-100 text-gray-700", // prata
                "bg-orange-100 text-orange-700", // bronze
              ];
              return (
                <div
                  key={v.id}
                  className="p-4 flex items-center gap-4 hover:bg-keu-gray-light transition"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                      colorMap[idx] ?? "bg-keu-gray-light text-keu-black/60"
                    }`}
                  >
                    {idx + 1}º
                  </div>
                  <div className="bg-keu-red text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {v.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{v.nome}</div>
                    <div className="text-xs text-keu-black/60">{v.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-keu-red">
                      {v.vendasRealizadas} vendas
                    </div>
                    <div className="text-xs text-keu-black/60">
                      Comissão:{" "}
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(v.comissaoTotal ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {rankingVendedores.length === 0 && (
              <div className="p-12 text-center text-keu-black/60 text-sm">
                Nenhum vendedor cadastrado
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Funil de conversão</h3>
            <div className="space-y-3">
              <FunilBar
                label="Leads totais"
                value={totalLeads}
                max={totalLeads}
                color="bg-blue-500"
              />
              <FunilBar
                label="Em atendimento"
                value={
                  mockContatos.filter((c) => c.status === "em-atendimento")
                    .length
                }
                max={totalLeads}
                color="bg-amber-500"
              />
              <FunilBar
                label="Convertidos"
                value={convertidos}
                max={totalLeads}
                color="bg-emerald-500"
              />
            </div>
            <div className="mt-4 pt-4 border-t border-keu-black/5 text-center">
              <div className="text-3xl font-black text-keu-red">
                {taxaConversao}%
              </div>
              <div className="text-xs text-keu-black/60">
                Taxa de conversão geral
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-bold mb-2">Atenção</h3>
            <p className="text-sm text-white/90 mb-4">
              {mockMotos.filter((m) => m.km > 20000 && m.status === "disponivel")
                .length}{" "}
              motos com +20k km no estoque há mais de 60 dias
            </p>
            <Button variant="white" size="sm" className="text-amber-600">
              Ver detalhes <ArrowRight className="h-3 w-3" />
            </Button>
          </Card>
        </div>
      </div>

      {/* P&L POR LOJA */}
      <Card className="mb-6">
        <div className="p-6 border-b border-keu-black/5">
          <h2 className="font-bold text-lg">Performance por loja</h2>
          <p className="text-sm text-keu-black/60">
            Distribuição de estoque e operação por unidade
          </p>
        </div>
        <div className="p-6 grid sm:grid-cols-3 gap-4">
          {(["multimarcas", "loca", "pecas"] as const).map((loja) => {
            const motos = porLoja[loja];
            const investido = motos.reduce((s, m) => s + m.valorCompra, 0);
            const potencial = motos.reduce((s, m) => s + m.valorAnunciado, 0);
            const nomes = {
              multimarcas: "KEU Multimarcas",
              loca: "KEU Loca Motos",
              pecas: "KEU Moto Peças",
            };
            const cores = {
              multimarcas: "from-keu-red to-keu-red-dark",
              loca: "from-purple-500 to-purple-700",
              pecas: "from-amber-500 to-amber-700",
            };
            return (
              <Card
                key={loja}
                className={`p-5 bg-gradient-to-br ${cores[loja]} text-white border-0`}
              >
                <h4 className="font-bold mb-1">{nomes[loja]}</h4>
                <div className="text-xs text-white/70 mb-4">
                  {motos.length} motos
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/80">Investido:</span>
                    <span className="font-bold">
                      {formatCurrency(investido)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Potencial:</span>
                    <span className="font-bold">
                      {formatCurrency(potencial)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/20">
                    <span className="text-white">Margem:</span>
                    <span className="font-black">
                      {formatCurrency(potencial - investido)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* TODAS AS VENDAS (admin) */}
      <Card>
        <div className="p-6 border-b border-keu-black/5">
          <h2 className="font-bold text-lg">Todas as vendas concluídas</h2>
          <p className="text-sm text-keu-black/60">
            Histórico completo com margem por venda
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
              <tr>
                <th className="text-left p-4">Moto</th>
                <th className="text-left p-4">Vendedor</th>
                <th className="text-right p-4">Valor venda</th>
                <th className="text-right p-4">Comissão</th>
                <th className="text-right p-4">Líquido</th>
                <th className="text-left p-4">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-keu-black/5">
              {vendasConcluidas.map((v) => (
                <tr key={v.id} className="hover:bg-keu-gray-light transition">
                  <td className="p-4 font-semibold">{v.motoModelo}</td>
                  <td className="p-4 text-sm">{v.vendedorNome}</td>
                  <td className="p-4 text-right font-bold">
                    {formatCurrency(v.valorVendido)}
                  </td>
                  <td className="p-4 text-right text-amber-600">
                    -{formatCurrency(v.comissao)}
                  </td>
                  <td className="p-4 text-right font-black text-emerald-600">
                    {formatCurrency(v.valorVendido - v.comissao)}
                  </td>
                  <td className="p-4 text-sm capitalize">
                    {v.formaPagamento.replace("-", " ")}
                    {v.parcelas && ` (${v.parcelas}x)`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function FunilBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-keu-black/60">
          {value} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-keu-gray-light rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
