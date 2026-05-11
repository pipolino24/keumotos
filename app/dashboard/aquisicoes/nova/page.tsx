"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ShoppingBag,
  Handshake,
  Save,
  Loader2,
  AlertCircle,
  User,
  Bike,
  FileText,
  Banknote,
  DollarSign,
  Calendar,
  Camera,
  Info,
  Percent,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import { FipeSelector, type FipeResult } from "@/components/ui/fipe-selector";
import { formatCurrency } from "@/lib/utils";

type TipoAquisicao = "comprada" | "repasse";

type AquisicaoForm = {
  // Tipo
  tipo: TipoAquisicao;

  // Proprietário
  propNome: string;
  propCpf: string;
  propRg: string;
  propCnh: string;
  propTelefone: string;
  propWhatsapp: string;
  propEmail: string;
  propCep: string;
  propEndereco: string;
  propNumero: string;
  propBairro: string;
  propCidade: string;
  propEstado: string;
  propPixTipo: "" | "cpf" | "email" | "telefone" | "aleatoria";
  propPixChave: string;
  propBanco: string;
  propAgencia: string;
  propConta: string;

  // Documentos
  fotoPessoal: string[];
  fotoCnh: string[];
  fotoComprovanteResidencia: string[];
  fotoDocMoto: string[];

  // Moto
  marca: string;
  modelo: string;
  anoFabricacao: number | "";
  anoModelo: number | "";
  cor: string;
  placa: string;
  chassi: string;
  renavam: string;
  numeroMotor: string;
  cilindrada: number | "";
  km: number | "";
  combustivel: "" | "gasolina" | "flex" | "eletrica";
  cambio: "" | "manual" | "automatico" | "semi-automatico" | "cvt";
  valorFipe: number | "";
  fotosMoto: string[];

  // Acordo COMPRA
  compraValor: number | "";
  compraFormaPagamento: "pix" | "dinheiro" | "transferencia" | "troca" | "cheque";
  compraNota: string;
  compraData: string;

  // Acordo REPASSE
  repasseValorCombinado: number | "";
  repasseTipoComissao: "percentual" | "fixo";
  repasseComissaoPercentual: number | "";
  repasseComissaoFixa: number | "";
  repassePrazoDias: number | "";
  repasseDataInicio: string;
  repasseContratoAssinado: boolean;
  repasseObservacoes: string;

  // Para anunciar
  valorAnunciado: number | "";
  valorMinimo: number | "";

  observacoes: string;
};

const initial: AquisicaoForm = {
  tipo: "comprada",
  propNome: "",
  propCpf: "",
  propRg: "",
  propCnh: "",
  propTelefone: "",
  propWhatsapp: "",
  propEmail: "",
  propCep: "",
  propEndereco: "",
  propNumero: "",
  propBairro: "",
  propCidade: "",
  propEstado: "",
  propPixTipo: "",
  propPixChave: "",
  propBanco: "",
  propAgencia: "",
  propConta: "",
  fotoPessoal: [],
  fotoCnh: [],
  fotoComprovanteResidencia: [],
  fotoDocMoto: [],
  marca: "",
  modelo: "",
  anoFabricacao: "",
  anoModelo: "",
  cor: "",
  placa: "",
  chassi: "",
  renavam: "",
  numeroMotor: "",
  cilindrada: "",
  km: "",
  combustivel: "",
  cambio: "",
  valorFipe: "",
  fotosMoto: [],
  compraValor: "",
  compraFormaPagamento: "pix",
  compraNota: "",
  compraData: new Date().toISOString().slice(0, 10),
  repasseValorCombinado: "",
  repasseTipoComissao: "percentual",
  repasseComissaoPercentual: 7,
  repasseComissaoFixa: "",
  repassePrazoDias: 60,
  repasseDataInicio: new Date().toISOString().slice(0, 10),
  repasseContratoAssinado: false,
  repasseObservacoes: "",
  valorAnunciado: "",
  valorMinimo: "",
  observacoes: "",
};

export default function NovaAquisicaoPage() {
  const router = useRouter();
  const [form, setForm] = useState<AquisicaoForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AquisicaoForm>(
    key: K,
    value: AquisicaoForm[K]
  ) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function handleFipe(r: FipeResult) {
    const cleanModel = r.modelName.replace(/\s+\/.*$/, "").trim();
    const yearNum = parseInt(r.yearName, 10);
    setForm((p) => ({
      ...p,
      marca: r.brandName.charAt(0) + r.brandName.slice(1).toLowerCase(),
      modelo: cleanModel,
      anoModelo: isNaN(yearNum) ? p.anoModelo : yearNum,
      anoFabricacao: isNaN(yearNum) || p.anoFabricacao ? p.anoFabricacao : yearNum - 1,
      valorFipe: r.priceNumber,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // 1. Cria proprietário
      const propRes = await fetch("/api/proprietarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.propNome,
          cpf: form.propCpf,
          rg: form.propRg || undefined,
          cnh: form.propCnh || undefined,
          telefone: form.propTelefone,
          whatsapp: form.propWhatsapp || undefined,
          email: form.propEmail || undefined,
          cep: form.propCep,
          endereco: form.propEndereco,
          numero: form.propNumero,
          bairro: form.propBairro,
          cidade: form.propCidade,
          estado: form.propEstado,
          pixTipo: form.propPixTipo || undefined,
          pixChave: form.propPixChave || undefined,
          banco: form.propBanco || undefined,
          agencia: form.propAgencia || undefined,
          conta: form.propConta || undefined,
          fotoPessoal: form.fotoPessoal[0],
          fotoCnh: form.fotoCnh[0],
          fotoComprovanteResidencia: form.fotoComprovanteResidencia[0],
          fotoDocMoto: form.fotoDocMoto[0],
        }),
      });
      const propJson = await propRes.json();
      if (!propRes.ok && propRes.status !== 409) {
        throw new Error(propJson.error ?? "Erro ao salvar proprietário");
      }
      const proprietarioId =
        propJson.proprietario?._id ?? propJson.proprietario?.id;

      // 2. Cria a moto vinculada
      const motoPayload: Record<string, unknown> = {
        marca: form.marca,
        modelo: form.modelo,
        anoFabricacao: form.anoFabricacao,
        anoModelo: form.anoModelo,
        cor: form.cor,
        placa: form.placa || undefined,
        chassi: form.chassi || undefined,
        renavam: form.renavam || undefined,
        numeroMotor: form.numeroMotor || undefined,
        cilindrada: form.cilindrada,
        km: form.km || 0,
        combustivel: form.combustivel,
        cambio: form.cambio,
        valorFipe: form.valorFipe || 0,
        valorAnunciado: form.valorAnunciado || 0,
        valorMinimo: form.valorMinimo || 0,
        valorCompra:
          form.tipo === "comprada" ? form.compraValor || 0 : 0,
        origem: form.tipo,
        tipo: "venda",
        status: "disponivel",
        setor: "multimarcas",
        proprietarioId,
        proprietarioNome: form.propNome,
        fotos: form.fotosMoto,
        observacoes: form.observacoes,
      };

      if (form.tipo === "comprada") {
        motoPayload.compra = {
          valorPago: form.compraValor,
          formaPagamento: form.compraFormaPagamento,
          numeroNotaFiscal: form.compraNota || undefined,
          dataAquisicao: form.compraData,
        };
      } else {
        motoPayload.repasse = {
          valorCombinadoDono: form.repasseValorCombinado,
          tipoComissao: form.repasseTipoComissao,
          comissaoPercentual:
            form.repasseTipoComissao === "percentual"
              ? form.repasseComissaoPercentual
              : undefined,
          comissaoFixa:
            form.repasseTipoComissao === "fixo"
              ? form.repasseComissaoFixa
              : undefined,
          prazoConsignacao: form.repassePrazoDias,
          dataInicioConsignacao: form.repasseDataInicio,
          contratoAssinado: form.repasseContratoAssinado,
          observacoesAcordo: form.repasseObservacoes,
        };
      }

      const motoRes = await fetch("/api/motos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(motoPayload),
      });
      const motoJson = await motoRes.json();
      if (!motoRes.ok) throw new Error(motoJson.error ?? "Erro ao salvar moto");

      router.push("/dashboard/aquisicoes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setSaving(false);
    }
  }

  // Simulação repasse
  const valAcordoNum =
    typeof form.repasseValorCombinado === "number"
      ? form.repasseValorCombinado
      : 0;
  const valAnunciadoNum =
    typeof form.valorAnunciado === "number" ? form.valorAnunciado : 0;
  const comissaoSimulada =
    form.repasseTipoComissao === "percentual"
      ? (valAnunciadoNum *
          (typeof form.repasseComissaoPercentual === "number"
            ? form.repasseComissaoPercentual
            : 0)) /
        100
      : typeof form.repasseComissaoFixa === "number"
        ? form.repasseComissaoFixa
        : 0;

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href="/dashboard/aquisicoes"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para aquisições
      </Link>

      <PageHeader
        title="Nova aquisição"
        description="Registre a entrada de uma moto: compra direta ou repasse"
      >
        <Button type="button" variant="outline" disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Salvar aquisição
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

      {/* TIPO DE AQUISIÇÃO */}
      <Card className="p-6 mb-6">
        <h2 className="font-bold mb-4">Tipo de aquisição</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => set("tipo", "comprada")}
            className={`p-5 rounded-xl border-2 text-left transition ${
              form.tipo === "comprada"
                ? "border-keu-red bg-keu-red/5"
                : "border-keu-black/10 hover:border-keu-black/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  form.tipo === "comprada"
                    ? "bg-keu-red text-white"
                    : "bg-keu-gray-light text-keu-black/60"
                }`}
              >
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">Compra direta</div>
                <div className="text-xs text-keu-black/60">
                  KEU paga ao dono e fica com a moto
                </div>
              </div>
            </div>
            <p className="text-xs text-keu-black/70 mt-2">
              Lucro integral fica para a KEU. Capital próprio investido.
              Documentação transferida para a empresa.
            </p>
          </button>

          <button
            type="button"
            onClick={() => set("tipo", "repasse")}
            className={`p-5 rounded-xl border-2 text-left transition ${
              form.tipo === "repasse"
                ? "border-purple-500 bg-purple-50"
                : "border-keu-black/10 hover:border-keu-black/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  form.tipo === "repasse"
                    ? "bg-purple-500 text-white"
                    : "bg-keu-gray-light text-keu-black/60"
                }`}
              >
                <Handshake className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">Repasse / Consignação</div>
                <div className="text-xs text-keu-black/60">
                  KEU vende e ganha % combinado
                </div>
              </div>
            </div>
            <p className="text-xs text-keu-black/70 mt-2">
              Dono entrega a moto. KEU anuncia e vende. Após a venda, devolve
              o valor combinado ao dono e fica com a comissão.
            </p>
          </button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* PROPRIETÁRIO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Dados do proprietário</h2>
                <p className="text-sm text-keu-black/60">
                  Quem está {form.tipo === "comprada" ? "vendendo" : "entregando"}{" "}
                  a moto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="propNome" required>Nome completo</Label>
                <Input
                  id="propNome"
                  required
                  placeholder="João Silva"
                  value={form.propNome}
                  onChange={(e) => set("propNome", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="propCpf" required>CPF</Label>
                <Input
                  id="propCpf"
                  required
                  placeholder="000.000.000-00"
                  className="font-mono"
                  value={form.propCpf}
                  onChange={(e) => set("propCpf", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="propRg">RG</Label>
                <Input
                  id="propRg"
                  placeholder="0000000 SSP-CE"
                  value={form.propRg}
                  onChange={(e) => set("propRg", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="propCnh">CNH</Label>
                <Input
                  id="propCnh"
                  placeholder="00000000000"
                  className="font-mono"
                  value={form.propCnh}
                  onChange={(e) => set("propCnh", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="propTelefone" required>Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="propTelefone"
                    required
                    placeholder="(88) 99999-9999"
                    className="pl-10"
                    value={form.propTelefone}
                    onChange={(e) => set("propTelefone", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="propWhatsapp">WhatsApp</Label>
                <Input
                  id="propWhatsapp"
                  placeholder="(88) 99999-9999"
                  value={form.propWhatsapp}
                  onChange={(e) => set("propWhatsapp", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="propEmail">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="propEmail"
                    type="email"
                    placeholder="email@exemplo.com"
                    className="pl-10"
                    value={form.propEmail}
                    onChange={(e) => set("propEmail", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-keu-black/5">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <MapPin className="h-4 w-4" /> Endereço
              </div>
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="propCep">CEP</Label>
                  <Input
                    id="propCep"
                    placeholder="00000-000"
                    value={form.propCep}
                    onChange={(e) => set("propCep", e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="propEnd">Endereço</Label>
                  <Input
                    id="propEnd"
                    placeholder="Rua/Av..."
                    value={form.propEndereco}
                    onChange={(e) => set("propEndereco", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="propNum">Número</Label>
                  <Input
                    id="propNum"
                    value={form.propNumero}
                    onChange={(e) => set("propNumero", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="propBairro">Bairro</Label>
                  <Input
                    id="propBairro"
                    value={form.propBairro}
                    onChange={(e) => set("propBairro", e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor="propCidade">Cidade</Label>
                  <Input
                    id="propCidade"
                    value={form.propCidade}
                    onChange={(e) => set("propCidade", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="propEstado">UF</Label>
                  <Input
                    id="propEstado"
                    maxLength={2}
                    className="uppercase"
                    value={form.propEstado}
                    onChange={(e) =>
                      set("propEstado", e.target.value.toUpperCase())
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-keu-black/5">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <CreditCard className="h-4 w-4" /> Dados para receber
                {form.tipo === "repasse" && (
                  <Badge variant="warning" className="text-[10px]">
                    Necessário para pagar após venda
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de chave PIX</Label>
                  <Select
                    value={form.propPixTipo}
                    onChange={(e) =>
                      set("propPixTipo", e.target.value as AquisicaoForm["propPixTipo"])
                    }
                  >
                    <option value="">Selecione...</option>
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Aleatória</option>
                  </Select>
                </div>
                <div>
                  <Label>Chave PIX</Label>
                  <Input
                    value={form.propPixChave}
                    onChange={(e) => set("propPixChave", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Banco</Label>
                  <Input
                    value={form.propBanco}
                    onChange={(e) => set("propBanco", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Agência</Label>
                    <Input
                      value={form.propAgencia}
                      onChange={(e) => set("propAgencia", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Conta</Label>
                    <Input
                      value={form.propConta}
                      onChange={(e) => set("propConta", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* MOTO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
                <Bike className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Dados da moto</h2>
                <p className="text-sm text-keu-black/60">
                  Identificação, documentação e estado da moto
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-keu-red/5 border border-keu-red/20 rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-keu-red mb-2">
                Consulta FIPE
              </div>
              <FipeSelector onResult={handleFipe} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label required>Marca</Label>
                <Input
                  required
                  value={form.marca}
                  onChange={(e) => set("marca", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label required>Modelo</Label>
                <Input
                  required
                  value={form.modelo}
                  onChange={(e) => set("modelo", e.target.value)}
                />
              </div>
              <div>
                <Label required>Ano fab.</Label>
                <Input
                  type="number"
                  required
                  value={form.anoFabricacao}
                  onChange={(e) =>
                    set(
                      "anoFabricacao",
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                />
              </div>
              <div>
                <Label required>Ano modelo</Label>
                <Input
                  type="number"
                  required
                  value={form.anoModelo}
                  onChange={(e) =>
                    set(
                      "anoModelo",
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                />
              </div>
              <div>
                <Label required>Cor</Label>
                <Input
                  required
                  value={form.cor}
                  onChange={(e) => set("cor", e.target.value)}
                />
              </div>
              <div>
                <Label>Placa</Label>
                <Input
                  className="font-mono uppercase"
                  value={form.placa}
                  onChange={(e) => set("placa", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label>RENAVAM</Label>
                <Input
                  className="font-mono"
                  value={form.renavam}
                  onChange={(e) => set("renavam", e.target.value)}
                />
              </div>
              <div>
                <Label>Chassi</Label>
                <Input
                  className="font-mono uppercase"
                  value={form.chassi}
                  onChange={(e) => set("chassi", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <Label required>Cilindrada</Label>
                <Input
                  type="number"
                  required
                  value={form.cilindrada}
                  onChange={(e) =>
                    set(
                      "cilindrada",
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                />
              </div>
              <div>
                <Label required>KM</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={form.km}
                  onChange={(e) =>
                    set("km", e.target.value ? Number(e.target.value) : "")
                  }
                />
              </div>
              <div>
                <Label required>Combustível</Label>
                <Select
                  required
                  value={form.combustivel}
                  onChange={(e) =>
                    set(
                      "combustivel",
                      e.target.value as AquisicaoForm["combustivel"]
                    )
                  }
                >
                  <option value="">Selecione...</option>
                  <option value="flex">Flex</option>
                  <option value="gasolina">Gasolina</option>
                  <option value="eletrica">Elétrica</option>
                </Select>
              </div>
              <div>
                <Label required>Câmbio</Label>
                <Select
                  required
                  value={form.cambio}
                  onChange={(e) =>
                    set("cambio", e.target.value as AquisicaoForm["cambio"])
                  }
                >
                  <option value="">Selecione...</option>
                  <option value="manual">Manual</option>
                  <option value="automatico">Automático</option>
                  <option value="semi-automatico">Semi-automático</option>
                  <option value="cvt">CVT</option>
                </Select>
              </div>
            </div>
          </Card>

          {/* ACORDO COMERCIAL */}
          {form.tipo === "comprada" ? (
            <Card className="p-6 border-keu-red/30 bg-gradient-to-br from-keu-red/5 to-white">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-red/10">
                <div className="bg-keu-red text-white w-10 h-10 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Acordo de compra</h2>
                  <p className="text-sm text-keu-black/60">
                    Quanto a KEU pagou ao proprietário
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Valor pago</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                      R$
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      required
                      className="pl-9"
                      value={form.compraValor}
                      onChange={(e) =>
                        set(
                          "compraValor",
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label required>Forma de pagamento</Label>
                  <Select
                    value={form.compraFormaPagamento}
                    onChange={(e) =>
                      set(
                        "compraFormaPagamento",
                        e.target.value as AquisicaoForm["compraFormaPagamento"]
                      )
                    }
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">Transferência</option>
                    <option value="troca">Troca por outra moto</option>
                    <option value="cheque">Cheque</option>
                  </Select>
                </div>
                <div>
                  <Label>Nota fiscal / Recibo</Label>
                  <Input
                    placeholder="Nº do documento"
                    value={form.compraNota}
                    onChange={(e) => set("compraNota", e.target.value)}
                  />
                </div>
                <div>
                  <Label required>Data da aquisição</Label>
                  <Input
                    type="date"
                    required
                    value={form.compraData}
                    onChange={(e) => set("compraData", e.target.value)}
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 border-purple-500/30 bg-gradient-to-br from-purple-50 to-white">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-200">
                <div className="bg-purple-500 text-white w-10 h-10 rounded-lg flex items-center justify-center">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Acordo de repasse</h2>
                  <p className="text-sm text-keu-black/60">
                    Valor combinado com o proprietário e comissão da KEU
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label required>Valor combinado com o dono (R$)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                      R$
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      required
                      placeholder="Valor que o dono receberá"
                      className="pl-9"
                      value={form.repasseValorCombinado}
                      onChange={(e) =>
                        set(
                          "repasseValorCombinado",
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    />
                  </div>
                  <p className="text-xs text-keu-black/60 mt-1">
                    Valor que será repassado ao proprietário quando a moto for
                    vendida.
                  </p>
                </div>

                <div className="col-span-2">
                  <Label required>Tipo de comissão da KEU</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => set("repasseTipoComissao", "percentual")}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        form.repasseTipoComissao === "percentual"
                          ? "border-purple-500 bg-purple-50"
                          : "border-keu-black/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <Percent className="h-3.5 w-3.5" /> Percentual
                      </div>
                      <div className="text-xs text-keu-black/60">
                        % do valor de venda
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => set("repasseTipoComissao", "fixo")}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        form.repasseTipoComissao === "fixo"
                          ? "border-purple-500 bg-purple-50"
                          : "border-keu-black/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <DollarSign className="h-3.5 w-3.5" /> Fixo
                      </div>
                      <div className="text-xs text-keu-black/60">
                        Valor em R$
                      </div>
                    </button>
                  </div>
                </div>

                {form.repasseTipoComissao === "percentual" ? (
                  <div>
                    <Label required>Percentual (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      required
                      value={form.repasseComissaoPercentual}
                      onChange={(e) =>
                        set(
                          "repasseComissaoPercentual",
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    />
                  </div>
                ) : (
                  <div>
                    <Label required>Valor fixo (R$)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                        R$
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        required
                        className="pl-9"
                        value={form.repasseComissaoFixa}
                        onChange={(e) =>
                          set(
                            "repasseComissaoFixa",
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label required>Prazo (dias)</Label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={form.repassePrazoDias}
                    onChange={(e) =>
                      set(
                        "repassePrazoDias",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>

                <div>
                  <Label required>Data de início</Label>
                  <Input
                    type="date"
                    required
                    value={form.repasseDataInicio}
                    onChange={(e) => set("repasseDataInicio", e.target.value)}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium pt-6 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-keu-black/20 text-purple-500 focus:ring-purple-500"
                      checked={form.repasseContratoAssinado}
                      onChange={(e) =>
                        set("repasseContratoAssinado", e.target.checked)
                      }
                    />
                    <span>Contrato de consignação assinado</span>
                  </label>
                </div>

                <div className="col-span-2">
                  <Label>Observações do acordo</Label>
                  <Textarea
                    rows={3}
                    placeholder="Condições especiais, validade, valor mínimo aceito, etc..."
                    value={form.repasseObservacoes}
                    onChange={(e) => set("repasseObservacoes", e.target.value)}
                  />
                </div>
              </div>

              {valAnunciadoNum > 0 && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase text-emerald-700">
                    <Info className="h-3 w-3" />
                    Simulação da operação
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-keu-black/70">Anunciado:</span>
                      <span className="font-semibold">
                        {formatCurrency(valAnunciadoNum)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-keu-black/70">
                        Repassar ao dono:
                      </span>
                      <span className="font-semibold text-red-600">
                        −{formatCurrency(valAcordoNum)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-emerald-200 mt-1 font-bold">
                      <span>KEU ganha:</span>
                      <span className="text-emerald-700">
                        {formatCurrency(
                          valAnunciadoNum - valAcordoNum - comissaoSimulada > 0
                            ? valAnunciadoNum - valAcordoNum
                            : comissaoSimulada
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ANÚNCIO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-keu-black/5">
              <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Valores de venda</h2>
                <p className="text-sm text-keu-black/60">
                  Como a moto será anunciada
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Valor anunciado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-red">
                    R$
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    required
                    className="pl-9 border-keu-red/30"
                    value={form.valorAnunciado}
                    onChange={(e) =>
                      set(
                        "valorAnunciado",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
              </div>
              <div>
                <Label required>Valor mínimo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                    R$
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    required
                    className="pl-9"
                    value={form.valorMinimo}
                    onChange={(e) =>
                      set(
                        "valorMinimo",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* SIDEBAR — DOCUMENTOS */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Camera className="h-4 w-4 text-blue-500" />
              <h3 className="font-bold">Foto do proprietário</h3>
            </div>
            <p className="text-xs text-keu-black/60 mb-3">
              Foto pessoal para identificação
            </p>
            <ImageUpload
              value={form.fotoPessoal}
              onChange={(v) => set("fotoPessoal", v)}
              max={1}
              maxSizeKB={100}
              maxWidth={600}
              shape="round"
            />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-500" />
              <h3 className="font-bold">CNH</h3>
            </div>
            <p className="text-xs text-keu-black/60 mb-3">
              Frente e verso da CNH do dono
            </p>
            <ImageUpload
              value={form.fotoCnh}
              onChange={(v) => set("fotoCnh", v)}
              max={1}
              maxSizeKB={200}
              maxWidth={1400}
            />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-500" />
              <h3 className="font-bold">Comprovante de residência</h3>
            </div>
            <p className="text-xs text-keu-black/60 mb-3">
              Conta de luz, água, etc.
            </p>
            <ImageUpload
              value={form.fotoComprovanteResidencia}
              onChange={(v) => set("fotoComprovanteResidencia", v)}
              max={1}
              maxSizeKB={200}
              maxWidth={1400}
            />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-500" />
              <h3 className="font-bold">CRLV / Documento da moto</h3>
            </div>
            <p className="text-xs text-keu-black/60 mb-3">
              Documento da moto em dia
            </p>
            <ImageUpload
              value={form.fotoDocMoto}
              onChange={(v) => set("fotoDocMoto", v)}
              max={1}
              maxSizeKB={200}
              maxWidth={1400}
            />
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Bike className="h-4 w-4 text-keu-red" />
              <h3 className="font-bold">Fotos da moto</h3>
            </div>
            <p className="text-xs text-keu-black/60 mb-3">
              Frente, lateral, traseira e painel
            </p>
            <ImageUpload
              value={form.fotosMoto}
              onChange={(v) => set("fotosMoto", v)}
              max={8}
              maxSizeKB={250}
              maxWidth={1400}
            />
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
              <Save className="h-4 w-4" /> Registrar aquisição
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
