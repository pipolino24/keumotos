"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingBag,
  Handshake,
  Plus,
  Bike,
  User,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { mockMotos, mockProprietarios } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AquisicoesPage() {
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "comprada" | "repasse">("todas");

  // Motos compradas (capital próprio) e em repasse
  const comprasERepasses = mockMotos.filter(
    (m) => m.origem === "comprada" || m.origem === "repasse"
  );

  const filtered = comprasERepasses.filter((m) => {
    if (filtro !== "todas" && m.origem !== filtro) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !m.marca.toLowerCase().includes(s) &&
        !m.modelo.toLowerCase().includes(s) &&
        !(m.proprietarioNome ?? "").toLowerCase().includes(s) &&
        !(m.placa ?? "").toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  const totalCompras = comprasERepasses.filter(
    (m) => m.origem === "comprada"
  );
  const totalRepasses = comprasERepasses.filter(
    (m) => m.origem === "repasse"
  );

  const investidoTotal = totalCompras.reduce(
    (s, m) => s + (m.compra?.valorPago ?? m.valorCompra),
    0
  );
  const compromissoRepasse = totalRepasses.reduce(
    (s, m) => s + (m.repasse?.valorCombinadoDono ?? 0),
    0
  );
  const valorAnunciadoRepasse = totalRepasses.reduce(
    (s, m) => s + m.valorAnunciado,
    0
  );
  const lucroPotencialRepasse = valorAnunciadoRepasse - compromissoRepasse;

  return (
    <div>
      <PageHeader
        title="Aquisições"
        description="Compras (capital próprio) e repasses (consignação) — fluxos de entrada de motos"
      >
        <Link href="/dashboard/proprietarios">
          <Button variant="outline">
            <User className="h-4 w-4" /> Proprietários
          </Button>
        </Link>
        <Link href="/dashboard/aquisicoes/nova">
          <Button>
            <Plus className="h-4 w-4" /> Nova aquisição
          </Button>
        </Link>
      </PageHeader>

      <Card className="p-5 mb-6 bg-gradient-to-br from-keu-red/5 to-purple-500/5 border-keu-red/20">
        <div className="flex items-start gap-3">
          <div className="bg-gradient-to-br from-keu-red to-purple-600 text-white w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bike className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold mb-1">Como entram as motos na KEU</h3>
            <p className="text-sm text-keu-black/70">
              <strong>Compra:</strong> KEU paga ao dono e a moto vira estoque
              próprio — lucro integral fica conosco. <strong>Repasse:</strong>{" "}
              dono entrega a moto, KEU vende e devolve o valor combinado,
              ficando com a comissão acordada (% ou fixo). Em ambos os fluxos,
              os documentos e foto do proprietário são registrados.
            </p>
          </div>
        </div>
      </Card>

      {/* STATS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0">
          <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="text-3xl font-black">{totalCompras.length}</div>
          <div className="text-sm text-white/90">Motos compradas</div>
          <div className="text-xs text-white/70 mt-1">
            {formatCurrency(investidoTotal)} investidos
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0">
          <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <Handshake className="h-5 w-5" />
          </div>
          <div className="text-3xl font-black">{totalRepasses.length}</div>
          <div className="text-sm text-white/90">Em repasse</div>
          <div className="text-xs text-white/70 mt-1">
            {formatCurrency(compromissoRepasse)} a devolver aos donos
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="text-3xl font-black">
            {formatCurrency(lucroPotencialRepasse)}
          </div>
          <div className="text-sm text-white/90">Lucro potencial repasse</div>
          <div className="text-xs text-white/70 mt-1">
            se tudo vender pelo anunciado
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <div className="bg-white/20 backdrop-blur w-10 h-10 rounded-lg flex items-center justify-center mb-3">
            <User className="h-5 w-5" />
          </div>
          <div className="text-3xl font-black">{mockProprietarios.length}</div>
          <div className="text-sm text-white/90">Proprietários</div>
          <div className="text-xs text-white/70 mt-1">cadastrados</div>
        </Card>
      </div>

      {/* LISTA */}
      <Card>
        <div className="p-6 border-b border-keu-black/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Aquisições registradas</h2>
              <p className="text-sm text-keu-black/60">
                {filtered.length} motos
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
              <Input
                placeholder="Marca, modelo, dono, placa..."
                className="pl-9 w-72"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Pill
              label={`Todas (${comprasERepasses.length})`}
              active={filtro === "todas"}
              onClick={() => setFiltro("todas")}
            />
            <Pill
              label={`Compradas (${totalCompras.length})`}
              active={filtro === "comprada"}
              onClick={() => setFiltro("comprada")}
              color="red"
            />
            <Pill
              label={`Repasse (${totalRepasses.length})`}
              active={filtro === "repasse"}
              onClick={() => setFiltro("repasse")}
              color="purple"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
              <tr>
                <th className="text-left p-4">Moto</th>
                <th className="text-left p-4">Origem</th>
                <th className="text-left p-4">Proprietário</th>
                <th className="text-right p-4">Valor pago / Combinado</th>
                <th className="text-right p-4">Anunciado</th>
                <th className="text-right p-4">Margem / Comissão</th>
                <th className="text-left p-4">Data</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-keu-black/5">
              {filtered.map((m) => (
                <AquisicaoRow key={m.id} moto={m} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AquisicaoRow({
  moto,
}: {
  moto: (typeof mockMotos)[number];
}) {
  const isRepasse = moto.origem === "repasse";
  const valorAcordo = isRepasse
    ? moto.repasse?.valorCombinadoDono ?? 0
    : moto.compra?.valorPago ?? moto.valorCompra;
  const margem = moto.valorAnunciado - valorAcordo;
  const dataAcordo = isRepasse
    ? moto.repasse?.dataInicioConsignacao
    : moto.compra?.dataAquisicao;

  return (
    <tr className="hover:bg-keu-gray-light transition">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-keu-red/10 text-keu-red w-9 h-9 rounded-lg flex items-center justify-center">
            <Bike className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-keu-red font-bold">{moto.marca}</div>
            <div className="font-semibold text-sm">{moto.modelo}</div>
            <div className="text-xs text-keu-black/60">
              {moto.anoModelo} · {moto.cor}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4">
        {isRepasse ? (
          <Badge
            variant="default"
            className="bg-purple-500 hover:bg-purple-500"
          >
            <Handshake className="h-3 w-3" /> Repasse
          </Badge>
        ) : (
          <Badge variant="default">
            <ShoppingBag className="h-3 w-3" /> Comprada
          </Badge>
        )}
      </td>
      <td className="p-4 text-sm">
        {moto.proprietarioNome ? (
          <>
            <div className="font-semibold">{moto.proprietarioNome}</div>
            <div className="text-xs text-keu-black/60">
              Pagar via {isRepasse ? "venda" : "aquisição"}
            </div>
          </>
        ) : (
          <span className="text-keu-black/40 text-xs">—</span>
        )}
      </td>
      <td className="p-4 text-right font-bold">
        {formatCurrency(valorAcordo)}
      </td>
      <td className="p-4 text-right text-sm">
        {formatCurrency(moto.valorAnunciado)}
      </td>
      <td className="p-4 text-right">
        {isRepasse && moto.repasse ? (
          <div>
            <div className="font-bold text-purple-600">
              {moto.repasse.tipoComissao === "percentual"
                ? `${moto.repasse.comissaoPercentual}%`
                : formatCurrency(moto.repasse.comissaoFixa ?? 0)}
            </div>
            <div className="text-xs text-keu-black/60">comissão da KEU</div>
          </div>
        ) : (
          <div>
            <div className="font-bold text-emerald-600">
              {formatCurrency(margem)}
            </div>
            <div className="text-xs text-keu-black/60">margem bruta</div>
          </div>
        )}
      </td>
      <td className="p-4 text-xs text-keu-black/70">
        <Calendar className="h-3 w-3 inline mr-1" />
        {dataAcordo ? formatDate(String(dataAcordo)) : "—"}
      </td>
      <td className="p-4">
        {isRepasse && moto.repasse?.contratoAssinado ? (
          <Badge variant="success">
            <FileText className="h-3 w-3" /> Contrato OK
          </Badge>
        ) : isRepasse ? (
          <Badge variant="warning">
            <AlertTriangle className="h-3 w-3" /> Sem contrato
          </Badge>
        ) : (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" /> Concluída
          </Badge>
        )}
      </td>
      <td className="p-4 text-right">
        <Button variant="ghost" size="sm">
          Detalhes
        </Button>
      </td>
    </tr>
  );
}

function Pill({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "red" | "purple";
}) {
  const activeColor =
    color === "purple"
      ? "bg-purple-500 text-white"
      : color === "red"
        ? "bg-keu-red text-white"
        : "bg-keu-red text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
        active
          ? activeColor
          : "border border-keu-black/20 text-keu-black hover:bg-keu-gray-light"
      }`}
    >
      {label}
    </button>
  );
}
