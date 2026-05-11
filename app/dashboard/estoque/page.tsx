import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Bike,
  AlertTriangle,
  TrendingUp,
  Edit,
  Eye,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { mockMotos } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function EstoquePage() {
  const total = mockMotos.length;
  const disponiveis = mockMotos.filter((m) => m.status === "disponivel").length;
  const valorEstoque = mockMotos.reduce((acc, m) => acc + m.valorCompra, 0);
  const valorPotencial = mockMotos.reduce(
    (acc, m) => acc + m.valorAnunciado,
    0
  );
  const margemPotencial = valorPotencial - valorEstoque;

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Controle completo do inventário de motos"
      >
        <Button variant="outline">
          <Download className="h-4 w-4" /> Exportar
        </Button>
        <Link href="/dashboard/estoque/novo">
          <Button>
            <Plus className="h-4 w-4" /> Cadastrar Moto
          </Button>
        </Link>
      </PageHeader>

      {/* STATS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-keu-black/60">
              Total no estoque
            </span>
          </div>
          <div className="text-3xl font-black">{total}</div>
          <div className="text-xs text-keu-black/60 mt-1">
            {disponiveis} disponíveis para venda
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-keu-black/60">
              Valor investido
            </span>
          </div>
          <div className="text-3xl font-black">{formatCurrency(valorEstoque)}</div>
          <div className="text-xs text-keu-black/60 mt-1">
            Custo total das motos
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-keu-black/60">
              Receita potencial
            </span>
          </div>
          <div className="text-3xl font-black">{formatCurrency(valorPotencial)}</div>
          <div className="text-xs text-keu-black/60 mt-1">
            Se tudo vender pelo anunciado
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-keu-black to-keu-gray text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-white/70">
              Margem bruta
            </span>
          </div>
          <div className="text-3xl font-black text-keu-red">
            {formatCurrency(margemPotencial)}
          </div>
          <div className="text-xs text-white/60 mt-1">
            Lucro potencial estimado
          </div>
        </Card>
      </div>

      {/* TABELA */}
      <Card>
        <div className="p-6 border-b border-keu-black/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Catálogo completo</h2>
              <p className="text-sm text-keu-black/60">
                {total} motos cadastradas no sistema
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                <Input
                  placeholder="Marca, modelo, placa..."
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4" /> Filtros
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="default">Todas</Badge>
            <Badge variant="outline">Venda</Badge>
            <Badge variant="outline">Aluguel</Badge>
            <Badge variant="outline">Ambos</Badge>
            <Badge variant="outline">Disponíveis</Badge>
            <Badge variant="outline">Reservadas</Badge>
            <Badge variant="outline">Vendidas</Badge>
            <Badge variant="outline">Manutenção</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
              <tr>
                <th className="text-left p-4">Moto</th>
                <th className="text-left p-4">Documentação</th>
                <th className="text-left p-4">Técnico</th>
                <th className="text-right p-4">FIPE</th>
                <th className="text-right p-4">Compra</th>
                <th className="text-right p-4">Anunciado</th>
                <th className="text-right p-4">Mínimo</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Entrada</th>
                <th className="text-right p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-keu-black/5">
              {mockMotos.map((m) => (
                <tr key={m.id} className="hover:bg-keu-gray-light transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bike className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-keu-red font-bold">
                          {m.marca}
                        </div>
                        <div className="font-semibold">
                          {m.modelo} {m.versao}
                        </div>
                        <div className="text-xs text-keu-black/60">
                          {m.anoFabricacao}/{m.anoModelo} • {m.cor}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs">
                    {m.placa && <div className="font-mono font-bold">{m.placa}</div>}
                    {m.chassi && (
                      <div className="text-keu-black/60 font-mono">
                        {m.chassi.slice(0, 10)}...
                      </div>
                    )}
                    {m.renavam && (
                      <div className="text-keu-black/60">RV: {m.renavam.slice(0, 8)}...</div>
                    )}
                  </td>
                  <td className="p-4 text-xs">
                    <div>{m.cilindrada}cc · {m.cambio}</div>
                    <div className="text-keu-black/60">
                      {m.km.toLocaleString("pt-BR")} km
                    </div>
                    <div className="text-keu-black/60 capitalize">{m.combustivel}</div>
                  </td>
                  <td className="p-4 text-right text-sm">
                    {formatCurrency(m.valorFipe)}
                  </td>
                  <td className="p-4 text-right text-sm text-keu-black/60">
                    {formatCurrency(m.valorCompra)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-black text-keu-red">
                      {formatCurrency(m.valorAnunciado)}
                    </div>
                  </td>
                  <td className="p-4 text-right text-xs text-keu-black/50">
                    {formatCurrency(m.valorMinimo)}
                  </td>
                  <td className="p-4">
                    <TipoBadge tipo={m.tipo} />
                  </td>
                  <td className="p-4">
                    <StatusMotoBadge status={m.status} />
                  </td>
                  <td className="p-4 text-xs text-keu-black/60">
                    {formatDate(m.dataEntrada)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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

function TipoBadge({ tipo }: { tipo: string }) {
  const map: Record<string, { v: "default" | "info" | "secondary"; l: string }> = {
    venda: { v: "default", l: "Venda" },
    aluguel: { v: "info", l: "Aluguel" },
    ambos: { v: "secondary", l: "Ambos" },
  };
  const conf = map[tipo] || { v: "secondary" as const, l: tipo };
  return (
    <Badge variant={conf.v} className="text-[10px]">
      {conf.l}
    </Badge>
  );
}

function StatusMotoBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { v: "success" | "warning" | "danger" | "info" | "secondary"; l: string }
  > = {
    disponivel: { v: "success", l: "Disponível" },
    reservada: { v: "warning", l: "Reservada" },
    vendida: { v: "danger", l: "Vendida" },
    alugada: { v: "info", l: "Alugada" },
    manutencao: { v: "secondary", l: "Manutenção" },
  };
  const conf = map[status] || { v: "secondary" as const, l: status };
  return (
    <Badge variant={conf.v} className="text-[10px]">
      {conf.l}
    </Badge>
  );
}
