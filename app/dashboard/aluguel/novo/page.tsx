"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  User,
  Bike,
  DollarSign,
  Search,
  CheckCircle2,
  UserPlus,
  KeyRound,
  Info,
  Calendar,
  Gauge,
  FileText,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/user-context";
import { useApi } from "@/lib/hooks/use-api";
import { apiPost, apiPatch } from "@/lib/api-client";

interface MotoApi {
  _id: string;
  marca: string;
  modelo: string;
  versao?: string;
  anoFabricacao: number;
  anoModelo: number;
  cor?: string;
  placa?: string;
  cilindrada?: number;
  km?: number;
  valorDiaria?: number;
  valorSemanal?: number;
  valorMensal?: number;
  tipo: string;
  status: string;
  fotos?: string[];
}

interface ClienteApi {
  _id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
}

type AluguelForm = {
  clienteMode: "existente" | "novo";
  clienteId: string;
  novoCliNome: string;
  novoCliTelefone: string;
  novoCliEmail: string;
  novoCliCpf: string;

  motoId: string;
  dataInicio: string;
  dataFim: string;

  valorTotal: number | "";
  valorTotalEditado: boolean;
  km_inicial: number | "";
  observacoes: string;

  fotosInicio: string[];
  observacoesInicio: string;

  // Plano Conquista — entrada + parcelas quinzenais (default da KEU)
  tipoPlano: "conquista" | "venda-direta";
  valorEntrada: number | "";
  dataEntrada: string;
  valorParcela: number | "";
  numeroParcelas: number | "";
  frequenciaParcela: "quinzenal" | "mensal";
  proximaParcelaEm: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const initial: AluguelForm = {
  clienteMode: "existente",
  clienteId: "",
  novoCliNome: "",
  novoCliTelefone: "",
  novoCliEmail: "",
  novoCliCpf: "",
  motoId: "",
  dataInicio: todayISO(),
  dataFim: tomorrowISO(),
  valorTotal: "",
  valorTotalEditado: false,
  km_inicial: "",
  observacoes: "",
  fotosInicio: [],
  observacoesInicio: "",
  tipoPlano: "conquista",
  valorEntrada: "",
  dataEntrada: todayISO(),
  valorParcela: "",
  numeroParcelas: "",
  frequenciaParcela: "quinzenal",
  proximaParcelaEm: "",
};

interface CalculoValor {
  dias: number;
  modalidade: "diaria" | "semanal" | "mensal" | null;
  valor: number;
}

/**
 * Escolhe o melhor preço para o cliente entre diária, semanal e mensal.
 * Para cada modalidade aplica a tarifa cheia em "blocos" e a diária no resto.
 */
function calcularMelhorValor(
  dias: number,
  diaria?: number,
  semanal?: number,
  mensal?: number
): CalculoValor {
  if (dias <= 0) return { dias: 0, modalidade: null, valor: 0 };

  const opcoes: { modalidade: "diaria" | "semanal" | "mensal"; valor: number }[] =
    [];

  // Só diária
  if (diaria !== undefined && diaria > 0) {
    opcoes.push({ modalidade: "diaria", valor: diaria * dias });
  }

  // Semanal (7 dias) + diária pro restante
  if (semanal !== undefined && semanal > 0 && diaria !== undefined) {
    const semanas = Math.floor(dias / 7);
    const restoDias = dias - semanas * 7;
    if (semanas > 0) {
      opcoes.push({
        modalidade: "semanal",
        valor: semanas * semanal + restoDias * diaria,
      });
    }
  }

  // Mensal (30 dias) + diária pro restante
  if (mensal !== undefined && mensal > 0 && diaria !== undefined) {
    const meses = Math.floor(dias / 30);
    const restoDias = dias - meses * 30;
    if (meses > 0) {
      opcoes.push({
        modalidade: "mensal",
        valor: meses * mensal + restoDias * diaria,
      });
    }
  }

  if (opcoes.length === 0) {
    return { dias, modalidade: null, valor: 0 };
  }

  // Menor valor pro cliente
  opcoes.sort((a, b) => a.valor - b.valor);
  const best = opcoes[0];
  return { dias, modalidade: best.modalidade, valor: best.valor };
}

function diasEntre(inicio: string, fim: string): number {
  const a = new Date(inicio);
  const b = new Date(fim);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  const ms = b.getTime() - a.getTime();
  const d = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(d, 0);
}

export default function NovoAluguelPage() {
  const router = useRouter();
  const me = useCurrentUser();
  const [form, setForm] = useState<AluguelForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clienteSearch, setClienteSearch] = useState("");

  const { data: clientesData, loading: loadingClientes } = useApi<{
    users: ClienteApi[];
  }>("/api/users?role=cliente");

  const { data: motosData, loading: loadingMotos } = useApi<{
    motos: MotoApi[];
  }>("/api/motos?tipo=aluguel&status=disponivel");

  const { data: motosAmbosData } = useApi<{ motos: MotoApi[] }>(
    "/api/motos?tipo=ambos&status=disponivel"
  );

  const todasMotos = useMemo(() => {
    const a = motosData?.motos ?? [];
    const b = motosAmbosData?.motos ?? [];
    const seen = new Set<string>();
    return [...a, ...b].filter((m) => {
      if (seen.has(m._id)) return false;
      seen.add(m._id);
      return true;
    });
  }, [motosData, motosAmbosData]);

  const motoSelecionada = useMemo(
    () => todasMotos.find((m) => m._id === form.motoId) ?? null,
    [todasMotos, form.motoId]
  );

  const clientesFiltrados = useMemo(() => {
    const all = clientesData?.users ?? [];
    if (!clienteSearch.trim()) return all;
    const q = clienteSearch.toLowerCase();
    return all.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.telefone.includes(q) ||
        (c.cpf ?? "").includes(q)
    );
  }, [clientesData, clienteSearch]);

  const dias = diasEntre(form.dataInicio, form.dataFim);
  const calculo = useMemo(() => {
    if (!motoSelecionada) {
      return { dias, modalidade: null as CalculoValor["modalidade"], valor: 0 };
    }
    return calcularMelhorValor(
      dias,
      motoSelecionada.valorDiaria,
      motoSelecionada.valorSemanal,
      motoSelecionada.valorMensal
    );
  }, [dias, motoSelecionada]);

  // Valor total exibido: usa valor digitado pelo usuário; senão, a sugestão calculada.
  const valorTotalExibido: number | "" =
    form.valorTotalEditado
      ? form.valorTotal
      : calculo.valor > 0
        ? calculo.valor
        : form.valorTotal;

  function set<K extends keyof AluguelForm>(key: K, value: AluguelForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  // Auto-preenche km inicial ao escolher uma moto
  function handleMotoChange(motoId: string) {
    const moto = todasMotos.find((m) => m._id === motoId) ?? null;
    setForm((p) => ({
      ...p,
      motoId,
      km_inicial:
        moto && p.km_inicial === "" ? moto.km ?? 0 : p.km_inicial,
    }));
  }

  function clienteSelecionado(): ClienteApi | undefined {
    return clientesData?.users.find((u) => u._id === form.clienteId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.motoId) {
      const m = "Selecione uma moto.";
      setError(m);
      toast.error(m);
      return;
    }
    if (form.clienteMode === "existente" && !form.clienteId) {
      const m = "Selecione um cliente ou cadastre um novo.";
      setError(m);
      toast.error(m);
      return;
    }
    if (form.clienteMode === "novo" && !form.novoCliNome.trim()) {
      const m = "Informe o nome do novo cliente.";
      setError(m);
      toast.error(m);
      return;
    }
    if (!form.dataInicio || !form.dataFim) {
      const m = "Informe as datas de início e fim.";
      setError(m);
      toast.error(m);
      return;
    }
    if (dias < 1) {
      const m = "Data fim deve ser depois da data de início.";
      setError(m);
      toast.error(m);
      return;
    }
    if (valorTotalExibido === "" || Number(valorTotalExibido) <= 0) {
      const m = "Informe o valor total.";
      setError(m);
      toast.error(m);
      return;
    }
    if (form.km_inicial === "" || Number(form.km_inicial) < 0) {
      const m = "Informe o KM inicial.";
      setError(m);
      toast.error(m);
      return;
    }

    setSaving(true);
    try {
      let clienteId: string | undefined;
      let clienteNome: string;
      let clienteTelefone: string | undefined;
      let clienteEmail: string | undefined;
      let clienteCpf: string | undefined;

      if (form.clienteMode === "novo") {
        const senha = Math.random().toString(36).slice(2, 10);
        const novoCliRes = await apiPost<{ user: ClienteApi }>("/api/users", {
          nome: form.novoCliNome,
          email:
            form.novoCliEmail ||
            `${form.novoCliNome.replace(/\s+/g, ".").toLowerCase()}@cliente.keumotos.com`,
          telefone: form.novoCliTelefone || "00000000",
          senha,
          role: "cliente",
          status: "ativo",
          cpf: form.novoCliCpf || undefined,
        });
        if (novoCliRes.error || !novoCliRes.data?.user) {
          throw new Error(novoCliRes.error ?? "Erro ao criar cliente");
        }
        const u = novoCliRes.data.user;
        clienteId = u._id;
        clienteNome = u.nome;
        clienteTelefone = u.telefone;
        clienteEmail = u.email;
        clienteCpf = u.cpf;
      } else {
        const cli = clienteSelecionado();
        if (!cli) throw new Error("Cliente não encontrado");
        clienteId = cli._id;
        clienteNome = cli.nome;
        clienteTelefone = cli.telefone;
        clienteEmail = cli.email;
        clienteCpf = cli.cpf;
      }

      if (!motoSelecionada) throw new Error("Moto não encontrada");

      const payload = {
        motoId: motoSelecionada._id,
        motoModelo: `${motoSelecionada.marca} ${motoSelecionada.modelo} ${motoSelecionada.anoModelo}`,
        motoMarca: motoSelecionada.marca,
        motoAno: motoSelecionada.anoModelo,

        clienteId,
        clienteNome,
        clienteTelefone,
        clienteEmail,
        clienteCpf,

        vendedorId: me.id,
        vendedorNome: me.nome,

        dataInicio: form.dataInicio,
        dataFim: form.dataFim,

        valorDiariaUsada: motoSelecionada.valorDiaria,
        valorSemanalUsada: motoSelecionada.valorSemanal,
        valorMensalUsada: motoSelecionada.valorMensal,
        modalidadeAplicada: calculo.modalidade ?? undefined,
        diasContratados: dias,
        valorTotal: Number(valorTotalExibido),

        // Plano Conquista — entrada + parcelas quinzenais
        tipoPlano: form.tipoPlano,
        valorEntrada:
          typeof form.valorEntrada === "number" ? form.valorEntrada : undefined,
        dataEntrada: form.dataEntrada || undefined,
        valorParcela:
          typeof form.valorParcela === "number" ? form.valorParcela : undefined,
        numeroParcelas:
          typeof form.numeroParcelas === "number"
            ? form.numeroParcelas
            : undefined,
        frequenciaParcela: form.frequenciaParcela,
        proximaParcelaEm: form.proximaParcelaEm || undefined,

        km_inicial: Number(form.km_inicial),

        status: "ativo" as const,
        observacoes: form.observacoes || undefined,

        fotosInicio: form.fotosInicio,
        observacoesInicio: form.observacoesInicio || undefined,
      };

      const res = await apiPost<{ aluguel: { _id: string } }>(
        "/api/alugueis",
        payload
      );
      if (res.error) throw new Error(res.error);

      const motoUpd = await apiPatch(`/api/motos/${motoSelecionada._id}`, {
        status: "alugada",
      });
      if (motoUpd.error) {
        toast.warning(
          "Locação salva, mas falhou ao atualizar status da moto"
        );
      }

      toast.success("Locação iniciada com sucesso!");
      router.push("/dashboard/aluguel");
    } catch (err) {
      const m =
        err instanceof Error ? err.message : "Erro ao registrar locação";
      setError(m);
      toast.error(m);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href="/dashboard/aluguel"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para aluguel
      </Link>

      <PageHeader
        title="Nova locação"
        description="Registre uma nova locação de moto"
      >
        <Link href="/dashboard/aluguel">
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
              <KeyRound className="h-4 w-4" /> Iniciar locação
            </>
          )}
        </Button>
      </PageHeader>

      {error && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* CLIENTE */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Cliente</h2>
                <p className="text-sm text-keu-black/60">
                  Quem está alugando a moto
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => set("clienteMode", "existente")}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  form.clienteMode === "existente"
                    ? "border-keu-red bg-keu-red/5"
                    : "border-keu-black/10"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Search className="h-3.5 w-3.5" /> Cliente existente
                </div>
                <div className="text-xs text-keu-black/60">
                  Buscar no cadastro
                </div>
              </button>
              <button
                type="button"
                onClick={() => set("clienteMode", "novo")}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  form.clienteMode === "novo"
                    ? "border-keu-red bg-keu-red/5"
                    : "border-keu-black/10"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <UserPlus className="h-3.5 w-3.5" /> Novo cliente
                </div>
                <div className="text-xs text-keu-black/60">Cadastrar agora</div>
              </button>
            </div>

            {form.clienteMode === "existente" ? (
              <div>
                <Label>Buscar cliente</Label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    placeholder="Nome, e-mail, telefone ou CPF..."
                    className="pl-9"
                    value={clienteSearch}
                    onChange={(e) => setClienteSearch(e.target.value)}
                  />
                </div>
                {loadingClientes ? (
                  <div className="text-sm text-keu-black/60 p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Carregando clientes...
                  </div>
                ) : clientesFiltrados.length === 0 ? (
                  <div className="text-sm text-keu-black/60 p-4 text-center bg-keu-gray-light rounded-lg">
                    Nenhum cliente encontrado. Use a opção &quot;Novo
                    cliente&quot;.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-keu-black/10 divide-y divide-keu-black/5">
                    {clientesFiltrados.slice(0, 50).map((c) => (
                      <button
                        type="button"
                        key={c._id}
                        onClick={() => set("clienteId", c._id)}
                        className={`w-full text-left p-3 hover:bg-keu-gray-light transition ${
                          form.clienteId === c._id
                            ? "bg-keu-red/5 border-l-4 border-keu-red"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-sm">
                              {c.nome}
                            </div>
                            <div className="text-xs text-keu-black/60">
                              {c.email} • {c.telefone}
                              {c.cpf ? ` • ${c.cpf}` : ""}
                            </div>
                          </div>
                          {form.clienteId === c._id && (
                            <CheckCircle2 className="h-5 w-5 text-keu-red flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="novoCliNome" required>
                    Nome completo
                  </Label>
                  <Input
                    id="novoCliNome"
                    required
                    value={form.novoCliNome}
                    onChange={(e) => set("novoCliNome", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="novoCliTelefone">Telefone</Label>
                  <Input
                    id="novoCliTelefone"
                    placeholder="(88) 99999-9999"
                    value={form.novoCliTelefone}
                    onChange={(e) => set("novoCliTelefone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="novoCliCpf">CPF</Label>
                  <Input
                    id="novoCliCpf"
                    className="font-mono"
                    placeholder="000.000.000-00"
                    value={form.novoCliCpf}
                    onChange={(e) => set("novoCliCpf", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="novoCliEmail">E-mail</Label>
                  <Input
                    id="novoCliEmail"
                    type="email"
                    value={form.novoCliEmail}
                    onChange={(e) => set("novoCliEmail", e.target.value)}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* MOTO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
                <Bike className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Moto</h2>
                <p className="text-sm text-keu-black/60">
                  Selecione a moto da frota
                </p>
              </div>
            </div>

            <div>
              <Label required>Moto disponível</Label>
              <Select
                required
                value={form.motoId}
                onChange={(e) => handleMotoChange(e.target.value)}
                disabled={loadingMotos}
              >
                <option value="">
                  {loadingMotos
                    ? "Carregando..."
                    : todasMotos.length === 0
                      ? "Nenhuma moto disponível para aluguel"
                      : "Selecione uma moto..."}
                </option>
                {todasMotos.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.marca} {m.modelo} {m.anoModelo}
                    {m.placa ? ` • ${m.placa}` : ""}
                    {m.cor ? ` • ${m.cor}` : ""}
                    {m.valorDiaria
                      ? ` — ${formatCurrency(m.valorDiaria)}/dia`
                      : ""}
                  </option>
                ))}
              </Select>
            </div>

            {motoSelecionada && (
              <div className="mt-4 p-4 bg-keu-gray-light rounded-xl">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-keu-gray-light via-white to-keu-red/10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    {motoSelecionada.fotos &&
                    motoSelecionada.fotos.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={motoSelecionada.fotos[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Bike className="h-10 w-10 text-keu-red/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-keu-red">
                      {motoSelecionada.marca}
                    </div>
                    <div className="font-bold leading-tight">
                      {motoSelecionada.modelo} {motoSelecionada.versao}
                    </div>
                    <div className="text-xs text-keu-black/60 mt-1">
                      {motoSelecionada.anoModelo}
                      {motoSelecionada.cor ? ` • ${motoSelecionada.cor}` : ""}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <div>
                        <div className="text-keu-black/60">Diária</div>
                        <div className="font-bold">
                          {formatCurrency(motoSelecionada.valorDiaria ?? 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-keu-black/60">Semanal</div>
                        <div className="font-bold">
                          {formatCurrency(motoSelecionada.valorSemanal ?? 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-keu-black/60">Mensal</div>
                        <div className="font-bold">
                          {formatCurrency(motoSelecionada.valorMensal ?? 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* PERÍODO E VALORES */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Período, valor e plano</h2>
                <p className="text-sm text-keu-black/60">
                  Datas do contrato, valor total, entrada e parcelas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Data início</Label>
                <Input
                  type="date"
                  required
                  value={form.dataInicio}
                  onChange={(e) => set("dataInicio", e.target.value)}
                />
              </div>
              <div>
                <Label required>Data fim</Label>
                <Input
                  type="date"
                  required
                  value={form.dataFim}
                  min={form.dataInicio}
                  onChange={(e) => set("dataFim", e.target.value)}
                />
              </div>

              {motoSelecionada && dias > 0 && (
                <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-xs">
                  <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>{dias}</strong> dia{dias > 1 ? "s" : ""} de
                    locação.{" "}
                    {calculo.modalidade && (
                      <>
                        Melhor preço:{" "}
                        <strong className="text-blue-900">
                          Plano{" "}
                          {calculo.modalidade === "diaria"
                            ? "diário"
                            : calculo.modalidade === "semanal"
                              ? "semanal"
                              : "mensal"}
                        </strong>{" "}
                        = {formatCurrency(calculo.valor)}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label required>Valor total</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                    R$
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    required
                    className="pl-9"
                    value={valorTotalExibido}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        valorTotal: e.target.value
                          ? Number(e.target.value)
                          : "",
                        valorTotalEditado: true,
                      }));
                    }}
                  />
                </div>
                {form.valorTotalEditado && calculo.valor > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm((p) => ({
                        ...p,
                        valorTotal: "",
                        valorTotalEditado: false,
                      }));
                    }}
                    className="text-xs text-keu-red hover:underline mt-1"
                  >
                    Restaurar sugestão ({formatCurrency(calculo.valor)})
                  </button>
                )}
              </div>

              {/* Plano Conquista — entrada + parcelas quinzenais */}
              <div className="col-span-2 border-t border-keu-black/5 pt-4 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-keu-red bg-keu-red/5 px-2 py-1 rounded-md">
                    Plano
                  </span>
                  <span className="text-xs text-keu-black/60">
                    Entrada + parcelas quinzenais — moto fica com o cliente ao
                    fim do contrato
                  </span>
                </div>
              </div>

              <div>
                <Label required>Tipo de plano</Label>
                <Select
                  value={form.tipoPlano}
                  onChange={(e) =>
                    set(
                      "tipoPlano",
                      e.target.value as "conquista" | "venda-direta"
                    )
                  }
                >
                  <option value="conquista">Conquista (parcelas)</option>
                  <option value="venda-direta">Venda direta</option>
                </Select>
              </div>

              <div>
                <Label>Frequência das parcelas</Label>
                <Select
                  value={form.frequenciaParcela}
                  onChange={(e) =>
                    set(
                      "frequenciaParcela",
                      e.target.value as "quinzenal" | "mensal"
                    )
                  }
                >
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                </Select>
              </div>

              <div>
                <Label>Valor da entrada</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                    R$
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    className="pl-9"
                    placeholder="0"
                    value={form.valorEntrada}
                    onChange={(e) =>
                      set(
                        "valorEntrada",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Data da entrada</Label>
                <Input
                  type="date"
                  value={form.dataEntrada}
                  onChange={(e) => set("dataEntrada", e.target.value)}
                />
              </div>

              <div>
                <Label>Valor de cada parcela</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                    R$
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    className="pl-9"
                    placeholder="0"
                    value={form.valorParcela}
                    onChange={(e) =>
                      set(
                        "valorParcela",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Quantidade de parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  placeholder="Ex: 24"
                  value={form.numeroParcelas}
                  onChange={(e) =>
                    set(
                      "numeroParcelas",
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                />
              </div>

              <div className="col-span-2">
                <Label>Vencimento da primeira parcela</Label>
                <Input
                  type="date"
                  value={form.proximaParcelaEm}
                  onChange={(e) => set("proximaParcelaEm", e.target.value)}
                />
                <p className="text-xs text-keu-black/50 mt-1">
                  As próximas vencem a cada{" "}
                  {form.frequenciaParcela === "quinzenal" ? "15 dias" : "30 dias"}.
                </p>
              </div>

              <div className="col-span-2">
                <Label required>KM inicial</Label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    type="number"
                    min="0"
                    required
                    className="pl-9"
                    value={form.km_inicial}
                    onChange={(e) =>
                      set(
                        "km_inicial",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
              </div>

              <div className="col-span-2">
                <Label>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Observações
                  </span>
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Condições especiais, acessórios entregues, estado da moto..."
                  value={form.observacoes}
                  onChange={(e) => set("observacoes", e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* VISTORIA DE RETIRADA */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Vistoria de retirada</h2>
                <p className="text-sm text-keu-black/60">
                  Fotos e estado da moto no momento da entrega ao cliente
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Fotos da moto na retirada</Label>
                <ImageUpload
                  value={form.fotosInicio}
                  onChange={(imgs) => set("fotosInicio", imgs)}
                  max={8}
                  maxSizeKB={250}
                  maxWidth={1400}
                  hint="Até 8 fotos · documente riscos, painel, acessórios e estado geral"
                />
              </div>

              <div>
                <Label htmlFor="observacoesInicio">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Observações da retirada
                  </span>
                </Label>
                <Textarea
                  id="observacoesInicio"
                  rows={4}
                  placeholder="Descreva como a moto está sendo entregue: riscos, peças, nível de combustível, acessórios incluídos (capacete, baú, etc.)..."
                  value={form.observacoesInicio}
                  onChange={(e) => set("observacoesInicio", e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-keu-black/5">
              <div className="bg-purple-500/10 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">Vendedor</h3>
                <p className="text-xs text-keu-black/60">Responsável</p>
              </div>
            </div>
            <div className="p-3 bg-keu-gray-light rounded-lg">
              <div className="font-semibold text-sm">{me.nome}</div>
              <div className="text-xs text-keu-black/60">{me.email}</div>
              <Badge variant="secondary" className="mt-2 text-[10px]">
                {me.role}
              </Badge>
            </div>
          </Card>

          {motoSelecionada && dias > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase text-emerald-700">
                <DollarSign className="h-3 w-3" />
                Resumo
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-keu-black/60">Período:</span>
                  <span>
                    {dias} dia{dias > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-keu-black/60">Plano sugerido:</span>
                  <span className="capitalize">
                    {calculo.modalidade ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-keu-black/60">Sugestão:</span>
                  <span>{formatCurrency(calculo.valor)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-keu-black/5">
                  <span className="text-keu-black/60">Valor total:</span>
                  <span className="font-bold text-keu-red">
                    {formatCurrency(
                      typeof valorTotalExibido === "number"
                        ? valorTotalExibido
                        : 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-keu-black/60">Entrada:</span>
                  <span>
                    {formatCurrency(
                      typeof form.valorEntrada === "number"
                        ? form.valorEntrada
                        : 0
                    )}
                  </span>
                </div>
                {typeof form.valorParcela === "number" &&
                  typeof form.numeroParcelas === "number" && (
                    <div className="flex justify-between">
                      <span className="text-keu-black/60">Parcelas:</span>
                      <span>
                        {form.numeroParcelas}× {formatCurrency(form.valorParcela)}{" "}
                        ({form.frequenciaParcela})
                      </span>
                    </div>
                  )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
        <Link href="/dashboard/aluguel">
          <Button type="button" variant="outline" disabled={saving}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Iniciar locação
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
