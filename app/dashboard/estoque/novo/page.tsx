"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Bike,
  FileText,
  Wrench,
  DollarSign,
  KeyRound,
  Save,
  Info,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { FipeSelector, type FipeResult } from "@/components/ui/fipe-selector";

type MotoForm = {
  marca: string;
  modelo: string;
  versao: string;
  anoFabricacao: number | "";
  anoModelo: number | "";
  cor: string;
  placa: string;
  chassi: string;
  renavam: string;
  numeroMotor: string;
  cilindrada: number | "";
  potencia: string;
  km: number | "";
  combustivel: "" | "gasolina" | "flex" | "eletrica";
  cambio: "" | "manual" | "automatico" | "semi-automatico" | "cvt";
  partida: "" | "eletrica" | "pedal" | "ambas";
  valorFipe: number | "";
  valorCompra: number | "";
  valorAnunciado: number | "";
  valorMinimo: number | "";
  comissao: number | "";
  valorDiaria: number | "";
  valorSemanal: number | "";
  valorMensal: number | "";
  tipo: "venda" | "aluguel" | "ambos";
  status: "disponivel" | "reservada" | "vendida" | "alugada" | "manutencao";
  setor: "multimarcas" | "loca" | "pecas";
  fornecedor: string;
  dataEntrada: string;
  destaque: boolean;
  descricao: string;
  observacoes: string;
  fotos: string[];
};

const initial: MotoForm = {
  marca: "",
  modelo: "",
  versao: "",
  anoFabricacao: "",
  anoModelo: "",
  cor: "",
  placa: "",
  chassi: "",
  renavam: "",
  numeroMotor: "",
  cilindrada: "",
  potencia: "",
  km: "",
  combustivel: "",
  cambio: "",
  partida: "",
  valorFipe: "",
  valorCompra: "",
  valorAnunciado: "",
  valorMinimo: "",
  comissao: "",
  valorDiaria: "",
  valorSemanal: "",
  valorMensal: "",
  tipo: "venda",
  status: "disponivel",
  setor: "multimarcas",
  fornecedor: "",
  dataEntrada: new Date().toISOString().slice(0, 10),
  destaque: false,
  descricao: "",
  observacoes: "",
  fotos: [],
};

export default function NovoMotoPage() {
  const router = useRouter();
  const [form, setForm] = useState<MotoForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof MotoForm>(key: K, value: MotoForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFipeResult(r: FipeResult) {
    const cleanModel = r.modelName.replace(/\s+\/.*$/, "").trim();
    const yearNum = parseInt(r.yearName, 10);
    setForm((prev) => ({
      ...prev,
      marca: capitalizarMarca(r.brandName),
      modelo: cleanModel,
      anoModelo: isNaN(yearNum) ? prev.anoModelo : yearNum,
      anoFabricacao:
        isNaN(yearNum) || prev.anoFabricacao
          ? prev.anoFabricacao
          : yearNum - 1,
      valorFipe: r.priceNumber,
      combustivel: mapearCombustivel(r.fuel),
    }));
  }

  const valorCompraN = typeof form.valorCompra === "number" ? form.valorCompra : 0;
  const valorAnunciadoN =
    typeof form.valorAnunciado === "number" ? form.valorAnunciado : 0;
  const valorMinimoN = typeof form.valorMinimo === "number" ? form.valorMinimo : 0;
  const valorFipeN = typeof form.valorFipe === "number" ? form.valorFipe : 0;

  const margemBruta = valorAnunciadoN - valorCompraN;
  const margemMinima = valorMinimoN - valorCompraN;
  const percentualFipe = valorFipeN
    ? ((valorAnunciadoN / valorFipeN - 1) * 100).toFixed(1)
    : "0";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Campos tipados `number | ""` viram string vazia no JSON.stringify
      // e o Zod do servidor rejeita ("expected number, received string").
      // Converte "" → undefined pra cada chave antes de enviar.
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(form)) {
        payload[k] = v === "" ? undefined : v;
      }
      const res = await fetch("/api/motos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar");
      router.push("/dashboard/estoque");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href="/dashboard/estoque"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao estoque
      </Link>

      <PageHeader
        title="Cadastrar Moto"
        description="Adicione uma nova moto ao estoque"
      >
        <Link href="/dashboard/estoque">
          <Button type="button" variant="outline" disabled={saving}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Salvar moto
            </>
          )}
        </Button>
      </PageHeader>

      {error && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* FIPE */}
          <Card className="p-6 bg-gradient-to-br from-keu-red/5 via-white to-white border-keu-red/20">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-red/10">
              <div className="bg-keu-red text-white w-10 h-10 rounded-lg flex items-center justify-center">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Consulta Tabela FIPE</h2>
                <p className="text-sm text-keu-black/60">
                  Preencha automaticamente marca, modelo, ano e valor FIPE
                </p>
              </div>
            </div>
            <FipeSelector onResult={handleFipeResult} />
          </Card>

          {/* IDENTIFICAÇÃO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
                <Bike className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Identificação</h2>
                <p className="text-sm text-keu-black/60">
                  Marca, modelo e características visuais
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marca" required>Marca</Label>
                <Select
                  id="marca"
                  required
                  value={form.marca}
                  onChange={(e) => set("marca", e.target.value)}
                >
                  <option value="">Selecione...</option>
                  <option>Honda</option>
                  <option>Yamaha</option>
                  <option>Suzuki</option>
                  <option>Kawasaki</option>
                  <option>BMW</option>
                  <option>Ducati</option>
                  <option>Harley-Davidson</option>
                  <option>Royal Enfield</option>
                  <option>Triumph</option>
                  <option>Dafra</option>
                  <option>Shineray</option>
                  <option>Outra</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="modelo" required>Modelo</Label>
                <Input
                  id="modelo"
                  placeholder="Ex: CG 160 Titan"
                  required
                  value={form.modelo}
                  onChange={(e) => set("modelo", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="versao">Versão / Trim</Label>
                <Input
                  id="versao"
                  placeholder="Ex: Start, ABS, Sport"
                  value={form.versao}
                  onChange={(e) => set("versao", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cor" required>Cor</Label>
                <Input
                  id="cor"
                  placeholder="Ex: Vermelha"
                  required
                  value={form.cor}
                  onChange={(e) => set("cor", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="anoFab" required>Ano fabricação</Label>
                <Input
                  id="anoFab"
                  type="number"
                  min="1980"
                  max="2030"
                  placeholder="2024"
                  required
                  value={form.anoFabricacao}
                  onChange={(e) =>
                    set("anoFabricacao", e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>
              <div>
                <Label htmlFor="anoMod" required>Ano modelo</Label>
                <Input
                  id="anoMod"
                  type="number"
                  min="1980"
                  max="2030"
                  placeholder="2025"
                  required
                  value={form.anoModelo}
                  onChange={(e) =>
                    set("anoModelo", e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>
            </div>
          </Card>

          {/* DOCUMENTAÇÃO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Documentação</h2>
                <p className="text-sm text-keu-black/60">
                  Placa, chassi, RENAVAM e número do motor
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="placa">Placa</Label>
                <Input
                  id="placa"
                  placeholder="ABC-1D23"
                  className="font-mono uppercase"
                  maxLength={8}
                  value={form.placa}
                  onChange={(e) => set("placa", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="renavam">RENAVAM</Label>
                <Input
                  id="renavam"
                  placeholder="00000000000"
                  className="font-mono"
                  maxLength={11}
                  value={form.renavam}
                  onChange={(e) => set("renavam", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="chassi">Chassi</Label>
                <Input
                  id="chassi"
                  placeholder="9C2KC2200PR000000"
                  className="font-mono uppercase"
                  maxLength={17}
                  value={form.chassi}
                  onChange={(e) => set("chassi", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label htmlFor="motor">Número do motor</Label>
                <Input
                  id="motor"
                  placeholder="KC22E0000000"
                  className="font-mono"
                  value={form.numeroMotor}
                  onChange={(e) => set("numeroMotor", e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* TÉCNICO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Especificações técnicas</h2>
                <p className="text-sm text-keu-black/60">
                  Motor, câmbio, quilometragem
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cilindrada" required>Cilindrada (cc)</Label>
                <Input
                  id="cilindrada"
                  type="number"
                  placeholder="160"
                  required
                  value={form.cilindrada}
                  onChange={(e) =>
                    set("cilindrada", e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>
              <div>
                <Label htmlFor="potencia">Potência</Label>
                <Input
                  id="potencia"
                  placeholder="Ex: 14.7 cv"
                  value={form.potencia}
                  onChange={(e) => set("potencia", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="km" required>Quilometragem</Label>
                <Input
                  id="km"
                  type="number"
                  min="0"
                  placeholder="0"
                  required
                  value={form.km}
                  onChange={(e) =>
                    set("km", e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>
              <div>
                <Label htmlFor="combustivel" required>Combustível</Label>
                <Select
                  id="combustivel"
                  required
                  value={form.combustivel}
                  onChange={(e) =>
                    set("combustivel", e.target.value as MotoForm["combustivel"])
                  }
                >
                  <option value="">Selecione...</option>
                  <option value="flex">Flex</option>
                  <option value="gasolina">Gasolina</option>
                  <option value="eletrica">Elétrica</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="cambio" required>Câmbio</Label>
                <Select
                  id="cambio"
                  required
                  value={form.cambio}
                  onChange={(e) =>
                    set("cambio", e.target.value as MotoForm["cambio"])
                  }
                >
                  <option value="">Selecione...</option>
                  <option value="manual">Manual</option>
                  <option value="automatico">Automático</option>
                  <option value="semi-automatico">Semi-automático</option>
                  <option value="cvt">CVT</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="partida">Partida</Label>
                <Select
                  id="partida"
                  value={form.partida}
                  onChange={(e) =>
                    set("partida", e.target.value as MotoForm["partida"])
                  }
                >
                  <option value="">Selecione...</option>
                  <option value="eletrica">Elétrica</option>
                  <option value="pedal">Pedal</option>
                  <option value="ambas">Ambas</option>
                </Select>
              </div>
            </div>
          </Card>

          {/* VALORES */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Valores comerciais</h2>
                <p className="text-sm text-keu-black/60">
                  FIPE, custos e preços de venda
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <ValueInput
                id="valorFipe"
                label="Valor FIPE"
                hint="(referência)"
                required
                value={form.valorFipe}
                onChange={(v) => set("valorFipe", v)}
              />
              <ValueInput
                id="valorCompra"
                label="Valor de compra"
                hint="(custo)"
                required
                value={form.valorCompra}
                onChange={(v) => set("valorCompra", v)}
              />
              <ValueInput
                id="valorAnunciado"
                label="Valor anunciado"
                hint="(público)"
                required
                highlight
                value={form.valorAnunciado}
                onChange={(v) => set("valorAnunciado", v)}
              />
              <ValueInput
                id="valorMinimo"
                label="Valor mínimo"
                hint="(não vender abaixo)"
                required
                value={form.valorMinimo}
                onChange={(v) => set("valorMinimo", v)}
              />
              <ValueInput
                id="comissao"
                label="Comissão do vendedor"
                value={form.comissao}
                onChange={(v) => set("comissao", v)}
              />
            </div>

            {(valorCompraN > 0 || valorAnunciadoN > 0) && (
              <div className="bg-gradient-to-br from-keu-gray-light to-white border border-keu-black/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-keu-black/60 uppercase tracking-wider">
                  <Info className="h-3 w-3" /> Análise financeira
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-keu-black/60 mb-1">
                      Margem bruta
                    </div>
                    <div
                      className={`font-black ${
                        margemBruta > 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      R$ {margemBruta.toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-keu-black/60 mb-1">
                      Margem mínima
                    </div>
                    <div
                      className={`font-black ${
                        margemMinima > 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      R$ {margemMinima.toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-keu-black/60 mb-1">vs FIPE</div>
                    <div
                      className={`font-black ${
                        Number(percentualFipe) > 0
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {Number(percentualFipe) > 0 ? "+" : ""}
                      {percentualFipe}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ALUGUEL */}
          {(form.tipo === "aluguel" || form.tipo === "ambos") && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
                <div className="bg-purple-500/10 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Valores de aluguel</h2>
                  <p className="text-sm text-keu-black/60">
                    Diária, semanal, mensal e caução
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <ValueInput
                  id="diaria"
                  label="Diária"
                  value={form.valorDiaria}
                  onChange={(v) => set("valorDiaria", v)}
                />
                <ValueInput
                  id="semanal"
                  label="Semanal"
                  value={form.valorSemanal}
                  onChange={(v) => set("valorSemanal", v)}
                />
                <ValueInput
                  id="mensal"
                  label="Mensal"
                  value={form.valorMensal}
                  onChange={(v) => set("valorMensal", v)}
                />
              </div>
            </Card>
          )}

          {/* DESCRIÇÃO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-gray text-white w-10 h-10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Descrição e observações</h2>
                <p className="text-sm text-keu-black/60">
                  Detalhes adicionais para anúncio
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição pública</Label>
                <Textarea
                  id="descricao"
                  placeholder="Moto em ótimo estado, única dona, todas revisões em dia..."
                  rows={4}
                  value={form.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="observacoes">Observações internas</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações internas (não visíveis ao cliente)"
                  rows={3}
                  value={form.observacoes}
                  onChange={(e) => set("observacoes", e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Configuração</h3>

            <div className="space-y-4">
              <div>
                <Label required>Tipo de operação</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["venda", "aluguel", "ambos"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("tipo", t)}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg border-2 capitalize transition ${
                        form.tipo === t
                          ? "border-keu-red bg-keu-red/5 text-keu-red"
                          : "border-keu-black/10 hover:border-keu-black/30 text-keu-black/60"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="status" required>Status</Label>
                <Select
                  id="status"
                  value={form.status}
                  onChange={(e) =>
                    set("status", e.target.value as MotoForm["status"])
                  }
                >
                  <option value="disponivel">Disponível</option>
                  <option value="reservada">Reservada</option>
                  <option value="vendida">Vendida</option>
                  <option value="alugada">Alugada</option>
                  <option value="manutencao">Em manutenção</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="setor" required>Setor responsável</Label>
                <Select
                  id="setor"
                  value={form.setor}
                  onChange={(e) =>
                    set("setor", e.target.value as MotoForm["setor"])
                  }
                >
                  <option value="multimarcas">KEU Multimarcas (Venda)</option>
                  <option value="loca">KEU Loca Motos (Aluguel)</option>
                  <option value="pecas">KEU Moto Peças</option>
                </Select>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-keu-black/20 text-keu-red focus:ring-keu-red"
                  checked={form.destaque}
                  onChange={(e) => set("destaque", e.target.checked)}
                />
                <span>Marcar como destaque</span>
                <Badge variant="default" className="ml-auto">★</Badge>
              </label>
            </div>
          </Card>

          {/* FOTOS COM COMPRESSÃO */}
          <Card className="p-6">
            <h3 className="font-bold mb-1">Fotos da moto</h3>
            <p className="text-xs text-keu-black/60 mb-4">
              Imagens são comprimidas automaticamente antes de salvar (~200KB)
            </p>
            <ImageUpload
              value={form.fotos}
              onChange={(fotos) => set("fotos", fotos)}
              max={8}
              maxSizeKB={250}
              maxWidth={1400}
              quality={0.78}
              hint="JPG, PNG, HEIC. Comprime automaticamente para WebP ~250KB"
            />
            <p className="text-xs text-keu-black/50 mt-3">
              Recomendamos pelo menos 4 fotos: frente, lateral, traseira e
              painel.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4">Origem</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fornecedor">Fornecedor / Antigo dono</Label>
                <Input
                  id="fornecedor"
                  placeholder="Nome do fornecedor"
                  value={form.fornecedor}
                  onChange={(e) => set("fornecedor", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="entrada">Data de entrada</Label>
                <Input
                  id="entrada"
                  type="date"
                  value={form.dataEntrada}
                  onChange={(e) => set("dataEntrada", e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
        <Button type="button" variant="outline" disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Cadastrar moto
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function capitalizarMarca(nome: string): string {
  const upper = nome.toUpperCase();
  const map: Record<string, string> = {
    HONDA: "Honda",
    YAMAHA: "Yamaha",
    SUZUKI: "Suzuki",
    KAWASAKI: "Kawasaki",
    BMW: "BMW",
    DUCATI: "Ducati",
    "HARLEY-DAVIDSON": "Harley-Davidson",
    "ROYAL ENFIELD": "Royal Enfield",
    TRIUMPH: "Triumph",
    DAFRA: "Dafra",
    SHINERAY: "Shineray",
  };
  return map[upper] ?? nome;
}

function mapearCombustivel(
  fuel: string
): "" | "gasolina" | "flex" | "eletrica" {
  const f = fuel.toLowerCase();
  if (f.includes("flex") || f.includes("álcool") || f.includes("alcool"))
    return "flex";
  if (f.includes("elét") || f.includes("elet")) return "eletrica";
  return "gasolina";
}

function ValueInput({
  id,
  label,
  hint,
  required,
  highlight,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  highlight?: boolean;
  value: number | "";
  onChange: (v: number | "") => void;
}) {
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
        {hint && (
          <span
            className={`text-xs ml-1 font-normal ${
              highlight ? "text-keu-red" : "text-keu-black/50"
            }`}
          >
            {hint}
          </span>
        )}
      </Label>
      <div className="relative">
        <span
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
            highlight ? "text-keu-red" : "text-keu-black/40"
          }`}
        >
          R$
        </span>
        <Input
          id={id}
          type="number"
          min="0"
          // step="any" aceita qualquer valor numérico (incluindo centavos).
          // step="100" rejeitava valores FIPE reais como R$ 11.814,00 com
          // a mensagem "valores válidos próximos são 11800 e 11900".
          step="any"
          placeholder="0,00"
          className={`pl-9 ${
            highlight ? "border-keu-red/30 focus:border-keu-red" : ""
          }`}
          required={required}
          value={value}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : "")
          }
        />
      </div>
    </div>
  );
}
