import Link from "next/link";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  Bike,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { mockVendas, mockMotos } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VendasPage() {
  const motosVenda = mockMotos.filter(
    (m) => m.tipo === "venda" || m.tipo === "ambos"
  );
  const totalVendas = mockVendas.length;
  const totalFaturado = mockVendas
    .filter((v) => v.status === "concluida")
    .reduce((acc, v) => acc + v.valorVendido, 0);
  const totalComissao = mockVendas
    .filter((v) => v.status === "concluida")
    .reduce((acc, v) => acc + v.comissao, 0);
  const vendasPendentes = mockVendas.filter((v) => v.status === "pendente").length;

  return (
    <div>
      <PageHeader
        title="Venda de Motos"
        description="Catálogo, propostas e histórico de vendas"
      >
        <Button variant="outline" size="default">
          <Download className="h-4 w-4" /> Exportar
        </Button>
        <Link href="/dashboard/vendas/nova">
          <Button>
            <ShoppingCart className="h-4 w-4" /> Nova Venda
          </Button>
        </Link>
      </PageHeader>

      {/* STATS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox
          icon={<DollarSign />}
          label="Faturamento mês"
          value={formatCurrency(totalFaturado)}
          color="from-emerald-500 to-emerald-600"
        />
        <StatBox
          icon={<ShoppingCart />}
          label="Vendas realizadas"
          value={totalVendas.toString()}
          color="from-keu-red to-keu-red-dark"
        />
        <StatBox
          icon={<TrendingUp />}
          label="Comissões pagas"
          value={formatCurrency(totalComissao)}
          color="from-blue-500 to-blue-600"
        />
        <StatBox
          icon={<Clock />}
          label="Vendas pendentes"
          value={vendasPendentes.toString()}
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* CATÁLOGO */}
      <Card className="mb-8">
        <div className="p-6 border-b border-keu-black/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Motos à venda</h2>
              <p className="text-sm text-keu-black/60">
                {motosVenda.length} motos disponíveis no catálogo
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input placeholder="Buscar..." className="pl-9 w-48" />
              </div>
              <Button variant="outline" size="default">
                <Filter className="h-4 w-4" /> Filtros
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="default">Todas ({motosVenda.length})</Badge>
            <Badge variant="outline">
              Disponíveis ({motosVenda.filter((m) => m.status === "disponivel").length})
            </Badge>
            <Badge variant="outline">
              Reservadas ({motosVenda.filter((m) => m.status === "reservada").length})
            </Badge>
            <Badge variant="outline">Destaque</Badge>
            <Badge variant="outline">FIPE Acima</Badge>
            <Badge variant="outline">FIPE Abaixo</Badge>
          </div>
        </div>

        <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {motosVenda.map((m) => (
            <Card
              key={m.id}
              className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="aspect-video bg-gradient-to-br from-keu-black to-keu-gray relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bike className="h-16 w-16 text-keu-red/30" />
                </div>
                <div className="absolute top-2 left-2 flex gap-1">
                  {m.destaque && <Badge variant="default">Destaque</Badge>}
                  <StatusMotoBadge status={m.status} />
                </div>
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur rounded-md px-2 py-0.5 text-xs font-bold">
                  {m.anoModelo}
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs font-bold text-keu-red mb-0.5">
                  {m.marca}
                </div>
                <h3 className="font-bold mb-2 leading-tight">
                  {m.modelo} {m.versao}
                </h3>
                <div className="flex gap-2 text-xs text-keu-black/60 mb-3 flex-wrap">
                  <span>{m.cilindrada}cc</span>
                  <span>•</span>
                  <span>{m.km.toLocaleString("pt-BR")} km</span>
                  <span>•</span>
                  <span>{m.cor}</span>
                </div>

                <div className="space-y-1.5 text-xs mb-3 bg-keu-gray-light rounded-lg p-2.5">
                  <PriceRow label="FIPE" value={m.valorFipe} />
                  <PriceRow
                    label="Anunciado"
                    value={m.valorAnunciado}
                    highlight
                  />
                  <PriceRow label="Mínimo" value={m.valorMinimo} muted />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Detalhes
                  </Button>
                  <Button size="sm" className="flex-1">
                    Vender <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* HISTÓRICO */}
      <Card>
        <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Histórico de vendas</h2>
            <p className="text-sm text-keu-black/60">
              Todas as transações realizadas
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
              <tr>
                <th className="text-left p-4">Moto</th>
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Vendedor</th>
                <th className="text-left p-4">Pagamento</th>
                <th className="text-right p-4">Valor</th>
                <th className="text-right p-4">Comissão</th>
                <th className="text-left p-4">Data</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-keu-black/5">
              {mockVendas.map((v) => (
                <tr key={v.id} className="hover:bg-keu-gray-light transition">
                  <td className="p-4 font-semibold">{v.motoModelo}</td>
                  <td className="p-4">{v.clienteNome}</td>
                  <td className="p-4 text-sm">{v.vendedorNome}</td>
                  <td className="p-4">
                    <span className="capitalize text-sm">
                      {v.formaPagamento.replace("-", " ")}
                      {v.parcelas && ` (${v.parcelas}x)`}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-keu-red">
                    {formatCurrency(v.valorVendido)}
                  </td>
                  <td className="p-4 text-right text-sm">
                    {formatCurrency(v.comissao)}
                  </td>
                  <td className="p-4 text-sm">{formatDate(v.data)}</td>
                  <td className="p-4">
                    <VendaStatusBadge status={v.status} />
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

function StatBox({
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
      <div className="text-sm text-white/80">{label}</div>
    </Card>
  );
}

function PriceRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={muted ? "text-keu-black/40" : "text-keu-black/60"}>
        {label}:
      </span>
      <span
        className={
          highlight
            ? "font-black text-keu-red"
            : muted
              ? "text-keu-black/50"
              : "font-semibold"
        }
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function StatusMotoBadge({ status }: { status: string }) {
  const map: Record<string, { v: "success" | "warning" | "danger" | "info" | "secondary"; l: string }> = {
    disponivel: { v: "success", l: "Disponível" },
    reservada: { v: "warning", l: "Reservada" },
    vendida: { v: "danger", l: "Vendida" },
    alugada: { v: "info", l: "Alugada" },
    manutencao: { v: "secondary", l: "Manutenção" },
  };
  const conf = map[status] || { v: "secondary" as const, l: status };
  return <Badge variant={conf.v}>{conf.l}</Badge>;
}

function VendaStatusBadge({ status }: { status: string }) {
  const map: Record<string, { v: "success" | "warning" | "danger"; l: string; i: React.ReactNode }> = {
    concluida: { v: "success", l: "Concluída", i: <CheckCircle2 className="h-3 w-3" /> },
    pendente: { v: "warning", l: "Pendente", i: <Clock className="h-3 w-3" /> },
    cancelada: { v: "danger", l: "Cancelada", i: null },
  };
  const conf = map[status] || { v: "warning" as const, l: status, i: null };
  return (
    <Badge variant={conf.v}>
      {conf.i}
      {conf.l}
    </Badge>
  );
}
