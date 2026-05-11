"use client";

import { useEffect, useState } from "react";
import {
  Bike,
  Search,
  Filter,
  Copy,
  Share2,
  MessageCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Instagram } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";

// Mock — em produção viria da sessão
const me = {
  codigo: "joao-silva-keu",
  tipoComissao: "percentual" as const,
  comissaoPercentual: 3,
  comissaoFixa: 0,
};

interface Moto {
  _id: string;
  marca: string;
  modelo: string;
  versao?: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  km: number;
  cilindrada: number;
  valorAnunciado: number;
  destaque?: boolean;
  fotos: string[];
  tipo: string;
  status: string;
}

function calcularComissao(valor: number): number {
  return me.tipoComissao === "percentual"
    ? (valor * me.comissaoPercentual) / 100
    : me.comissaoFixa;
}

export default function AfiliadoMotosPage() {
  const [motos, setMotos] = useState<Moto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  useEffect(() => {
    fetch("/api/motos?status=disponivel")
      .then((r) => r.json())
      .then((data) => {
        if (data.motos) setMotos(data.motos);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = motos.filter((m) => {
    if (search) {
      const s = search.toLowerCase();
      if (
        !m.marca.toLowerCase().includes(s) &&
        !m.modelo.toLowerCase().includes(s)
      )
        return false;
    }
    if (filtroTipo && m.tipo !== filtroTipo) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Motos para divulgar"
        description="Cada moto tem um link único pra você compartilhar"
      />

      <Card className="p-5 mb-6 bg-gradient-to-br from-emerald-500/5 to-keu-red/5 border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-white w-10 h-10 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">
              Você ganha{" "}
              {me.tipoComissao === "percentual"
                ? `${me.comissaoPercentual}% de comissão`
                : `${formatCurrency(me.comissaoFixa)} fixo`}{" "}
              em cada venda
            </h3>
            <p className="text-sm text-keu-black/70">
              Veja em cada moto quanto você ganharia se ela for vendida pelo
              seu link.
            </p>
          </div>
        </div>
      </Card>

      {/* FILTROS */}
      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
            <Input
              placeholder="Marca, modelo..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <FilterPill
              label="Todas"
              active={!filtroTipo}
              onClick={() => setFiltroTipo("")}
            />
            <FilterPill
              label="Venda"
              active={filtroTipo === "venda"}
              onClick={() => setFiltroTipo("venda")}
            />
            <FilterPill
              label="Aluguel"
              active={filtroTipo === "aluguel"}
              onClick={() => setFiltroTipo("aluguel")}
            />
          </div>
        </div>
      </Card>

      {/* CATÁLOGO */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
          <div className="text-sm text-keu-black/60">Carregando motos...</div>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center">
          <Bike className="h-12 w-12 text-keu-black/20 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">Nenhuma moto encontrada</h3>
          <p className="text-sm text-keu-black/60">
            Tente outra busca ou volte mais tarde.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MotoCardAfiliado key={m._id} moto={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MotoCardAfiliado({ moto }: { moto: Moto }) {
  const comissao = calcularComissao(moto.valorAnunciado);
  const linkMoto =
    typeof window !== "undefined"
      ? `${window.location.origin}/m/${me.codigo}/${moto._id}`
      : "";

  function copyLink() {
    navigator.clipboard.writeText(linkMoto);
    alert("Link copiado!");
  }

  function shareWhatsApp() {
    const text = `🏍️ Olha essa ${moto.marca} ${moto.modelo} ${moto.anoModelo}!\n\n${formatCurrency(moto.valorAnunciado)}\n\n${linkMoto}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="aspect-video bg-gradient-to-br from-keu-black to-keu-gray relative">
        {moto.fotos[0] ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={moto.fotos[0]}
            alt={moto.modelo}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Bike className="h-16 w-16 text-keu-red/30" />
          </div>
        )}
        {moto.destaque && (
          <Badge variant="default" className="absolute top-2 left-2">
            ★ Destaque
          </Badge>
        )}
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur rounded-md px-2 py-0.5 text-xs font-bold">
          {moto.anoModelo}
        </div>
      </div>

      <div className="p-4">
        <div className="text-xs font-bold text-keu-red">{moto.marca}</div>
        <h3 className="font-bold leading-tight">
          {moto.modelo} {moto.versao}
        </h3>
        <div className="flex gap-2 text-xs text-keu-black/60 mt-1 mb-3 flex-wrap">
          <span>{moto.cilindrada}cc</span>
          <span>•</span>
          <span>{moto.km.toLocaleString("pt-BR")} km</span>
          <span>•</span>
          <span>{moto.cor}</span>
        </div>

        <div className="border-t border-keu-black/5 pt-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-keu-black/60">Valor da moto:</span>
            <span className="font-bold">
              {formatCurrency(moto.valorAnunciado)}
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">
              Você ganha
            </span>
            <span className="text-xl font-black text-emerald-700">
              {formatCurrency(comissao)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Link</span>
          </Button>
          <Button size="sm" onClick={shareWhatsApp}>
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
          <Button variant="dark" size="sm" onClick={copyLink}>
            <Instagram className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Stories</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
        active
          ? "bg-keu-red text-white"
          : "border border-keu-black/20 text-keu-black hover:bg-keu-gray-light"
      }`}
    >
      {label}
    </button>
  );
}
