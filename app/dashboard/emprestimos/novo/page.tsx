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
  UserPlus,
  Search,
  Banknote,
  Calendar,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";
import { apiPost } from "@/lib/api-client";

interface ClienteApi {
  clienteId?: string;
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  clienteCpf?: string;
}

const FREQUENCIAS = [
  { v: "semanal", l: "Semanal (7 dias)" },
  { v: "quinzenal", l: "Quinzenal (15 dias)" },
  { v: "mensal", l: "Mensal (30 dias)" },
  { v: "bimestral", l: "Bimestral (60 dias)" },
  { v: "trimestral", l: "Trimestral (90 dias)" },
  { v: "custom", l: "Customizada (X dias)" },
] as const;

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function NovoEmprestimoPage() {
  const router = useRouter();
  const [tipoCliente, setTipoCliente] = useState<"novo" | "existente">("novo");
  const [search, setSearch] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteApi | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    clienteNome: "",
    clienteTelefone: "",
    clienteEmail: "",
    clienteCpf: "",
    valorEmprestado: "",
    valorTotal: "",
    dataEmprestimo: isoToday(),
    dataPrimeiraParcela: isoPlusDays(30),
    totalParcelas: "1",
    frequencia: "mensal" as (typeof FREQUENCIAS)[number]["v"],
    intervaloDias: "",
    observacoes: "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Busca clientes existentes pra "Selecionar existente"
  const { data: clientesData, loading: loadingClientes } = useApi<{
    clientes: ClienteApi[];
  }>(tipoCliente === "existente" ? "/api/clientes" : null, [tipoCliente]);
  const clientes = clientesData?.clientes ?? [];
  const clientesFiltrados = useMemo(() => {
    if (!search.trim()) return clientes.slice(0, 30);
    const term = search.toLowerCase();
    return clientes
      .filter(
        (c) =>
          c.clienteNome.toLowerCase().includes(term) ||
          (c.clienteCpf ?? "").toLowerCase().includes(term) ||
          (c.clienteTelefone ?? "").toLowerCase().includes(term)
      )
      .slice(0, 30);
  }, [clientes, search]);

  // Cálculos derivados em tempo real
  const valorEmp = parseFloat(form.valorEmprestado) || 0;
  const valorTot = parseFloat(form.valorTotal) || 0;
  const totalParc = parseInt(form.totalParcelas, 10) || 1;
  const juros = Math.max(0, valorTot - valorEmp);
  const taxa = valorEmp > 0 ? (juros / valorEmp) * 100 : 0;
  const valorParcela = totalParc > 0 ? valorTot / totalParc : 0;

  function selectCliente(c: ClienteApi) {
    setClienteSelecionado(c);
    setForm((f) => ({
      ...f,
      clienteNome: c.clienteNome,
      clienteTelefone: c.clienteTelefone ?? "",
      clienteEmail: c.clienteEmail ?? "",
      clienteCpf: c.clienteCpf ?? "",
    }));
  }

  function deselectCliente() {
    setClienteSelecionado(null);
    setForm((f) => ({
      ...f,
      clienteNome: "",
      clienteTelefone: "",
      clienteEmail: "",
      clienteCpf: "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.clienteNome.trim()) {
      setError("Nome do cliente é obrigatório");
      return;
    }
    if (valorEmp <= 0) {
      setError("Valor emprestado deve ser maior que 0");
      return;
    }
    if (valorTot < valorEmp) {
      setError("Valor total deve ser maior ou igual ao emprestado");
      return;
    }
    if (totalParc < 1) {
      setError("Total de parcelas inválido");
      return;
    }
    if (
      form.frequencia === "custom" &&
      (!form.intervaloDias || parseInt(form.intervaloDias, 10) < 1)
    ) {
      setError("Informe o intervalo em dias pra frequência customizada");
      return;
    }

    setSaving(true);
    try {
      const r = await apiPost<{ emprestimo: { _id: string } }>(
        "/api/emprestimos",
        {
          clienteId: clienteSelecionado?.clienteId,
          clienteNome: form.clienteNome,
          clienteTelefone: form.clienteTelefone || undefined,
          clienteEmail: form.clienteEmail || undefined,
          clienteCpf: form.clienteCpf || undefined,
          valorEmprestado: valorEmp,
          valorTotal: valorTot,
          dataEmprestimo: form.dataEmprestimo,
          dataPrimeiraParcela: form.dataPrimeiraParcela,
          totalParcelas: totalParc,
          frequencia: form.frequencia,
          intervaloDias:
            form.frequencia === "custom" ? parseInt(form.intervaloDias, 10) : undefined,
          observacoes: form.observacoes || undefined,
        }
      );
      if (r.error) {
        throw new Error(r.error);
      }
      toast.success("Empréstimo registrado");
      router.push(`/dashboard/emprestimos/${r.data?.emprestimo._id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro";
      setError(msg);
      toast.error(msg);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title="Novo empréstimo"
        description="Selecione um cliente ou cadastre um novo, defina valores e cronograma"
      >
        <Link href="/dashboard/emprestimos">
          <Button variant="outline" type="button">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Registrar empréstimo
            </>
          )}
        </Button>
      </PageHeader>

      {error && (
        <Card className="p-4 mb-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* CLIENTE */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Cliente</h2>
                <p className="text-xs text-keu-black/60">
                  Quem está pegando o empréstimo
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => {
                  setTipoCliente("novo");
                  deselectCliente();
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition ${
                  tipoCliente === "novo"
                    ? "bg-keu-red text-white"
                    : "bg-keu-gray-light text-keu-black/60 hover:bg-keu-gray"
                }`}
              >
                <UserPlus className="h-4 w-4 inline mr-1.5" />
                Cadastrar novo
              </button>
              <button
                type="button"
                onClick={() => setTipoCliente("existente")}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition ${
                  tipoCliente === "existente"
                    ? "bg-keu-red text-white"
                    : "bg-keu-gray-light text-keu-black/60 hover:bg-keu-gray"
                }`}
              >
                <Search className="h-4 w-4 inline mr-1.5" />
                Buscar existente
              </button>
            </div>

            {tipoCliente === "existente" && !clienteSelecionado && (
              <div>
                <Input
                  placeholder="Buscar por nome, CPF ou telefone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mb-3"
                />
                {loadingClientes ? (
                  <div className="text-sm text-keu-black/60 flex items-center gap-2 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando clientes…
                  </div>
                ) : clientesFiltrados.length === 0 ? (
                  <div className="text-sm text-keu-black/60 py-3">
                    Nenhum cliente encontrado. Use "Cadastrar novo" se ele ainda não
                    existe.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-1 border border-keu-black/5 rounded-lg p-1">
                    {clientesFiltrados.map((c, i) => (
                      <button
                        key={(c.clienteId ?? "") + c.clienteNome + i}
                        type="button"
                        onClick={() => selectCliente(c)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-keu-gray-light transition text-sm"
                      >
                        <div className="font-medium">{c.clienteNome}</div>
                        <div className="text-xs text-keu-black/60 flex gap-3 mt-0.5">
                          {c.clienteTelefone && <span>{c.clienteTelefone}</span>}
                          {c.clienteCpf && <span>CPF {c.clienteCpf}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tipoCliente === "existente" && clienteSelecionado && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                <div className="bg-emerald-600 text-white rounded-full p-1.5">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{clienteSelecionado.clienteNome}</div>
                  <div className="text-xs text-keu-black/60 flex gap-3 mt-0.5">
                    {clienteSelecionado.clienteTelefone && (
                      <span>{clienteSelecionado.clienteTelefone}</span>
                    )}
                    {clienteSelecionado.clienteCpf && (
                      <span>CPF {clienteSelecionado.clienteCpf}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={deselectCliente}
                  className="text-xs text-keu-red hover:underline"
                >
                  Trocar
                </button>
              </div>
            )}

            {tipoCliente === "novo" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="nome" required>
                    Nome completo
                  </Label>
                  <Input
                    id="nome"
                    required
                    value={form.clienteNome}
                    onChange={(e) => set("clienteNome", e.target.value)}
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div>
                  <Label htmlFor="tel">Telefone / WhatsApp</Label>
                  <Input
                    id="tel"
                    value={form.clienteTelefone}
                    onChange={(e) => set("clienteTelefone", e.target.value)}
                    placeholder="(88) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={form.clienteCpf}
                    onChange={(e) => set("clienteCpf", e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.clienteEmail}
                    onChange={(e) => set("clienteEmail", e.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* VALORES */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Valores</h2>
                <p className="text-xs text-keu-black/60">
                  Quanto saiu do caixa e quanto vai voltar
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emp" required>
                  Valor emprestado (R$)
                </Label>
                <Input
                  id="emp"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.valorEmprestado}
                  onChange={(e) => set("valorEmprestado", e.target.value)}
                  placeholder="1000.00"
                />
                <div className="text-xs text-keu-black/60 mt-1">
                  Principal que sai do caixa hoje
                </div>
              </div>
              <div>
                <Label htmlFor="tot" required>
                  Valor total a receber (R$)
                </Label>
                <Input
                  id="tot"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.valorTotal}
                  onChange={(e) => set("valorTotal", e.target.value)}
                  placeholder="1100.00"
                />
                <div className="text-xs text-keu-black/60 mt-1">
                  Principal + juros
                </div>
              </div>
            </div>
          </Card>

          {/* CRONOGRAMA */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Cronograma</h2>
                <p className="text-xs text-keu-black/60">
                  Quantas parcelas e de quanto em quanto tempo
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataEmp">Data do empréstimo</Label>
                <Input
                  id="dataEmp"
                  type="date"
                  value={form.dataEmprestimo}
                  onChange={(e) => set("dataEmprestimo", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="data1" required>
                  Data da primeira parcela
                </Label>
                <Input
                  id="data1"
                  type="date"
                  required
                  value={form.dataPrimeiraParcela}
                  onChange={(e) => set("dataPrimeiraParcela", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="parc" required>
                  Total de parcelas
                </Label>
                <Input
                  id="parc"
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={form.totalParcelas}
                  onChange={(e) => set("totalParcelas", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="freq" required>
                  Frequência das parcelas
                </Label>
                <Select
                  id="freq"
                  required
                  value={form.frequencia}
                  onChange={(e) =>
                    set("frequencia", e.target.value as typeof form.frequencia)
                  }
                >
                  {FREQUENCIAS.map((f) => (
                    <option key={f.v} value={f.v}>
                      {f.l}
                    </option>
                  ))}
                </Select>
              </div>
              {form.frequencia === "custom" && (
                <div className="sm:col-span-2">
                  <Label htmlFor="intDias" required>
                    Intervalo em dias entre parcelas
                  </Label>
                  <Input
                    id="intDias"
                    type="number"
                    min="1"
                    required
                    value={form.intervaloDias}
                    onChange={(e) => set("intervaloDias", e.target.value)}
                    placeholder="ex: 10"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* OBS */}
          <Card className="p-6">
            <Label htmlFor="obs">Observações (opcional)</Label>
            <Textarea
              id="obs"
              rows={3}
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Combinados, garantia, contexto…"
            />
          </Card>
        </div>

        {/* RESUMO STICKY */}
        <div className="lg:sticky lg:top-24 self-start">
          <Card className="p-6 bg-gradient-to-br from-keu-black to-keu-black/90 text-white border-0">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5" />
              <h3 className="font-bold">Resumo</h3>
            </div>

            <div className="space-y-3">
              <Row label="Emprestado" value={formatCurrency(valorEmp)} />
              <Row
                label="Total a receber"
                value={formatCurrency(valorTot)}
                highlight
              />
              <div className="h-px bg-white/10 my-3" />
              <Row
                label="Juros"
                value={formatCurrency(juros)}
                accent="text-emerald-400"
              />
              <Row
                label="Taxa total"
                value={`${taxa.toFixed(2)}%`}
                accent="text-emerald-400"
              />
              <div className="h-px bg-white/10 my-3" />
              <Row label="Total parcelas" value={String(totalParc)} />
              <Row
                label="Valor da parcela"
                value={formatCurrency(valorParcela)}
                highlight
              />
              <Row
                label="Frequência"
                value={
                  FREQUENCIAS.find((f) => f.v === form.frequencia)?.l ?? "—"
                }
              />
            </div>

            {valorTot > 0 && valorEmp > 0 && valorTot < valorEmp && (
              <div className="mt-4 text-xs bg-red-500/20 border border-red-500/40 rounded-lg p-2 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Total menor
                que emprestado
              </div>
            )}
          </Card>
        </div>
      </div>
    </form>
  );
}

function Row({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-white/60">{label}</span>
      <span
        className={`font-bold ${
          highlight ? "text-lg" : ""
        } ${accent ?? "text-white"}`}
      >
        {value}
      </span>
    </div>
  );
}
