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
  CreditCard,
  Search,
  CheckCircle2,
  UserPlus,
  ShoppingCart,
  Info,
  ShieldAlert,
  Plus,
  Trash2,
  Banknote,
  Smartphone,
  Building2,
  Repeat,
  ArrowLeftRight,
  ScrollText,
  Landmark,
  Wallet,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser, isAdmin } from "@/lib/auth/user-context";
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
  valorFipe?: number;
  valorAnunciado: number;
  valorMinimo: number;
  comissao?: number;
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

type FormaPagamento =
  | "dinheiro"
  | "pix"
  | "transferencia"
  | "cartao-debito"
  | "cartao-credito"
  | "financiamento-banco"
  | "parcelado-loja"
  | "troca"
  | "cheque"
  | "consorcio";

type Pagamento = {
  uid: string;
  forma: FormaPagamento;
  valor: number | "";
  // cartão crédito
  parcelasCartao?: number | "";
  // financiamento banco
  banco?: string;
  numeroContratoBanco?: string;
  parcelasContrato?: number | "";
  // parcelado loja
  parcelasLoja?: number | "";
  parcelasPagasLoja?: number | "";
  valorParcelaLoja?: number | "";
  primeiraParcelaEm?: string;
  // troca
  itemRecebido?: string;
  // geral
  observacao?: string;
};

type VendaForm = {
  // Cliente
  clienteMode: "existente" | "novo";
  clienteId: string;
  novoCliNome: string;
  novoCliTelefone: string;
  novoCliEmail: string;
  novoCliCpf: string;

  // Moto
  motoId: string;

  // Negociação
  valorVendido: number | "";
  comissao: number | "";
  pagamentos: Pagamento[];

  observacoes: string;
};

const FORMA_META: Record<
  FormaPagamento,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    headerBg: string;
    headerText: string;
    cardBg: string;
    cardBorder: string;
  }
> = {
  dinheiro: {
    label: "Dinheiro",
    icon: Banknote,
    headerBg: "bg-emerald-100",
    headerText: "text-emerald-700",
    cardBg: "bg-emerald-50/40",
    cardBorder: "border-emerald-200",
  },
  pix: {
    label: "PIX",
    icon: Smartphone,
    headerBg: "bg-green-100",
    headerText: "text-green-700",
    cardBg: "bg-green-50/50",
    cardBorder: "border-green-200",
  },
  transferencia: {
    label: "Transferência",
    icon: Landmark,
    headerBg: "bg-teal-100",
    headerText: "text-teal-700",
    cardBg: "bg-teal-50/40",
    cardBorder: "border-teal-200",
  },
  "cartao-debito": {
    label: "Cartão débito",
    icon: CreditCard,
    headerBg: "bg-sky-100",
    headerText: "text-sky-700",
    cardBg: "bg-sky-50/50",
    cardBorder: "border-sky-200",
  },
  "cartao-credito": {
    label: "Cartão crédito",
    icon: CreditCard,
    headerBg: "bg-blue-100",
    headerText: "text-blue-700",
    cardBg: "bg-blue-50/50",
    cardBorder: "border-blue-200",
  },
  "financiamento-banco": {
    label: "Financiamento (banco)",
    icon: Building2,
    headerBg: "bg-indigo-100",
    headerText: "text-indigo-700",
    cardBg: "bg-indigo-50/50",
    cardBorder: "border-indigo-200",
  },
  "parcelado-loja": {
    label: "Parcelado da loja",
    icon: CalendarClock,
    headerBg: "bg-red-100",
    headerText: "text-red-700",
    cardBg: "bg-red-50/60",
    cardBorder: "border-red-200",
  },
  troca: {
    label: "Troca",
    icon: ArrowLeftRight,
    headerBg: "bg-amber-100",
    headerText: "text-amber-700",
    cardBg: "bg-amber-50/50",
    cardBorder: "border-amber-200",
  },
  cheque: {
    label: "Cheque",
    icon: ScrollText,
    headerBg: "bg-stone-100",
    headerText: "text-stone-700",
    cardBg: "bg-stone-50/60",
    cardBorder: "border-stone-200",
  },
  consorcio: {
    label: "Consórcio",
    icon: Repeat,
    headerBg: "bg-purple-100",
    headerText: "text-purple-700",
    cardBg: "bg-purple-50/50",
    cardBorder: "border-purple-200",
  },
};

function genUid() {
  return Math.random().toString(36).slice(2, 10);
}

function novoPagamento(forma: FormaPagamento = "pix"): Pagamento {
  const base: Pagamento = { uid: genUid(), forma, valor: "" };
  if (forma === "parcelado-loja") {
    base.parcelasPagasLoja = 0;
  }
  return base;
}

const initial: VendaForm = {
  clienteMode: "existente",
  clienteId: "",
  novoCliNome: "",
  novoCliTelefone: "",
  novoCliEmail: "",
  novoCliCpf: "",
  motoId: "",
  valorVendido: "",
  comissao: "",
  pagamentos: [novoPagamento("pix")],
  observacoes: "",
};

const TOLERANCIA = 0.01;

export default function NovaVendaPage() {
  const router = useRouter();
  const me = useCurrentUser();
  const podeOverride = isAdmin(me);
  const [form, setForm] = useState<VendaForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clienteSearch, setClienteSearch] = useState("");

  const { data: clientesData, loading: loadingClientes } = useApi<{
    users: ClienteApi[];
  }>("/api/users?role=cliente");

  const { data: motosData, loading: loadingMotos } = useApi<{
    motos: MotoApi[];
  }>("/api/motos?tipo=venda&status=disponivel");

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

  function set<K extends keyof VendaForm>(key: K, value: VendaForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function handleMotoChange(motoId: string) {
    const moto = todasMotos.find((m) => m._id === motoId) ?? null;
    setForm((p) => ({
      ...p,
      motoId,
      valorVendido:
        moto && p.valorVendido === "" ? moto.valorAnunciado : p.valorVendido,
      comissao: moto && p.comissao === "" ? moto.comissao ?? 0 : p.comissao,
    }));
  }

  // ---- Pagamentos helpers ----
  function addPagamento() {
    setForm((p) => ({ ...p, pagamentos: [...p.pagamentos, novoPagamento()] }));
  }

  function removePagamento(uid: string) {
    setForm((p) => ({
      ...p,
      pagamentos:
        p.pagamentos.length > 1
          ? p.pagamentos.filter((x) => x.uid !== uid)
          : p.pagamentos,
    }));
  }

  function updatePagamento(uid: string, patch: Partial<Pagamento>) {
    setForm((p) => ({
      ...p,
      pagamentos: p.pagamentos.map((pg) => {
        if (pg.uid !== uid) return pg;
        const next: Pagamento = { ...pg, ...patch };

        // se forma mudou, limpa campos não relevantes
        if (patch.forma && patch.forma !== pg.forma) {
          const v = next.valor;
          const reset: Pagamento = {
            uid: pg.uid,
            forma: patch.forma,
            valor: v,
            observacao: pg.observacao,
          };
          if (patch.forma === "parcelado-loja") reset.parcelasPagasLoja = 0;
          return reset;
        }

        // recalcula valorParcelaLoja se relevante e não foi setado manualmente nesta atualização
        if (
          next.forma === "parcelado-loja" &&
          patch.valorParcelaLoja === undefined &&
          (patch.valor !== undefined || patch.parcelasLoja !== undefined)
        ) {
          const valorNum = typeof next.valor === "number" ? next.valor : 0;
          const parcelas =
            typeof next.parcelasLoja === "number" ? next.parcelasLoja : 0;
          if (parcelas > 0 && valorNum > 0) {
            next.valorParcelaLoja =
              Math.round((valorNum / parcelas) * 100) / 100;
          }
        }
        return next;
      }),
    }));
  }

  // ---- Totais ----
  const valorVendidoNum =
    typeof form.valorVendido === "number" ? form.valorVendido : 0;
  const totalPagamentos = useMemo(
    () =>
      form.pagamentos.reduce(
        (s, p) => s + (typeof p.valor === "number" ? p.valor : 0),
        0
      ),
    [form.pagamentos]
  );
  const diferenca = valorVendidoNum - totalPagamentos;
  const bate = Math.abs(diferenca) < TOLERANCIA && valorVendidoNum > 0;

  const valorMinimoMoto = motoSelecionada?.valorMinimo ?? 0;
  const abaixoMinimo =
    motoSelecionada !== null &&
    valorVendidoNum > 0 &&
    valorVendidoNum < valorMinimoMoto;

  function clienteSelecionado(): ClienteApi | undefined {
    return clientesData?.users.find((u) => u._id === form.clienteId);
  }

  function validarPagamentos(): string | null {
    for (const pg of form.pagamentos) {
      if (pg.valor === "" || (typeof pg.valor === "number" && pg.valor <= 0)) {
        return `Informe o valor do pagamento em ${FORMA_META[pg.forma].label}.`;
      }
      if (pg.forma === "cartao-credito") {
        if (!pg.parcelasCartao || Number(pg.parcelasCartao) < 1) {
          return "Informe as parcelas do cartão de crédito.";
        }
      }
      if (pg.forma === "financiamento-banco") {
        if (!pg.banco?.trim()) return "Informe o banco do financiamento.";
        if (!pg.parcelasContrato || Number(pg.parcelasContrato) < 1) {
          return "Informe as parcelas do financiamento.";
        }
      }
      if (pg.forma === "parcelado-loja") {
        if (!pg.parcelasLoja || Number(pg.parcelasLoja) < 1) {
          return "Informe o total de parcelas da loja.";
        }
        if (!pg.primeiraParcelaEm) {
          return "Informe a data da primeira parcela da loja.";
        }
      }
      if (pg.forma === "troca" && !pg.itemRecebido?.trim()) {
        return "Descreva o item recebido na troca.";
      }
    }
    return null;
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
    if (form.valorVendido === "" || valorVendidoNum <= 0) {
      const m = "Informe o valor da venda.";
      setError(m);
      toast.error(m);
      return;
    }
    if (abaixoMinimo && !podeOverride) {
      const m = `Valor abaixo do mínimo (${formatCurrency(valorMinimoMoto)}). Apenas admin pode autorizar.`;
      setError(m);
      toast.error(m);
      return;
    }
    const pagErr = validarPagamentos();
    if (pagErr) {
      setError(pagErr);
      toast.error(pagErr);
      return;
    }
    if (!bate) {
      const m =
        diferenca > 0
          ? `Faltam ${formatCurrency(diferenca)} para fechar a venda.`
          : `Sobram ${formatCurrency(-diferenca)} nos pagamentos.`;
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

      const pagamentosPayload = form.pagamentos.map((p) => {
        const base: Record<string, unknown> = {
          forma: p.forma,
          valor: Number(p.valor),
        };
        if (p.forma === "cartao-credito" && p.parcelasCartao)
          base.parcelasCartao = Number(p.parcelasCartao);
        if (p.forma === "financiamento-banco") {
          if (p.banco) base.banco = p.banco;
          if (p.numeroContratoBanco)
            base.numeroContratoBanco = p.numeroContratoBanco;
          if (p.parcelasContrato)
            base.parcelasContrato = Number(p.parcelasContrato);
        }
        if (p.forma === "parcelado-loja") {
          if (p.parcelasLoja) base.parcelasLoja = Number(p.parcelasLoja);
          base.parcelasPagasLoja = Number(p.parcelasPagasLoja ?? 0);
          if (p.valorParcelaLoja)
            base.valorParcelaLoja = Number(p.valorParcelaLoja);
          if (p.primeiraParcelaEm)
            base.primeiraParcelaEm = p.primeiraParcelaEm;
        }
        if (p.forma === "troca" && p.itemRecebido)
          base.itemRecebido = p.itemRecebido;
        if (p.observacao) base.observacao = p.observacao;
        return base;
      });

      const payload = {
        motoId: motoSelecionada._id,
        motoModelo: `${motoSelecionada.marca} ${motoSelecionada.modelo} ${motoSelecionada.anoModelo}`,
        motoMarca: motoSelecionada.marca,
        motoAno: motoSelecionada.anoModelo,
        motoValorAnunciado: motoSelecionada.valorAnunciado,
        motoValorMinimo: motoSelecionada.valorMinimo,

        clienteId,
        clienteNome,
        clienteTelefone,
        clienteEmail,
        clienteCpf,

        vendedorId: me.id,
        vendedorNome: me.nome,

        valorVendido: valorVendidoNum,
        pagamentos: pagamentosPayload,
        comissao: typeof form.comissao === "number" ? form.comissao : 0,

        status: "concluida" as const,
        data: new Date().toISOString(),
        observacoes: form.observacoes || undefined,
      };

      const vendaRes = await apiPost<{ venda: { _id: string } }>(
        "/api/vendas",
        payload
      );
      if (vendaRes.error) throw new Error(vendaRes.error);

      const motoUpd = await apiPatch(`/api/motos/${motoSelecionada._id}`, {
        status: "vendida",
      });
      if (motoUpd.error) {
        toast.warning("Venda salva, mas falhou ao atualizar status da moto");
      }

      toast.success("Venda registrada com sucesso!");
      router.push("/dashboard/vendas");
    } catch (err) {
      const m = err instanceof Error ? err.message : "Erro ao registrar venda";
      setError(m);
      toast.error(m);
      setSaving(false);
    }
  }

  const confirmDesabilitado = saving || !bate;

  return (
    <form onSubmit={handleSubmit}>
      <Link
        href="/dashboard/vendas"
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para vendas
      </Link>

      <PageHeader
        title="Nova venda"
        description="Registre a venda de uma moto do catálogo"
      >
        <Link href="/dashboard/vendas">
          <Button type="button" variant="outline" disabled={saving}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={confirmDesabilitado}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Confirmar venda
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

      {/* RESUMO AO VIVO */}
      <Card
        className={`p-5 mb-6 border-2 ${
          valorVendidoNum <= 0
            ? "border-keu-black/10"
            : bate
              ? "border-emerald-300 bg-emerald-50/40"
              : "border-amber-300 bg-amber-50/40"
        }`}
      >
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-semibold uppercase text-keu-black/60 flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total venda
            </div>
            <div className="text-xl font-bold text-keu-black mt-1">
              {formatCurrency(valorVendidoNum)}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-keu-black/60 flex items-center gap-1">
              <Wallet className="h-3 w-3" /> Total recebido
            </div>
            <div className="text-xl font-bold text-keu-black mt-1">
              {formatCurrency(totalPagamentos)}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-keu-black/60 flex items-center gap-1">
              <Info className="h-3 w-3" /> Saldo
            </div>
            <div className="mt-1">
              {valorVendidoNum <= 0 ? (
                <div className="text-sm text-keu-black/50">
                  Informe o valor da venda
                </div>
              ) : bate ? (
                <Badge className="bg-emerald-600 text-white">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Total bate
                </Badge>
              ) : diferenca > 0 ? (
                <Badge className="bg-amber-500 text-white">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  Faltam {formatCurrency(diferenca)}
                </Badge>
              ) : (
                <Badge className="bg-amber-500 text-white">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  Sobra {formatCurrency(-diferenca)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

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
                  Quem está comprando
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
                    cliente&quot; ao lado.
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
                  Selecione a moto vendida
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
                      ? "Nenhuma moto disponível"
                      : "Selecione uma moto..."}
                </option>
                {todasMotos.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.marca} {m.modelo} {m.anoModelo}
                    {m.placa ? ` • ${m.placa}` : ""}
                    {m.cor ? ` • ${m.cor}` : ""} —{" "}
                    {formatCurrency(m.valorAnunciado)}
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
                      {motoSelecionada.placa
                        ? ` • Placa ${motoSelecionada.placa}`
                        : ""}
                      {motoSelecionada.cor ? ` • ${motoSelecionada.cor}` : ""}
                      {motoSelecionada.km !== undefined
                        ? ` • ${motoSelecionada.km.toLocaleString("pt-BR")} km`
                        : ""}
                    </div>
                    <div className="flex gap-3 mt-2 text-sm flex-wrap">
                      <div>
                        <span className="text-keu-black/60">Anunciado:</span>{" "}
                        <span className="font-bold text-keu-red">
                          {formatCurrency(motoSelecionada.valorAnunciado)}
                        </span>
                      </div>
                      <div>
                        <span className="text-keu-black/60">Mínimo:</span>{" "}
                        <span className="font-semibold">
                          {formatCurrency(motoSelecionada.valorMinimo)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* NEGOCIAÇÃO */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Negociação</h2>
                <p className="text-sm text-keu-black/60">
                  Valor fechado e comissão
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Valor vendido</Label>
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
                    value={form.valorVendido}
                    onChange={(e) =>
                      set(
                        "valorVendido",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
                {abaixoMinimo && (
                  <div
                    className={`mt-2 flex items-start gap-2 text-xs p-2 rounded-md ${
                      podeOverride
                        ? "bg-amber-50 border border-amber-200 text-amber-800"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Abaixo do mínimo de{" "}
                      <strong>{formatCurrency(valorMinimoMoto)}</strong>.{" "}
                      {podeOverride
                        ? "Admin pode autorizar a venda."
                        : "Apenas admin pode autorizar."}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Label>Comissão (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                    R$
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    className="pl-9"
                    placeholder={
                      motoSelecionada?.comissao !== undefined
                        ? `Sugerido: ${motoSelecionada.comissao}`
                        : "0"
                    }
                    value={form.comissao}
                    onChange={(e) =>
                      set(
                        "comissao",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
              </div>

              <div className="col-span-2">
                <Label>Observações</Label>
                <Textarea
                  rows={3}
                  placeholder="Detalhes da negociação, acordos..."
                  value={form.observacoes}
                  onChange={(e) => set("observacoes", e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* PAGAMENTOS */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-keu-black/5">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Formas de pagamento</h2>
                  <p className="text-sm text-keu-black/60">
                    Combine quantas formas precisar até bater o total
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addPagamento}
                size="sm"
              >
                <Plus className="h-4 w-4" /> Adicionar forma
              </Button>
            </div>

            <div className="space-y-4">
              {form.pagamentos.map((pg, idx) => {
                const meta = FORMA_META[pg.forma];
                const Icon = meta.icon;
                const podeRemover = form.pagamentos.length > 1;
                return (
                  <Card
                    key={pg.uid}
                    className={`overflow-hidden border-2 ${meta.cardBorder} ${meta.cardBg}`}
                  >
                    {/* header */}
                    <div
                      className={`flex items-center gap-3 px-4 py-3 ${meta.headerBg} ${meta.headerText}`}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="font-bold text-sm flex-1">
                        {meta.label}
                      </div>
                      <Badge variant="outline" className="bg-white">
                        #{idx + 1}
                      </Badge>
                    </div>

                    {/* body */}
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label required>Forma</Label>
                          <Select
                            value={pg.forma}
                            onChange={(e) =>
                              updatePagamento(pg.uid, {
                                forma: e.target.value as FormaPagamento,
                              })
                            }
                          >
                            {(Object.keys(FORMA_META) as FormaPagamento[]).map(
                              (k) => (
                                <option key={k} value={k}>
                                  {FORMA_META[k].label}
                                </option>
                              )
                            )}
                          </Select>
                        </div>
                        <div>
                          <Label required>Valor</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                              R$
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="pl-9"
                              value={pg.valor}
                              onChange={(e) =>
                                updatePagamento(pg.uid, {
                                  valor: e.target.value
                                    ? Number(e.target.value)
                                    : "",
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Campos condicionais */}
                      {pg.forma === "cartao-credito" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label required>Parcelas</Label>
                            <Input
                              type="number"
                              min="1"
                              max="24"
                              placeholder="Ex: 6"
                              value={pg.parcelasCartao ?? ""}
                              onChange={(e) =>
                                updatePagamento(pg.uid, {
                                  parcelasCartao: e.target.value
                                    ? Number(e.target.value)
                                    : "",
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {pg.forma === "financiamento-banco" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label required>Banco</Label>
                            <Input
                              placeholder="Ex: Banco do Brasil"
                              value={pg.banco ?? ""}
                              onChange={(e) =>
                                updatePagamento(pg.uid, {
                                  banco: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Nº do contrato</Label>
                            <Input
                              placeholder="Opcional"
                              value={pg.numeroContratoBanco ?? ""}
                              onChange={(e) =>
                                updatePagamento(pg.uid, {
                                  numeroContratoBanco: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label required>Parcelas do contrato</Label>
                            <Input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="Ex: 48"
                              value={pg.parcelasContrato ?? ""}
                              onChange={(e) =>
                                updatePagamento(pg.uid, {
                                  parcelasContrato: e.target.value
                                    ? Number(e.target.value)
                                    : "",
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {pg.forma === "parcelado-loja" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label required>Parcelas (total)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="60"
                              placeholder="Ex: 12"
                              value={pg.parcelasLoja ?? ""}
                              onChange={(e) =>
                                updatePagamento(pg.uid, {
                                  parcelasLoja: e.target.value
                                    ? Number(e.target.value)
                                    : "",
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Parcelas já pagas</Label>
                            <Input
                              type="number"
                              min="0"
                              value={pg.parcelasPagasLoja ?? 0}
                              onChange={(e) =>
                                updatePagamento(pg.uid, {
                                  parcelasPagasLoja: e.target.value
                                    ? Number(e.target.value)
                                    : 0,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Valor da parcela</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                                R$
                              </span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="pl-9"
                                placeholder="Calculado auto"
                                value={pg.valorParcelaLoja ?? ""}
                                onChange={(e) =>
                                  updatePagamento(pg.uid, {
                                    valorParcelaLoja: e.target.value
                                      ? Number(e.target.value)
                                      : "",
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <Label required>Primeira parcela em</Label>
                            <Input
                              type="date"
                              value={pg.primeiraParcelaEm ?? ""}
                              onChange={(e) =>
                                updatePagamento(pg.uid, {
                                  primeiraParcelaEm: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="col-span-2 text-xs text-red-700 bg-red-100/60 border border-red-200 rounded-md px-3 py-2 flex items-start gap-2">
                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            <span>
                              Parcelamento da loja — saldo será cobrado
                              diretamente pela Keu Motos.
                            </span>
                          </div>
                        </div>
                      )}

                      {pg.forma === "troca" && (
                        <div>
                          <Label required>Item recebido</Label>
                          <Input
                            placeholder="Ex: Honda CG 150 2018 — placa XYZ-1234"
                            value={pg.itemRecebido ?? ""}
                            onChange={(e) =>
                              updatePagamento(pg.uid, {
                                itemRecebido: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}

                      <div>
                        <Label>Observação</Label>
                        <Input
                          placeholder="Opcional"
                          value={pg.observacao ?? ""}
                          onChange={(e) =>
                            updatePagamento(pg.uid, {
                              observacao: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* footer */}
                    {podeRemover && (
                      <div className="px-4 py-2 border-t border-keu-black/5 flex justify-end bg-white/50">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePagamento(pg.uid)}
                        >
                          <Trash2 className="h-4 w-4" /> Remover
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
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

          {motoSelecionada && valorVendidoNum > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase text-emerald-700">
                <Info className="h-3 w-3" />
                Resumo
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-keu-black/60">Anunciado:</span>
                  <span>
                    {formatCurrency(motoSelecionada.valorAnunciado)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-keu-black/60">Vendido:</span>
                  <span className="font-bold text-keu-red">
                    {formatCurrency(valorVendidoNum)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-keu-black/60">Comissão:</span>
                  <span>
                    {formatCurrency(
                      typeof form.comissao === "number" ? form.comissao : 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-keu-black/5 font-bold">
                  <span>Diferença vs anúncio:</span>
                  <span
                    className={
                      valorVendidoNum >= motoSelecionada.valorAnunciado
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {valorVendidoNum >= motoSelecionada.valorAnunciado
                      ? "+"
                      : ""}
                    {formatCurrency(
                      valorVendidoNum - motoSelecionada.valorAnunciado
                    )}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-keu-black/5">
        <Link href="/dashboard/vendas">
          <Button type="button" variant="outline" disabled={saving}>
            Cancelar
          </Button>
        </Link>
        <Button type="submit" size="lg" disabled={confirmDesabilitado}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Confirmar venda
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
