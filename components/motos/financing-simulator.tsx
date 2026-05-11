"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  MessageCircle,
  Zap,
  Scale,
  Sofa,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface Props {
  valorMoto: number;
  modeloNome?: string;
}

const PRAZOS = [12, 24, 36, 48, 60] as const;
type Prazo = (typeof PRAZOS)[number];

export function FinancingSimulator({ valorMoto, modeloNome }: Props) {
  const entradaPadrao = Math.round(valorMoto * 0.2);
  const [entrada, setEntrada] = useState<number>(entradaPadrao);
  const [prazo, setPrazo] = useState<Prazo>(36);
  const [taxa, setTaxa] = useState<number>(1.79);

  const simulacao = useMemo(() => {
    const pv = Math.max(valorMoto - entrada, 0);
    const i = taxa / 100;
    const n = prazo;
    let pmt = 0;
    if (pv > 0 && i > 0 && n > 0) {
      pmt = pv * (i / (1 - Math.pow(1 + i, -n)));
    } else if (pv > 0 && i === 0) {
      pmt = pv / n;
    }
    const totalPago = pmt * n + entrada;
    const totalJuros = totalPago - valorMoto;
    return { pv, pmt, totalPago, totalJuros };
  }, [valorMoto, entrada, taxa, prazo]);

  const percEntrada = valorMoto > 0
    ? Math.round((entrada / valorMoto) * 100)
    : 0;

  const cenarios: { label: string; meses: Prazo; icon: React.ReactNode }[] = [
    { label: "Rápido", meses: 24, icon: <Zap className="h-4 w-4" /> },
    { label: "Equilibrado", meses: 36, icon: <Scale className="h-4 w-4" /> },
    { label: "Confortável", meses: 60, icon: <Sofa className="h-4 w-4" /> },
  ];

  function handleWhatsApp() {
    const linhas = [
      `Olá! Quero enviar uma proposta de financiamento${modeloNome ? ` para a ${modeloNome}` : ""}.`,
      "",
      `Valor da moto: ${formatCurrency(valorMoto)}`,
      `Entrada: ${formatCurrency(entrada)} (${percEntrada}%)`,
      `Prazo: ${prazo}x`,
      `Taxa considerada: ${taxa.toFixed(2)}% a.m.`,
      "",
      `Parcela estimada: ${formatCurrency(simulacao.pmt)}`,
      `Total a pagar: ${formatCurrency(simulacao.totalPago)}`,
      `Total de juros: ${formatCurrency(simulacao.totalJuros)}`,
      "",
      "Podemos seguir com a proposta?",
    ];
    const texto = encodeURIComponent(linhas.join("\n"));
    const url = `https://wa.me/5588998505859?text=${texto}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener");
    }
  }

  return (
    <Card className="overflow-hidden border-keu-red/20">
      <div className="bg-gradient-to-br from-keu-red to-keu-red-dark text-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wide">
            Simulador de financiamento
          </span>
        </div>
        <div className="text-xs text-white/80">
          Simulação ilustrativa (Tabela Price). Sujeita a aprovação da financeira.
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* CENÁRIOS RÁPIDOS */}
        <div className="grid grid-cols-3 gap-2">
          {cenarios.map((c) => {
            const active = prazo === c.meses;
            return (
              <button
                key={c.meses}
                type="button"
                onClick={() => setPrazo(c.meses)}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 py-3 text-xs font-semibold transition ${
                  active
                    ? "border-keu-red bg-keu-red/10 text-keu-red"
                    : "border-keu-black/10 text-keu-black hover:border-keu-red/40"
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
                <span className="text-[10px] font-bold opacity-70">
                  {c.meses}x
                </span>
              </button>
            );
          })}
        </div>

        {/* INPUTS */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="entrada">
              Entrada{" "}
              <span className="text-keu-black/40 font-normal">
                ({percEntrada}%)
              </span>
            </Label>
            <Input
              id="entrada"
              type="number"
              min={0}
              max={valorMoto}
              step={100}
              value={entrada}
              onChange={(e) =>
                setEntrada(Math.max(0, Math.min(Number(e.target.value), valorMoto)))
              }
            />
          </div>
          <div>
            <Label htmlFor="prazo">Prazo</Label>
            <Select
              id="prazo"
              value={prazo}
              onChange={(e) => setPrazo(Number(e.target.value) as Prazo)}
            >
              {PRAZOS.map((p) => (
                <option key={p} value={p}>
                  {p} meses
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="taxa">Taxa (% a.m.)</Label>
            <Input
              id="taxa"
              type="number"
              min={0}
              step={0.01}
              value={taxa}
              onChange={(e) => setTaxa(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>

        {/* PARCELA EM DESTAQUE */}
        <div className="bg-gradient-to-br from-keu-red/10 to-keu-red/0 border border-keu-red/20 rounded-xl p-5 text-center">
          <div className="text-xs uppercase tracking-wide text-keu-black/60 font-semibold">
            {prazo}x de
          </div>
          <div className="text-4xl md:text-5xl font-black text-keu-red leading-tight my-1">
            {formatCurrency(simulacao.pmt)}
          </div>
          <div className="text-xs text-keu-black/60">
            com entrada de {formatCurrency(entrada)}
          </div>
        </div>

        {/* RESUMO */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryBox
            label="Total a pagar"
            value={formatCurrency(simulacao.totalPago)}
          />
          <SummaryBox
            label="Total de juros"
            value={formatCurrency(simulacao.totalJuros)}
            highlight
          />
        </div>

        {/* COMPARATIVO À VISTA */}
        <div className="rounded-lg bg-keu-gray-light p-4 text-sm">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-keu-black/60">Valor à vista</span>
            <span className="font-bold">{formatCurrency(valorMoto)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-keu-black/60">Valor financiado</span>
            <span className="font-bold text-keu-red">
              {formatCurrency(simulacao.totalPago)}
            </span>
          </div>
          {simulacao.totalJuros > 0 && (
            <div className="text-xs text-keu-black/60 mt-2 pt-2 border-t border-keu-black/5">
              Você paga{" "}
              <strong className="text-keu-black">
                {formatCurrency(simulacao.totalJuros)}
              </strong>{" "}
              a mais no financiamento.
            </div>
          )}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleWhatsApp}
          disabled={simulacao.pmt <= 0}
        >
          <MessageCircle className="h-5 w-5" />
          Enviar proposta pelo WhatsApp
        </Button>
      </div>
    </Card>
  );
}

function SummaryBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-keu-black/5 p-3">
      <div className="text-xs text-keu-black/60">{label}</div>
      <div
        className={`text-base font-black ${
          highlight ? "text-keu-red" : "text-keu-black"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
