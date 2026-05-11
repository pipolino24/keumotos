"use client";

import Link from "next/link";
import {
  Shield,
  TrendingUp,
  DollarSign,
  Crown,
  AlertTriangle,
  Trophy,
  Target,
  ArrowRight,
  Wallet,
  Receipt,
  PiggyBank,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";

interface MotoApi {
  _id: string;
  status: string;
  km: number;
  valorCompra: number;
  valorAnunciado: number;
  origem: string;
  setor?: "multimarcas" | "loca" | "pecas";
  compra?: { valorPago?: number };
  repasse?: { valorCombinadoDono?: number };
}

interface UserApi {
  _id: string;
  nome: string;
  email: string;
  role: string;
  vendasRealizadas?: number;
  comissaoTotal?: number;
}

interface ContatoApi {
  _id: string;
  status: string;
}

// TODO: endpoints /api/vendas e /api/alugueis ainda não existem — usar arrays vazios por enquanto.
interface VendaApi {
  _id: string;
  status: string;
  valorVendido: number;
  comissao: number;
  motoModelo: string;
  vendedorNome: string;
  formaPagamento: string;
  parcelas?: number;
}
interface AluguelApi {
  _id: string;
  valorTotal: number;
}

export default function AdministracaoPage() {
  const {
    data: motosData,
    loading: loadingMotos,
    error: errorMotos,
  } = useApi<{ motos: MotoApi[] }>("/api/motos");
  const {
    data: usersData,
    loading: loadingUsers,
    error: errorUsers,
  } = useApi<{ users: UserApi[] }>("/api/users?role=vendedor");
  const {
    data: contatosData,
    loading: loadingContatos,
    error: errorContatos,
  } = useApi<{ contatos: ContatoApi[] }>("/api/contatos");

  const loading = loadingMotos || loadingUsers || loadingContatos;
  const error = errorMotos || errorUsers || errorContatos;

  const motos: MotoApi[] = motosData?.motos ?? [];
  const vendedores: UserApi[] = usersData?.users ?? [];
  const contatos: ContatoApi[] = contatosData?.contatos ?? [];

  // TODO: endpoints /api/vendas e /api/alugueis ainda não existem.
  const vendas: VendaApi[] = [];
  const alugueis: AluguelApi[] = [];

  // FATURAMENTO
  const vendasConcluidas = vendas.filter((v) => v.status === "concluida");
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
  const investidoEstoque = motos
    .filter((m) => m.status !== "vendida")
    .reduce((s, m) => s + m.valorCompra, 0);
  const receitaPotencial = motos
    .filter((m) => m.status !== "vendida")
    .reduce((s, m) => s + m.valorAnunciado, 0);
  const margemPotencial = receitaPotencial - investidoEstoque;
  const margemPercentual =
    investidoEstoque > 0
      ? ((margemPotencial / investidoEstoque) * 100).toFixed(1)
      : "0";

  // ALUGUEL
  const receitaAluguel = alugueis.reduce((s, a) => s + a.valorTotal, 0);

  // RESULTADO LÍQUIDO
  const resultadoBruto = faturamentoTotal + receitaAluguel;
  const resultadoLiquido = resultadoBruto - comissoesPagas;

  // VENDEDORES
  const rankingVendedores = [...vendedores].sort(
    (a, b) => (b.vendasRealizadas ?? 0) - (a.vendasRealizadas ?? 0)
  );

  // SETORES (uma loja, três setores)
  const porSetor = {
    multimarcas: motos.filter((m) => m.setor === "multimarcas"),
    loca: motos.filter((m) => m.setor === "loca"),
    pecas: motos.filter((m) => m.setor === "pecas"),
  };

  // ORIGEM DAS MOTOS (capital próprio vs repasse)
  const motosCompradas = motos.filter((m) => m.origem === "comprada");
  const motosRepasse = motos.filter((m) => m.origem === "repasse");
  const totalInvestidoCompra = motosCompradas.reduce(
    (s, m) => s + (m.compra?.valorPago ?? m.valorCompra),
    0
  );
  const compromissoRepasse = motosRepasse.reduce(
    (s, m) => s + (m.repasse?.valorCombinadoDono ?? 0),
    0
  );

  // CONVERSÃO LEADS
  const totalLeads = contatos.length;
  const convertidos = contatos.filter(
    (c) => c.status === "convertido"
  ).length;
  const taxaConversao =
    totalLeads > 0 ? ((convertidos / totalLeads) * 100).toFixed(1) : "0";

  if (loading) {
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
        />
        <Card className="p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
          <div className="text-sm text-keu-black/60">
            Carregando indicadores...
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
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
        />
        <Card className="p-16 text-center text-red-600 text-sm">{error}</Card>
      </div>
    );
  }

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
          subtitle={`${vendasConcluidas.length} vendas + ${alugueis.length} aluguéis`}
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
                  key={v._id}
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
                      {v.vendasRealizadas ?? 0} vendas
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
                  contatos.filter((c) => c.status === "em-atendimento")
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
              {motos.filter((m) => m.km > 20000 && m.status === "disponivel")
                .length}{" "}
              motos com +20k km no estoque há mais de 60 dias
            </p>
            <Button variant="white" size="sm" className="text-amber-600">
              Ver detalhes <ArrowRight className="h-3 w-3" />
            </Button>
          </Card>
        </div>
      </div>

      {/* ORIGEM DAS MOTOS — compra vs repasse */}
      <Card className="mb-6">
        <div className="p-6 border-b border-keu-black/5">
          <h2 className="font-bold text-lg">Aquisição de estoque</h2>
          <p className="text-sm text-keu-black/60">
            Motos compradas (capital próprio) vs em repasse (consignação)
          </p>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-4">
          <Card className="p-5 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0">
            <div className="text-xs uppercase tracking-wider text-white/80 mb-1">
              Compradas
            </div>
            <h4 className="font-bold mb-3">{motosCompradas.length} motos</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/80">Capital investido:</span>
                <span className="font-bold">
                  {formatCurrency(totalInvestidoCompra)}
                </span>
              </div>
              <div className="text-xs text-white/70 pt-1 border-t border-white/20">
                Lucro líquido fica integral para a KEU
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0">
            <div className="text-xs uppercase tracking-wider text-white/80 mb-1">
              Em repasse / Consignação
            </div>
            <h4 className="font-bold mb-3">{motosRepasse.length} motos</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/80">Compromisso com donos:</span>
                <span className="font-bold">
                  {formatCurrency(compromissoRepasse)}
                </span>
              </div>
              <div className="text-xs text-white/70 pt-1 border-t border-white/20">
                Valor a repassar aos proprietários quando vender
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* P&L POR SETOR */}
      <Card className="mb-6">
        <div className="p-6 border-b border-keu-black/5">
          <h2 className="font-bold text-lg">Performance por setor</h2>
          <p className="text-sm text-keu-black/60">
            Distribuição de estoque entre os três setores da KEU
          </p>
        </div>
        <div className="p-6 grid sm:grid-cols-3 gap-4">
          {(["multimarcas", "loca", "pecas"] as const).map((setor) => {
            const motosSetor = porSetor[setor];
            const investido = motosSetor.reduce(
              (s, m) => s + m.valorCompra,
              0
            );
            const potencial = motosSetor.reduce(
              (s, m) => s + m.valorAnunciado,
              0
            );
            const nomes = {
              multimarcas: "KEU Multimarcas",
              loca: "KEU Loca Motos",
              pecas: "KEU Moto Peças",
            };
            const subtitulos = {
              multimarcas: "Compra • Vende • Troca",
              loca: "Aluguel — Realizando Sonhos",
              pecas: "Peças e Borracharia",
            };
            const cores = {
              multimarcas: "from-keu-red to-keu-red-dark",
              loca: "from-purple-500 to-purple-700",
              pecas: "from-amber-500 to-amber-700",
            };
            return (
              <Card
                key={setor}
                className={`p-5 bg-gradient-to-br ${cores[setor]} text-white border-0`}
              >
                <h4 className="font-bold">{nomes[setor]}</h4>
                <div className="text-xs text-white/70 mb-4">
                  {subtitulos[setor]} · {motosSetor.length} motos
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
                <tr key={v._id} className="hover:bg-keu-gray-light transition">
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
              {vendasConcluidas.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-keu-black/60 text-sm"
                  >
                    Nenhuma venda concluída registrada
                  </td>
                </tr>
              )}
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
