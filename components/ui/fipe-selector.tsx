"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FipeOption {
  code: string;
  name: string;
}

export interface FipeResult {
  brandCode: string;
  brandName: string;
  modelCode: string;
  modelName: string;
  yearCode: string;
  yearName: string;
  price: string;
  priceNumber: number;
  fuel: string;
  codeFipe: string;
  referenceMonth: string;
}

interface FipeSelectorProps {
  onResult: (result: FipeResult) => void;
  className?: string;
}

export function FipeSelector({ onResult, className }: FipeSelectorProps) {
  const [brands, setBrands] = useState<FipeOption[]>([]);
  const [models, setModels] = useState<FipeOption[]>([]);
  const [years, setYears] = useState<FipeOption[]>([]);
  const [brandCode, setBrandCode] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [yearCode, setYearCode] = useState("");
  const [loading, setLoading] = useState<
    "brands" | "models" | "years" | "value" | null
  >("brands");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FipeResult | null>(null);

  // Marcas
  useEffect(() => {
    let cancelled = false;
    setLoading("brands");
    fetch("/api/fipe?type=motorcycles")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setBrands(data.brands);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(null));
    return () => {
      cancelled = true;
    };
  }, []);

  // Modelos quando marca muda
  useEffect(() => {
    if (!brandCode) {
      setModels([]);
      setModelCode("");
      return;
    }
    let cancelled = false;
    setLoading("models");
    setError(null);
    setModelCode("");
    setYearCode("");
    setYears([]);
    fetch(`/api/fipe?type=motorcycles&brand=${brandCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setModels(data.models);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(null));
    return () => {
      cancelled = true;
    };
  }, [brandCode]);

  // Anos quando modelo muda
  useEffect(() => {
    if (!modelCode) {
      setYears([]);
      setYearCode("");
      return;
    }
    let cancelled = false;
    setLoading("years");
    setError(null);
    setYearCode("");
    fetch(`/api/fipe?type=motorcycles&brand=${brandCode}&model=${modelCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setYears(data.years);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(null));
    return () => {
      cancelled = true;
    };
  }, [brandCode, modelCode]);

  async function consultar() {
    if (!brandCode || !modelCode || !yearCode) return;
    setLoading("value");
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/fipe?type=motorcycles&brand=${brandCode}&model=${modelCode}&year=${yearCode}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const brand = brands.find((b) => b.code === brandCode);
      const model = models.find((m) => m.code === modelCode);
      const year = years.find((y) => y.code === yearCode);

      const r: FipeResult = {
        brandCode,
        brandName: brand?.name ?? data.brand,
        modelCode,
        modelName: model?.name ?? data.model,
        yearCode,
        yearName: year?.name ?? String(data.modelYear),
        price: data.price,
        priceNumber: data.priceNumber,
        fuel: data.fuel,
        codeFipe: data.codeFipe,
        referenceMonth: data.referenceMonth,
      };
      setResult(r);
      onResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao consultar FIPE");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <Label htmlFor="fipe-brand">Marca</Label>
          <Select
            id="fipe-brand"
            value={brandCode}
            onChange={(e) => setBrandCode(e.target.value)}
            disabled={loading === "brands"}
          >
            <option value="">
              {loading === "brands" ? "Carregando..." : "Selecione..."}
            </option>
            {brands.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="fipe-model">Modelo</Label>
          <Select
            id="fipe-model"
            value={modelCode}
            onChange={(e) => setModelCode(e.target.value)}
            disabled={!brandCode || loading === "models"}
          >
            <option value="">
              {loading === "models"
                ? "Carregando..."
                : !brandCode
                  ? "Escolha a marca"
                  : "Selecione..."}
            </option>
            {models.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="fipe-year">Ano</Label>
          <Select
            id="fipe-year"
            value={yearCode}
            onChange={(e) => setYearCode(e.target.value)}
            disabled={!modelCode || loading === "years"}
          >
            <option value="">
              {loading === "years"
                ? "Carregando..."
                : !modelCode
                  ? "Escolha o modelo"
                  : "Selecione..."}
            </option>
            {years.map((y) => (
              <option key={y.code} value={y.code}>
                {y.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Button
        type="button"
        onClick={consultar}
        disabled={!yearCode || loading === "value"}
        className="w-full"
        variant={result ? "outline" : "default"}
      >
        {loading === "value" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Consultando FIPE...
          </>
        ) : result ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> Atualizar consulta
          </>
        ) : (
          <>
            <Search className="h-4 w-4" /> Consultar valor FIPE
          </>
        )}
      </Button>

      {error && (
        <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Valor FIPE encontrado
            </span>
          </div>
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <div className="font-bold text-keu-black">
                {result.brandName} · {result.modelName}
              </div>
              <div className="text-xs text-keu-black/60">
                Ano {result.yearName} · {result.fuel} · Código FIPE{" "}
                {result.codeFipe}
              </div>
              <div className="text-[10px] text-keu-black/50 mt-0.5">
                Referência: {result.referenceMonth}
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-700">
              {result.price}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
