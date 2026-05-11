"use client";

import Link from "next/link";
import {
  Bike,
  Link2,
  DollarSign,
  TrendingUp,
  Copy,
  ExternalLink,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// Mock — em produção viria da sessão do usuário
const me = {
  nome: "João Silva",
  codigo: "joao-silva-keu",
  email: "joao@email.com",
  tipoComissao: "percentual" as const,
  comissaoPercentual: 3,
  comissaoFixa: 0,
  status: "ativo",
  totalCliques: 247,
  totalVendas: 4,
  comissaoAcumulada: 1850,
  comissaoPaga: 950,
  comissaoPendente: 900,
};

const motosDestaque = [
  {
    marca: "Honda",
    modelo: "CG 160 Titan",
    ano: 2024,
    valor: 15200,
    comissao: 456,
  },
  {
    marca: "Yamaha",
    modelo: "Fazer 250 ABS",
    ano: 2024,
    valor: 23800,
    comissao: 714,
  },
  {
    marca: "Honda",
    modelo: "PCX 160",
    ano: 2025,
    valor: 20200,
    comissao: 606,
  },
];

const indicacoesRecentes = [
  {
    moto: "Honda CG 160 Titan",
    data: "2026-05-08",
    status: "vendido",
    valor: 15200,
    comissao: 456,
  },
  {
    moto: "Honda Biz 125",
    data: "2026-05-07",
    status: "negociando",
    valor: 0,
    comissao: 0,
  },
  {
    moto: "Yamaha Fazer 250",
    data: "2026-05-05",
    status: "lead",
    valor: 0,
    comissao: 0,
  },
];

export default function AfiliadoDashboardPage() {
  function copyLink() {
    const link = `${window.location.origin}/m/${me.codigo}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência");
  }

  function shareWhatsApp() {
    const link = `${window.location.origin}/m/${me.codigo}`;
    const text = `Confira as melhores motos da KEU 🏍️\n\n${link}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  const conversao =
    me.totalCliques > 0
      ? ((me.totalVendas / me.totalCliques) * 100).toFixed(1)
      : "0";

  return (
    <div>
      <PageHeader
        title={`Olá, ${me.nome.split(" ")[0]}! 👋`}
        description="Veja seu desempenho e divulgue as melhores motos"
      >
        <Link href="/afiliado/motos">
          <Button>
            <Bike className="h-4 w-4" /> Ver motos para divulgar
          </Button>
        </Link>
      </PageHeader>

      {/* LINK PRINCIPAL */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-purple-500 via-keu-red to-keu-red-dark text-white overflow-hidden relative">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              Seu link de afiliado
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-4 py-3 font-mono text-lg flex-1 min-w-0">
              <span className="text-white/60">keumotos.com/m/</span>
              <span className="font-bold">{me.codigo}</span>
            </div>
            <Button
              type="button"
              variant="white"
              size="lg"
              onClick={copyLink}
              className="text-keu-red font-bold"
            >
              <Copy className="h-4 w-4" /> Copiar
            </Button>
            <Button
              type="button"
              variant="dark"
              size="lg"
              onClick={shareWhatsApp}
              className="bg-white/10 hover:bg-white/20 border border-white/30"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
          <p className="text-sm text-white/80 mt-3 max-w-2xl">
            Compartilhe esse link nas suas redes sociais. Toda venda fechada
            por quem clicar vai gerar comissão pra você.
          </p>
        </div>
      </Card>

      {/* STATS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Link2 />}
          label="Cliques no link"
          value={me.totalCliques.toString()}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={<TrendingUp />}
          label="Vendas fechadas"
          value={me.totalVendas.toString()}
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          icon={<Award />}
          label="Conversão"
          value={`${conversao}%`}
          color="from-amber-500 to-amber-600"
        />
        <StatCard
          icon={<DollarSign />}
          label="Comissão pendente"
          value={formatCurrency(me.comissaoPendente)}
          color="from-keu-red to-keu-red-dark"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* MOTOS EM DESTAQUE */}
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Motos em destaque pra você</h2>
              <p className="text-sm text-keu-black/60">
                Suas melhores oportunidades de comissão
              </p>
            </div>
            <Link
              href="/afiliado/motos"
              className="text-sm text-keu-red font-semibold hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-6 grid sm:grid-cols-3 gap-4">
            {motosDestaque.map((m, i) => (
              <Card
                key={i}
                className="overflow-hidden hover:shadow-lg transition"
              >
                <div className="aspect-video bg-gradient-to-br from-keu-black to-keu-gray relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bike className="h-12 w-12 text-keu-red/30" />
                  </div>
                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur rounded-md px-2 py-0.5 text-xs font-bold">
                    {m.ano}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-xs font-bold text-keu-red">
                    {m.marca}
                  </div>
                  <div className="font-bold text-sm">{m.modelo}</div>
                  <div className="text-xs text-keu-black/60 mt-1">
                    {formatCurrency(m.valor)}
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md mt-2 p-2 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                      Sua comissão
                    </span>
                    <span className="text-sm font-black text-emerald-700">
                      {formatCurrency(m.comissao)}
                    </span>
                  </div>
                  <Button size="sm" className="w-full mt-2">
                    <Copy className="h-3 w-3" /> Copiar link
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* COMISSÃO ATUAL */}
          <Card className="p-6 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
              Sua comissão atual
            </div>
            <div className="text-5xl font-black mb-1">
              {me.tipoComissao === "percentual"
                ? `${me.comissaoPercentual}%`
                : formatCurrency(me.comissaoFixa)}
            </div>
            <div className="text-sm text-white/80 mb-4">
              {me.tipoComissao === "percentual"
                ? "do valor de cada venda"
                : "por venda fechada"}
            </div>
            <div className="border-t border-white/20 pt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Acumulado:</span>
                <span className="font-bold">
                  {formatCurrency(me.comissaoAcumulada)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Já recebido:</span>
                <span className="font-bold">
                  {formatCurrency(me.comissaoPaga)}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/20 pt-2 mt-2">
                <span className="text-white">A receber:</span>
                <span className="font-black">
                  {formatCurrency(me.comissaoPendente)}
                </span>
              </div>
            </div>
          </Card>

          {/* INDICAÇÕES RECENTES */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Indicações recentes</h3>
            <div className="space-y-3">
              {indicacoesRecentes.map((ind, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      ind.status === "vendido"
                        ? "bg-emerald-100 text-emerald-600"
                        : ind.status === "negociando"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {ind.status === "vendido" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : ind.status === "negociando" ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {ind.moto}
                    </div>
                    <div className="text-xs text-keu-black/60 capitalize">
                      {ind.status}
                      {ind.comissao > 0 && ` · +${formatCurrency(ind.comissao)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
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
    <Card className={`p-6 bg-gradient-to-br ${color} text-white border-0`}>
      <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm text-white/90">{label}</div>
    </Card>
  );
}
