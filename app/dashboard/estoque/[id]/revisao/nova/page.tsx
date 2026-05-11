"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  Wrench,
  Save,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Bike,
  Package,
  Hammer,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";
import { apiPost } from "@/lib/api-client";

interface MotoApi {
  _id: string;
  marca: string;
  modelo: string;
  placa?: string;
  anoFabricacao: number;
  anoModelo: number;
  km: number;
  cor: string;
}

type TipoRevisao =
  | "revisao"
  | "manutencao"
  | "troca-peca"
  | "reparo-avaria"
  | "outro";

interface PecaForm {
  nome: string;
  quantidade: number | "";
  valorUnitario: number | "";
}

interface ServicoForm {
  descricao: string;
  valor: number | "";
}

function hojeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function NovaRevisaoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, loading: loadingMoto, error: errorMoto } = useApi<{
    moto: MotoApi;
  }>(id ? `/api/motos/${id}` : null);
  const moto = data?.moto;

  const [tipo, setTipo] = useState<TipoRevisao>("revisao");
  const [dataRev, setDataRev] = useState<string>(hojeISO());
  const [kmNaRevisao, setKmNaRevisao] = useState<number | "">("");
  const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [pecas, setPecas] = useState<PecaForm[]>([]);
  const [servicos, setServicos] = useState<ServicoForm[]>([]);
  const [custoTotal, setCustoTotal] = useState<number | "">("");
  const [custoTotalManual, setCustoTotalManual] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (moto && kmNaRevisao === "") {
      setKmNaRevisao(moto.km);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moto]);

  const totalPecas = useMemo(
    () =>
      pecas.reduce((acc, p) => {
        const q = typeof p.quantidade === "number" ? p.quantidade : 0;
        const v =
          typeof p.valorUnitario === "number" ? p.valorUnitario : 0;
        return acc + q * v;
      }, 0),
    [pecas]
  );
  const totalServicos = useMemo(
    () =>
      servicos.reduce(
        (acc, s) => acc + (typeof s.valor === "number" ? s.valor : 0),
        0
      ),
    [servicos]
  );
  const totalCalculado = totalPecas + totalServicos;

  useEffect(() => {
    if (!custoTotalManual) {
      setCustoTotal(totalCalculado);
    }
  }, [totalCalculado, custoTotalManual]);

  function addPeca() {
    setPecas((arr) => [
      ...arr,
      { nome: "", quantidade: 1, valorUnitario: "" },
    ]);
  }
  function updatePeca(idx: number, patch: Partial<PecaForm>) {
    setPecas((arr) =>
      arr.map((p, i) => (i === idx ? { ...p, ...patch } : p))
    );
  }
  function removePeca(idx: number) {
    setPecas((arr) => arr.filter((_, i) => i !== idx));
  }

  function addServico() {
    setServicos((arr) => [...arr, { descricao: "", valor: "" }]);
  }
  function updateServico(idx: number, patch: Partial<ServicoForm>) {
    setServicos((arr) =>
      arr.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  }
  function removeServico(idx: number) {
    setServicos((arr) => arr.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!descricao.trim() || descricao.trim().length < 3) {
      toast.error("Descrição é obrigatória (mín. 3 caracteres)");
      return;
    }
    if (kmNaRevisao === "" || kmNaRevisao < 0) {
      toast.error("Informe a quilometragem na revisão");
      return;
    }

    const pecasPayload = pecas
      .filter((p) => p.nome.trim().length > 0)
      .map((p) => ({
        nome: p.nome.trim(),
        quantidade:
          typeof p.quantidade === "number" && p.quantidade > 0
            ? p.quantidade
            : 1,
        valorUnitario:
          typeof p.valorUnitario === "number" ? p.valorUnitario : 0,
      }));

    const servicosPayload = servicos
      .filter((s) => s.descricao.trim().length > 0)
      .map((s) => ({
        descricao: s.descricao.trim(),
        valor: typeof s.valor === "number" ? s.valor : 0,
      }));

    const payload = {
      motoId: id,
      data: dataRev,
      tipo,
      descricao: descricao.trim(),
      pecas: pecasPayload,
      servicos: servicosPayload,
      custoTotal: typeof custoTotal === "number" ? custoTotal : totalCalculado,
      kmNaRevisao: typeof kmNaRevisao === "number" ? kmNaRevisao : 0,
      responsavel: responsavel.trim() || undefined,
      notaFiscal: notaFiscal.trim() || undefined,
      fotos,
      observacoes: observacoes.trim() || undefined,
    };

    setSaving(true);
    try {
      const res = await apiPost("/api/revisoes", payload);
      if (res.error) throw new Error(res.error);
      toast.success("Revisão registrada com sucesso");
      router.push(`/dashboard/estoque/${id}/historico`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar revisão"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingMoto) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
        <div className="text-sm text-keu-black/60">Carregando moto...</div>
      </div>
    );
  }

  if (errorMoto || !moto) {
    return (
      <div>
        <Link
          href={`/dashboard/estoque/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à moto
        </Link>
        <Card className="p-8 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold">Moto não encontrada</h3>
              {errorMoto && <p className="text-sm mt-1">{errorMoto}</p>}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/dashboard/estoque/${id}/historico`}
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao histórico
      </Link>

      <PageHeader
        title="Registrar revisão"
        description="Documente serviços executados, peças trocadas e custos"
      >
        <Link href={`/dashboard/estoque/${id}/historico`}>
          <Button type="button" variant="outline">
            <ArrowLeft className="h-4 w-4" /> Cancelar
          </Button>
        </Link>
      </PageHeader>

      {/* Info da moto */}
      <Card className="p-4 mb-6 bg-keu-gray-light/50">
        <div className="flex items-center gap-3">
          <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
            <Bike className="h-5 w-5" />
          </div>
          <div>
            <div className="font-black text-keu-black">
              {moto.marca} {moto.modelo}
            </div>
            <div className="text-sm text-keu-black/60">
              {moto.placa ?? "Sem placa"} · {moto.anoFabricacao}/
              {moto.anoModelo} · {moto.cor} · {moto.km.toLocaleString("pt-BR")} km
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados gerais */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-keu-black/5">
            <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Dados gerais</h2>
              <p className="text-sm text-keu-black/60">
                Tipo, data e detalhes da revisão
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label required>Tipo</Label>
              <Select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoRevisao)}
              >
                <option value="revisao">Revisão programada</option>
                <option value="manutencao">Manutenção</option>
                <option value="troca-peca">Troca de peça</option>
                <option value="reparo-avaria">Reparo de avaria</option>
                <option value="outro">Outro</option>
              </Select>
            </div>
            <div>
              <Label required>Data</Label>
              <Input
                type="date"
                value={dataRev}
                onChange={(e) => setDataRev(e.target.value)}
                required
              />
            </div>
            <div>
              <Label required>KM na revisão</Label>
              <Input
                type="number"
                min={0}
                value={kmNaRevisao}
                onChange={(e) =>
                  setKmNaRevisao(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                required
              />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Nome do mecânico/oficina"
              />
            </div>
            <div className="md:col-span-2">
              <Label required>Descrição</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que foi feito"
                required
                minLength={3}
                rows={3}
              />
            </div>
            <div>
              <Label>Nota fiscal</Label>
              <Input
                value={notaFiscal}
                onChange={(e) => setNotaFiscal(e.target.value)}
                placeholder="Número da NF"
              />
            </div>
          </div>
        </Card>

        {/* Peças */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-keu-black/5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Peças trocadas</h2>
                <p className="text-sm text-keu-black/60">
                  {pecas.length} {pecas.length === 1 ? "peça" : "peças"} · Total{" "}
                  {formatCurrency(totalPecas)}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={addPeca}>
              <Plus className="h-4 w-4" /> Adicionar peça
            </Button>
          </div>

          {pecas.length === 0 ? (
            <p className="text-sm text-keu-black/50 text-center py-6">
              Nenhuma peça adicionada
            </p>
          ) : (
            <div className="space-y-3">
              {pecas.map((p, idx) => {
                const subtotal =
                  (typeof p.quantidade === "number" ? p.quantidade : 0) *
                  (typeof p.valorUnitario === "number" ? p.valorUnitario : 0);
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-end bg-keu-gray-light/40 rounded-lg p-3"
                  >
                    <div className="col-span-12 md:col-span-5">
                      <Label>Nome</Label>
                      <Input
                        value={p.nome}
                        onChange={(e) =>
                          updatePeca(idx, { nome: e.target.value })
                        }
                        placeholder="Ex: Pastilha de freio"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label>Qtd</Label>
                      <Input
                        type="number"
                        min={1}
                        value={p.quantidade}
                        onChange={(e) =>
                          updatePeca(idx, {
                            quantidade:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label>Valor un. (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={p.valorUnitario}
                        onChange={(e) =>
                          updatePeca(idx, {
                            valorUnitario:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <Label>Subtotal</Label>
                      <div className="h-10 flex items-center font-bold text-keu-black px-3">
                        {formatCurrency(subtotal)}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removePeca(idx)}
                        aria-label="Remover peça"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Serviços */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-keu-black/5">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Hammer className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Serviços executados</h2>
                <p className="text-sm text-keu-black/60">
                  {servicos.length}{" "}
                  {servicos.length === 1 ? "serviço" : "serviços"} · Total{" "}
                  {formatCurrency(totalServicos)}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={addServico}>
              <Plus className="h-4 w-4" /> Adicionar serviço
            </Button>
          </div>

          {servicos.length === 0 ? (
            <p className="text-sm text-keu-black/50 text-center py-6">
              Nenhum serviço adicionado
            </p>
          ) : (
            <div className="space-y-3">
              {servicos.map((s, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-end bg-keu-gray-light/40 rounded-lg p-3"
                >
                  <div className="col-span-12 md:col-span-8">
                    <Label>Descrição</Label>
                    <Input
                      value={s.descricao}
                      onChange={(e) =>
                        updateServico(idx, { descricao: e.target.value })
                      }
                      placeholder="Ex: Troca de óleo e filtro"
                    />
                  </div>
                  <div className="col-span-10 md:col-span-3">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={s.valor}
                      onChange={(e) =>
                        updateServico(idx, {
                          valor:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeServico(idx)}
                      aria-label="Remover serviço"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Custo total */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-keu-black/5">
            <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Custo total</h2>
              <p className="text-sm text-keu-black/60">
                Calculado automaticamente — clique para editar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Subtotal peças</Label>
              <div className="h-10 flex items-center font-bold text-keu-black px-3 bg-keu-gray-light/40 rounded-lg">
                {formatCurrency(totalPecas)}
              </div>
            </div>
            <div>
              <Label>Subtotal serviços</Label>
              <div className="h-10 flex items-center font-bold text-keu-black px-3 bg-keu-gray-light/40 rounded-lg">
                {formatCurrency(totalServicos)}
              </div>
            </div>
            <div>
              <Label required>Total (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={custoTotal}
                onChange={(e) => {
                  setCustoTotalManual(true);
                  setCustoTotal(
                    e.target.value === "" ? "" : Number(e.target.value)
                  );
                }}
                className="font-black text-keu-red text-base"
              />
              {custoTotalManual && (
                <button
                  type="button"
                  onClick={() => {
                    setCustoTotalManual(false);
                    setCustoTotal(totalCalculado);
                  }}
                  className="text-xs text-keu-red font-semibold hover:underline mt-1"
                >
                  Voltar ao cálculo automático
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Fotos */}
        <Card className="p-6">
          <h2 className="font-bold mb-1">Fotos da revisão</h2>
          <p className="text-sm text-keu-black/60 mb-4">
            Registre fotos das peças, NF, antes/depois (até 6 imagens)
          </p>
          <ImageUpload
            value={fotos}
            onChange={setFotos}
            max={6}
            maxSizeKB={250}
          />
        </Card>

        {/* Observações */}
        <Card className="p-6">
          <Label>Observações</Label>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Anotações adicionais (opcional)"
            rows={3}
          />
        </Card>

        {/* Ações */}
        <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3">
          <Link
            href={`/dashboard/estoque/${id}/historico`}
            className="md:w-auto"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
            >
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="w-full md:w-auto">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Salvar revisão
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
