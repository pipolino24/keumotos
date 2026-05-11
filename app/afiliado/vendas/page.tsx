"use client";

import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";

const me = {
  comissaoAcumulada: 1850,
  comissaoPaga: 950,
  comissaoPendente: 900,
};

const historico = [
  {
    id: "1",
    moto: "Honda CG 160 Titan 2024",
    cliente: "João Pedro Santos",
    data: "2026-05-08",
    valorVenda: 15200,
    valorComissao: 456,
    status: "vendido",
    pago: false,
  },
  {
    id: "2",
    moto: "Honda Pop 110i 2022",
    cliente: "Camila Ferreira",
    data: "2026-04-22",
    valorVenda: 9500,
    valorComissao: 285,
    status: "vendido",
    pago: true,
    pagoEm: "2026-04-30",
  },
  {
    id: "3",
    moto: "Yamaha Factor 150",
    cliente: "Ricardo Almeida",
    data: "2026-04-15",
    valorVenda: 14200,
    valorComissao: 426,
    status: "vendido",
    pago: true,
    pagoEm: "2026-04-30",
  },
  {
    id: "4",
    moto: "Honda Biz 125",
    cliente: "Beatriz Cardoso",
    data: "2026-04-02",
    valorVenda: 11500,
    valorComissao: 345,
    status: "vendido",
    pago: true,
    pagoEm: "2026-04-15",
  },
];

export default function MinhasComissoesPage() {
  return (
    <div>
      <PageHeader
        title="Minhas comissões"
        description="Histórico completo de vendas e pagamentos"
      />

      {/* STATS */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0">
          <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="text-3xl font-black">
            {formatCurrency(me.comissaoAcumulada)}
          </div>
          <div className="text-sm text-white/90">Total acumulado</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="text-3xl font-black">
            {formatCurrency(me.comissaoPaga)}
          </div>
          <div className="text-sm text-white/90">Já recebido</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-3xl font-black">
            {formatCurrency(me.comissaoPendente)}
          </div>
          <div className="text-sm text-white/90">A receber</div>
        </Card>
      </div>

      {/* HISTÓRICO */}
      <Card>
        <div className="p-5 border-b border-keu-black/5">
          <h2 className="font-bold text-lg">Histórico de comissões</h2>
          <p className="text-sm text-keu-black/60">
            Cada venda fechada pelo seu link aparece aqui
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
              <tr>
                <th className="text-left p-4">Moto</th>
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Data venda</th>
                <th className="text-right p-4">Valor venda</th>
                <th className="text-right p-4">Sua comissão</th>
                <th className="text-left p-4">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-keu-black/5">
              {historico.map((h) => (
                <tr key={h.id} className="hover:bg-keu-gray-light transition">
                  <td className="p-4 font-semibold">{h.moto}</td>
                  <td className="p-4 text-sm">{h.cliente}</td>
                  <td className="p-4 text-sm text-keu-black/70">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {formatDate(h.data)}
                    </div>
                  </td>
                  <td className="p-4 text-right font-semibold">
                    {formatCurrency(h.valorVenda)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-bold text-emerald-600 text-lg">
                      {formatCurrency(h.valorComissao)}
                    </div>
                  </td>
                  <td className="p-4">
                    {h.pago ? (
                      <div>
                        <Badge variant="success">
                          <CheckCircle2 className="h-3 w-3" /> Pago
                        </Badge>
                        {h.pagoEm && (
                          <div className="text-xs text-keu-black/60 mt-1">
                            em {formatDate(h.pagoEm)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="h-3 w-3" /> Pendente
                      </Badge>
                    )}
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
