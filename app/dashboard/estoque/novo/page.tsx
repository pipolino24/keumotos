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
  Image as ImageIcon,
  Save,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";

export default function NovoMotoPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<"venda" | "aluguel" | "ambos">("venda");
  const [valorFipe, setValorFipe] = useState<number>(0);
  const [valorCompra, setValorCompra] = useState<number>(0);
  const [valorAnunciado, setValorAnunciado] = useState<number>(0);
  const [valorMinimo, setValorMinimo] = useState<number>(0);

  const margemBruta = valorAnunciado - valorCompra;
  const margemMinima = valorMinimo - valorCompra;
  const percentualFipe = valorFipe
    ? ((valorAnunciado / valorFipe - 1) * 100).toFixed(1)
    : "0";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard/estoque");
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
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4" /> Salvar moto
        </Button>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                <Select id="marca" required>
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
                <Input id="modelo" placeholder="Ex: CG 160 Titan" required />
              </div>
              <div>
                <Label htmlFor="versao">Versão / Trim</Label>
                <Input id="versao" placeholder="Ex: Start, ABS, Sport" />
              </div>
              <div>
                <Label htmlFor="cor" required>Cor</Label>
                <Input id="cor" placeholder="Ex: Vermelha" required />
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
                />
              </div>
              <div>
                <Label htmlFor="renavam">RENAVAM</Label>
                <Input
                  id="renavam"
                  placeholder="00000000000"
                  className="font-mono"
                  maxLength={11}
                />
              </div>
              <div>
                <Label htmlFor="chassi">Chassi</Label>
                <Input
                  id="chassi"
                  placeholder="9C2KC2200PR000000"
                  className="font-mono uppercase"
                  maxLength={17}
                />
              </div>
              <div>
                <Label htmlFor="motor">Número do motor</Label>
                <Input id="motor" placeholder="KC22E0000000" className="font-mono" />
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
                />
              </div>
              <div>
                <Label htmlFor="potencia">Potência</Label>
                <Input id="potencia" placeholder="Ex: 14.7 cv" />
              </div>
              <div>
                <Label htmlFor="km" required>Quilometragem</Label>
                <Input
                  id="km"
                  type="number"
                  min="0"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="combustivel" required>Combustível</Label>
                <Select id="combustivel" required>
                  <option value="">Selecione...</option>
                  <option value="flex">Flex</option>
                  <option value="gasolina">Gasolina</option>
                  <option value="eletrica">Elétrica</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="cambio" required>Câmbio</Label>
                <Select id="cambio" required>
                  <option value="">Selecione...</option>
                  <option value="manual">Manual</option>
                  <option value="automatico">Automático</option>
                  <option value="semi-automatico">Semi-automático</option>
                  <option value="cvt">CVT</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="partida">Partida</Label>
                <Select id="partida">
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
              <div>
                <Label htmlFor="valorFipe" required>
                  Valor FIPE
                  <span className="text-xs text-keu-black/50 ml-1 font-normal">
                    (referência)
                  </span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                    R$
                  </span>
                  <Input
                    id="valorFipe"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0,00"
                    className="pl-9"
                    value={valorFipe || ""}
                    onChange={(e) => setValorFipe(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="valorCompra" required>
                  Valor de compra
                  <span className="text-xs text-keu-black/50 ml-1 font-normal">
                    (custo)
                  </span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                    R$
                  </span>
                  <Input
                    id="valorCompra"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0,00"
                    className="pl-9"
                    value={valorCompra || ""}
                    onChange={(e) => setValorCompra(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="valorAnunciado" required>
                  Valor anunciado
                  <span className="text-xs text-keu-red ml-1 font-normal">
                    (público)
                  </span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-red">
                    R$
                  </span>
                  <Input
                    id="valorAnunciado"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0,00"
                    className="pl-9 border-keu-red/30 focus:border-keu-red"
                    value={valorAnunciado || ""}
                    onChange={(e) => setValorAnunciado(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="valorMinimo" required>
                  Valor mínimo
                  <span className="text-xs text-keu-black/50 ml-1 font-normal">
                    (não vender abaixo)
                  </span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                    R$
                  </span>
                  <Input
                    id="valorMinimo"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0,00"
                    className="pl-9"
                    value={valorMinimo || ""}
                    onChange={(e) => setValorMinimo(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="comissao">Comissão do vendedor</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                    R$
                  </span>
                  <Input
                    id="comissao"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="0,00"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* PREVIEW DE MARGEM */}
            {(valorCompra > 0 || valorAnunciado > 0) && (
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
                    <div className="text-xs text-keu-black/60 mb-1">
                      vs FIPE
                    </div>
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
          {(tipo === "aluguel" || tipo === "ambos") && (
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
                <div>
                  <Label htmlFor="diaria">Diária</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                      R$
                    </span>
                    <Input id="diaria" type="number" min="0" className="pl-9" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="semanal">Semanal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                      R$
                    </span>
                    <Input id="semanal" type="number" min="0" className="pl-9" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="mensal">Mensal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                      R$
                    </span>
                    <Input id="mensal" type="number" min="0" className="pl-9" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="caucao">Caução</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                      R$
                    </span>
                    <Input id="caucao" type="number" min="0" className="pl-9" />
                  </div>
                </div>
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
                />
              </div>
              <div>
                <Label htmlFor="observacoes">Observações internas</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações internas (não visíveis ao cliente)"
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* TIPO E STATUS */}
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
                      onClick={() => setTipo(t)}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg border-2 capitalize transition ${
                        tipo === t
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
                <Select id="status" defaultValue="disponivel">
                  <option value="disponivel">Disponível</option>
                  <option value="reservada">Reservada</option>
                  <option value="vendida">Vendida</option>
                  <option value="alugada">Alugada</option>
                  <option value="manutencao">Em manutenção</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="loja" required>Loja responsável</Label>
                <Select id="loja" defaultValue="multimarcas">
                  <option value="multimarcas">KEU Multimarcas</option>
                  <option value="loca">KEU Loca Motos</option>
                  <option value="pecas">KEU Moto Peças</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="vendedor">Vendedor responsável</Label>
                <Select id="vendedor">
                  <option value="">Selecione...</option>
                  <option>Marcos Vinícius Lima</option>
                  <option>Patrícia Souza Oliveira</option>
                </Select>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-keu-black/20 text-keu-red focus:ring-keu-red"
                />
                <span>Marcar como destaque</span>
                <Badge variant="default" className="ml-auto">★</Badge>
              </label>
            </div>
          </Card>

          {/* FOTOS */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Fotos da moto</h3>
            <button
              type="button"
              className="w-full border-2 border-dashed border-keu-black/15 rounded-xl p-8 text-center hover:border-keu-red hover:bg-keu-red/5 transition cursor-pointer"
            >
              <ImageIcon className="h-8 w-8 text-keu-black/30 mx-auto mb-2" />
              <div className="text-sm font-semibold mb-1">
                Clique para adicionar fotos
              </div>
              <div className="text-xs text-keu-black/50">
                JPG, PNG até 5MB cada
              </div>
            </button>
            <p className="text-xs text-keu-black/60 mt-3">
              Recomendamos pelo menos 4 fotos: frente, lateral, traseira e painel.
            </p>
          </Card>

          {/* ORIGEM */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Origem</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fornecedor">Fornecedor / Antigo dono</Label>
                <Input id="fornecedor" placeholder="Nome do fornecedor" />
              </div>
              <div>
                <Label htmlFor="entrada">Data de entrada</Label>
                <Input
                  id="entrada"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="button" variant="dark">
          Salvar como rascunho
        </Button>
        <Button type="submit" size="lg">
          <Save className="h-4 w-4" /> Cadastrar moto
        </Button>
      </div>
    </form>
  );
}
