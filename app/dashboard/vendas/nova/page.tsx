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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
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
  | "a-vista"
  | "financiado"
  | "cartao"
  | "consorcio"
  | "troca";

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
  formaPagamento: FormaPagamento;
  parcelas: number | "";
  comissao: number | "";

  observacoes: string;
};

const initial: VendaForm = {
  clienteMode: "existente",
  clienteId: "",
  novoCliNome: "",
  novoCliTelefone: "",
  novoCliEmail: "",
  novoCliCpf: "",
  motoId: "",
  valorVendido: "",
  formaPagamento: "a-vista",
  parcelas: "",
  comissao: "",
  observacoes: "",
};

export default function NovaVendaPage() {
  const router = useRouter();
  const me = getCurrentUser();
  const podeOverride = isAdmin(me);
  const [form, setForm] = useState<VendaForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clienteSearch, setClienteSearch] = useState("");

  // Carrega clientes e motos
  const { data: clientesData, loading: loadingClientes } = useApi<{
    users: ClienteApi[];
  }>("/api/users?role=cliente");

  const { data: motosData, loading: loadingMotos } = useApi<{
    motos: MotoApi[];
  }>("/api/motos?tipo=venda&status=disponivel");

  // Inclui motos do tipo "ambos" (também elegíveis pra venda)
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

  // Auto-preenche sugestões quando uma moto é selecionada
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

  // ---- Validações ----
  const valorVendidoNum =
    typeof form.valorVendido === "number" ? form.valorVendido : 0;
  const valorMinimoMoto = motoSelecionada?.valorMinimo ?? 0;
  const abaixoMinimo =
    motoSelecionada !== null && valorVendidoNum > 0 && valorVendidoNum < valorMinimoMoto;

  const exigeParcelas =
    form.formaPagamento === "financiado" || form.formaPagamento === "cartao";

  function clienteSelecionado(): ClienteApi | undefined {
    return clientesData?.users.find((u) => u._id === form.clienteId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validações de fluxo
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
    if (exigeParcelas && (!form.parcelas || Number(form.parcelas) < 1)) {
      const m = "Informe o número de parcelas.";
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
        // Cria novo cliente
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
        formaPagamento: form.formaPagamento,
        parcelas: exigeParcelas ? Number(form.parcelas) : undefined,
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

      // Atualiza status da moto pra "vendida"
      const motoUpd = await apiPatch(`/api/motos/${motoSelecionada._id}`, {
        status: "vendida",
      });
      if (motoUpd.error) {
        // Não bloqueia o fluxo, só avisa
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
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Registrar Venda
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
                    {m.marca} {m.modelo} {m.anoModelo} —{" "}
                    {formatCurrency(m.valorAnunciado)}
                  </option>
                ))}
              </Select>
            </div>

            {motoSelecionada && (
              <div className="mt-4 p-4 bg-keu-gray-light rounded-xl">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-keu-black to-keu-gray rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
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
                  Valor fechado, forma de pagamento e comissão
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
                    step="100"
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
                <Label required>Forma de pagamento</Label>
                <Select
                  required
                  value={form.formaPagamento}
                  onChange={(e) => {
                    const fp = e.target.value as FormaPagamento;
                    set("formaPagamento", fp);
                    if (fp !== "financiado" && fp !== "cartao") {
                      set("parcelas", "");
                    }
                  }}
                >
                  <option value="a-vista">À vista</option>
                  <option value="financiado">Financiado</option>
                  <option value="cartao">Cartão</option>
                  <option value="consorcio">Consórcio</option>
                  <option value="troca">Troca</option>
                </Select>
              </div>

              {exigeParcelas && (
                <div>
                  <Label required>Parcelas</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      required
                      placeholder="Ex: 12"
                      className="pl-9"
                      value={form.parcelas}
                      onChange={(e) =>
                        set(
                          "parcelas",
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    />
                  </div>
                </div>
              )}

              <div className={exigeParcelas ? "" : "col-span-1"}>
                <Label>Comissão (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-keu-black/40">
                    R$
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="10"
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
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Registrar Venda
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
