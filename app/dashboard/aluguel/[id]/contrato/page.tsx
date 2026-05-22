"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Bike,
  FileText,
  Users,
  Download,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApi } from "@/lib/hooks/use-api";
import {
  formatCpfInput,
  formatPhoneInput,
  formatCurrency,
  isValidCpf,
} from "@/lib/utils";

// "DD/MM/AAAA" → "AAAA-MM-DD" pra <input type="date"> (e vice-versa)
function toIsoDate(br: string): string {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}
function toBrDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

interface AluguelApi {
  _id: string;
  motoId: string;
  clienteId?: string;
  clienteNome?: string;
  clienteCpf?: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  dataInicio?: string;
  parcelas?: number;
  valorParcela?: number;
  valorEntrada?: number;
}

interface MotoApi {
  _id: string;
  marca: string;
  modelo: string;
  anoModelo?: number;
  cor?: string;
  placa?: string;
  chassi?: string;
  renavam?: string;
  km?: number;
}

interface ProfileApi {
  _id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  rg?: string;
  cnh?: string;
  cnh_validade?: string;
  // Campos pessoais (migração 0005). Podem vir undefined se a migração
  // ainda não rodou — fallback graceful pra string vazia.
  sexo?: string;
  nascimento?: string; // ISO date
  naturalidade?: string;
  profissao?: string;
  // Endereço aceita 2 formatos: JSONB estruturado (legado) ou { texto }
  // (novo, salvo pelo form de cliente). formatEndereco normaliza ambos.
  endereco?:
    | {
        texto?: string;
        rua?: string;
        numero?: string;
        bairro?: string;
        cidade?: string;
        uf?: string;
      }
    | null;
}

function formatEndereco(e?: ProfileApi["endereco"]): string {
  if (!e) return "";
  if (e.texto) return e.texto;
  const parts: string[] = [];
  if (e.rua) parts.push(e.rua + (e.numero ? `, ${e.numero}` : ""));
  if (e.bairro) parts.push(e.bairro);
  if (e.cidade) parts.push(e.cidade + (e.uf ? ` - ${e.uf}` : ""));
  return parts.join(", ");
}

function formatBRDate(iso?: string): string {
  if (!iso) return "";
  // YYYY-MM-DD → DD/MM/YYYY (sem timezone shift do new Date)
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
}

export default function NovoContratoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const aluguelId = params?.id;

  const { data: aluguelData } = useApi<{ aluguel: AluguelApi }>(
    aluguelId ? `/api/alugueis/${aluguelId}` : ""
  );
  const aluguel = aluguelData?.aluguel;

  const { data: motoData } = useApi<{ moto: MotoApi }>(
    aluguel?.motoId ? `/api/motos/${aluguel.motoId}` : ""
  );
  const moto = motoData?.moto;

  // Perfil do cliente (Supabase profiles) — só carrega se clienteId é um
  // UUID válido (Supabase auth). Cliente "anônimo" do aluguel não tem
  // profile — pula a chamada pra evitar 404 no console.
  const isUuid =
    aluguel?.clienteId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      aluguel.clienteId
    );
  const { data: profileData } = useApi<{ user: ProfileApi }>(
    isUuid ? `/api/users/${aluguel!.clienteId}` : ""
  );
  const profile = profileData?.user;

  const [form, setForm] = useState({
    // contratante
    nome: "",
    sexo: "",
    nascimento: "",
    cnh: "",
    natural: "",
    profissao: "",
    cpf: "",
    rg: "",
    endereco: "",
    telefone: "",
    email: "",
    // avalista
    avNome: "",
    avSexo: "",
    avNascimento: "",
    avCnh: "",
    avNatural: "",
    avProfissao: "",
    avCpf: "",
    avRg: "",
    avEndereco: "",
    avTelefone: "",
    avEmail: "",
    // plano
    parcelas: 0,
    valorEntrada: 0,
    valorParcela: 0,
    planoEscolhido: "Conquista",
    datasVencimento: "",
    vencimentoPrimeira: "",
    observacoes: "",
  });
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState<{ id: string; numero: string } | null>(null);

  // Pré-preenche quando dados chegam. setTimeout 0 contorna a regra
  // react-hooks/set-state-in-effect do React 19.
  useEffect(() => {
    if (!aluguel) return;
    const t = setTimeout(() => {
      setForm((p) => ({
        ...p,
        nome: p.nome || aluguel.clienteNome || "",
        cpf: p.cpf || aluguel.clienteCpf || "",
        telefone: p.telefone || aluguel.clienteTelefone || "",
        email: p.email || aluguel.clienteEmail || "",
        parcelas: p.parcelas || aluguel.parcelas || 0,
        valorEntrada: p.valorEntrada || aluguel.valorEntrada || 0,
        valorParcela: p.valorParcela || aluguel.valorParcela || 0,
        vencimentoPrimeira:
          p.vencimentoPrimeira ||
          (aluguel.dataInicio
            ? new Date(aluguel.dataInicio).toLocaleDateString("pt-BR")
            : ""),
      }));
    }, 0);
    return () => clearTimeout(t);
  }, [aluguel]);

  useEffect(() => {
    if (!profile) return;
    const t = setTimeout(() => {
      setForm((p) => ({
        ...p,
        nome: p.nome || profile.nome || "",
        cpf: p.cpf || (profile.cpf ? formatCpfInput(profile.cpf) : ""),
        rg: p.rg || profile.rg || "",
        cnh: p.cnh || profile.cnh || "",
        // Novos campos vindo do profile (migration 0005)
        sexo: p.sexo || profile.sexo || "",
        nascimento: p.nascimento || formatBRDate(profile.nascimento),
        natural: p.natural || profile.naturalidade || "",
        profissao: p.profissao || profile.profissao || "",
        telefone:
          p.telefone ||
          (profile.telefone ? formatPhoneInput(profile.telefone) : ""),
        email: p.email || profile.email || "",
        endereco: p.endereco || formatEndereco(profile.endereco),
      }));
    }, 0);
    return () => clearTimeout(t);
  }, [profile]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!moto) {
      toast.error("Moto do aluguel não encontrada");
      return;
    }
    if (!form.nome.trim() || !form.cpf.trim()) {
      toast.error("Nome e CPF do contratante são obrigatórios");
      return;
    }
    if (!isValidCpf(form.cpf)) {
      toast.error("CPF do contratante é inválido — confira os dígitos");
      return;
    }
    if (form.avNome.trim() && form.avCpf.trim() && !isValidCpf(form.avCpf)) {
      toast.error("CPF do avalista é inválido");
      return;
    }
    if (!form.parcelas || !form.valorParcela) {
      toast.error("Informe quantidade de parcelas e valor da parcela");
      return;
    }

    setSaving(true);
    try {
      const body = {
        aluguelId,
        motoId: moto._id,
        clienteId: aluguel?.clienteId,
        contratante: {
          nome: form.nome.trim(),
          sexo: form.sexo || undefined,
          nascimento: form.nascimento || undefined,
          cnh: form.cnh || undefined,
          natural: form.natural || undefined,
          profissao: form.profissao || undefined,
          cpf: form.cpf || undefined,
          rg: form.rg || undefined,
          endereco: form.endereco || undefined,
          telefone: form.telefone || undefined,
          email: form.email || undefined,
        },
        avalista: form.avNome.trim()
          ? {
              nome: form.avNome.trim(),
              sexo: form.avSexo || undefined,
              nascimento: form.avNascimento || undefined,
              cnh: form.avCnh || undefined,
              natural: form.avNatural || undefined,
              profissao: form.avProfissao || undefined,
              cpf: form.avCpf || undefined,
              rg: form.avRg || undefined,
              endereco: form.avEndereco || undefined,
              telefone: form.avTelefone || undefined,
              email: form.avEmail || undefined,
            }
          : undefined,
        moto: {
          marca: moto.marca,
          modelo: moto.modelo,
          anoModelo: moto.anoModelo,
          cor: moto.cor,
          placa: moto.placa,
          chassi: moto.chassi,
          renavam: moto.renavam,
          km: moto.km,
        },
        plano: {
          parcelas: Number(form.parcelas),
          valorEntrada: Number(form.valorEntrada),
          valorParcela: Number(form.valorParcela),
          planoEscolhido: form.planoEscolhido,
          multaPercent: 10,
          jurosDiaPercent: 2,
          datasVencimento: form.datasVencimento,
          vencimentoPrimeira: form.vencimentoPrimeira,
        },
        observacoes: form.observacoes || undefined,
      };

      const res = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao gerar contrato");

      // Persiste no profile do cliente os campos pessoais que ele preencheu
      // aqui — assim na próxima locação já vem tudo pré-preenchido sem
      // precisar digitar de novo. Best-effort: se falhar não bloqueia o
      // contrato (já foi criado com sucesso).
      if (isUuid && aluguel?.clienteId) {
        const profileUpdates: Record<string, string | object | null | undefined> = {};
        // Só preenche o que ainda não existe no profile, pra não sobrescrever
        // dados que admin editou direto no /usuarios/[id]
        if (!profile?.sexo && form.sexo) profileUpdates.sexo = form.sexo;
        if (!profile?.nascimento && form.nascimento) {
          // form.nascimento pode vir como DD/MM/YYYY ou YYYY-MM-DD — normaliza
          const br = form.nascimento.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          profileUpdates.nascimento = br
            ? `${br[3]}-${br[2]}-${br[1]}`
            : form.nascimento;
        }
        if (!profile?.naturalidade && form.natural)
          profileUpdates.naturalidade = form.natural;
        if (!profile?.profissao && form.profissao)
          profileUpdates.profissao = form.profissao;
        if (!profile?.rg && form.rg) profileUpdates.rg = form.rg;
        if (!profile?.cnh && form.cnh) profileUpdates.cnh = form.cnh;
        if (!profile?.endereco && form.endereco)
          profileUpdates.endereco = { texto: form.endereco };
        if (Object.keys(profileUpdates).length > 0) {
          fetch(`/api/users/${aluguel.clienteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profileUpdates),
          }).catch(() => {
            /* best-effort, não bloqueia geração de contrato */
          });
        }
      }

      const id = json.contrato?._id as string;
      const numero = id.slice(-6).toUpperCase();
      setGenerated({ id, numero });
      toast.success(`Contrato ${numero} gerado!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!aluguel || !moto) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-keu-red mx-auto mb-3" />
        <p className="text-sm text-keu-black/60">Carregando aluguel...</p>
      </div>
    );
  }

  // Tela de sucesso após gerar
  if (generated) {
    return (
      <div>
        <Link
          href={`/dashboard/aluguel/${aluguelId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para aluguel
        </Link>

        <PageHeader
          title="Contrato gerado"
          description={`Contrato KEU LOCA MOTOS #${generated.numero}`}
        />

        <Card className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <div>
              <h3 className="font-bold text-lg text-emerald-900">
                Contrato gerado com sucesso
              </h3>
              <p className="text-sm text-emerald-800/80">
                #{generated.numero} — {form.nome} · {moto.marca} {moto.modelo}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <a
              href={`/api/contratos/${generated.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>
                <Download className="h-4 w-4" /> Abrir / baixar PDF
              </Button>
            </a>
            <Link href={`/dashboard/contratos`}>
              <Button variant="outline">Ver todos contratos</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/aluguel/${aluguelId}`)}
            >
              Voltar pro aluguel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/dashboard/aluguel/${aluguelId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para aluguel
      </Link>

      <PageHeader
        title="Gerar contrato"
        description={`KEU LOCA MOTOS — ${moto.marca} ${moto.modelo}${
          moto.placa ? ` · ${moto.placa}` : ""
        }`}
      />

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* CONTRATANTE */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-keu-black/5">
            <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Contratante / Locatário</h2>
              <p className="text-sm text-keu-black/60">
                Dados do cliente — pré-preenchidos do aluguel e perfil
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="nome" required>
                Nome completo
              </Label>
              <Input
                id="nome"
                required
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sexo">Sexo</Label>
              <Select
                id="sexo"
                value={form.sexo}
                onChange={(e) => set("sexo", e.target.value)}
              >
                <option value="">Selecione...</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
                <option value="OUTRO">Outro</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="nascimento">Nascimento</Label>
              <Input
                id="nascimento"
                type="date"
                value={toIsoDate(form.nascimento)}
                onChange={(e) => set("nascimento", toBrDate(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="cpf" required>
                CPF
              </Label>
              <Input
                id="cpf"
                required
                value={form.cpf}
                onChange={(e) => set("cpf", formatCpfInput(e.target.value))}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                value={form.rg}
                onChange={(e) => set("rg", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cnh">CNH</Label>
              <Input
                id="cnh"
                value={form.cnh}
                onChange={(e) => set("cnh", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="natural">Naturalidade</Label>
              <Input
                id="natural"
                placeholder="Cidade onde nasceu"
                value={form.natural}
                onChange={(e) => set("natural", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="profissao">Profissão</Label>
              <Input
                id="profissao"
                value={form.profissao}
                onChange={(e) => set("profissao", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) =>
                  set("telefone", formatPhoneInput(e.target.value))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro, cidade - UF"
                value={form.endereco}
                onChange={(e) => set("endereco", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* AVALISTA */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-keu-black/5">
            <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Avalista voluntário (opcional)</h2>
              <p className="text-sm text-keu-black/60">
                Deixe em branco se não tiver avalista
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="avNome">Nome do avalista</Label>
              <Input
                id="avNome"
                value={form.avNome}
                onChange={(e) => set("avNome", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="avSexo">Sexo</Label>
              <Select
                id="avSexo"
                value={form.avSexo}
                onChange={(e) => set("avSexo", e.target.value)}
              >
                <option value="">Selecione...</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
                <option value="OUTRO">Outro</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="avNascimento">Nascimento</Label>
              <Input
                id="avNascimento"
                type="date"
                value={toIsoDate(form.avNascimento)}
                onChange={(e) =>
                  set("avNascimento", toBrDate(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="avCpf">CPF</Label>
              <Input
                id="avCpf"
                value={form.avCpf}
                onChange={(e) => set("avCpf", formatCpfInput(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="avRg">RG</Label>
              <Input
                id="avRg"
                value={form.avRg}
                onChange={(e) => set("avRg", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="avCnh">CNH</Label>
              <Input
                id="avCnh"
                value={form.avCnh}
                onChange={(e) => set("avCnh", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="avNatural">Naturalidade</Label>
              <Input
                id="avNatural"
                value={form.avNatural}
                onChange={(e) => set("avNatural", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="avProfissao">Profissão</Label>
              <Input
                id="avProfissao"
                value={form.avProfissao}
                onChange={(e) => set("avProfissao", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="avTelefone">Telefone</Label>
              <Input
                id="avTelefone"
                value={form.avTelefone}
                onChange={(e) =>
                  set("avTelefone", formatPhoneInput(e.target.value))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="avEndereco">Endereço</Label>
              <Input
                id="avEndereco"
                value={form.avEndereco}
                onChange={(e) => set("avEndereco", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="avEmail">E-mail</Label>
              <Input
                id="avEmail"
                type="email"
                value={form.avEmail}
                onChange={(e) => set("avEmail", e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* MOTO (read-only) */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-keu-black/5">
            <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Motocicleta locada</h2>
              <p className="text-sm text-keu-black/60">
                Dados vêm do estoque — não editáveis aqui
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-keu-black/50 text-xs">Marca</span>
              <div className="font-semibold">{moto.marca}</div>
            </div>
            <div>
              <span className="text-keu-black/50 text-xs">Modelo</span>
              <div className="font-semibold">{moto.modelo}</div>
            </div>
            <div>
              <span className="text-keu-black/50 text-xs">Ano</span>
              <div className="font-semibold">{moto.anoModelo ?? "—"}</div>
            </div>
            <div>
              <span className="text-keu-black/50 text-xs">Cor</span>
              <div className="font-semibold">{moto.cor ?? "—"}</div>
            </div>
            <div>
              <span className="text-keu-black/50 text-xs">Placa</span>
              <div className="font-mono font-semibold">{moto.placa ?? "—"}</div>
            </div>
            <div>
              <span className="text-keu-black/50 text-xs">Chassi</span>
              <div className="font-mono font-semibold text-xs">{moto.chassi ?? "—"}</div>
            </div>
            <div>
              <span className="text-keu-black/50 text-xs">RENAVAM</span>
              <div className="font-mono font-semibold">{moto.renavam ?? "—"}</div>
            </div>
            <div>
              <span className="text-keu-black/50 text-xs">KM</span>
              <div className="font-semibold">{moto.km ?? "—"}</div>
            </div>
          </div>
        </Card>

        {/* PLANO */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-keu-black/5">
            <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">Plano e valores</h2>
              <p className="text-sm text-keu-black/60">
                Multa 10% / juros 2% ao dia (padrão)
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parcelas" required>
                Quantidade de parcelas
              </Label>
              <Input
                id="parcelas"
                type="number"
                min={1}
                required
                value={form.parcelas || ""}
                onChange={(e) =>
                  set("parcelas", Number(e.target.value || 0))
                }
              />
            </div>
            <div>
              <Label htmlFor="planoEscolhido">Plano escolhido</Label>
              <Input
                id="planoEscolhido"
                value={form.planoEscolhido}
                onChange={(e) => set("planoEscolhido", e.target.value)}
                placeholder="Conquista"
              />
            </div>
            <div>
              <Label htmlFor="valorEntrada">Valor da entrada (R$)</Label>
              <Input
                id="valorEntrada"
                type="number"
                step="0.01"
                value={form.valorEntrada || ""}
                onChange={(e) =>
                  set("valorEntrada", Number(e.target.value || 0))
                }
              />
              {form.valorEntrada > 0 && (
                <p className="text-[11px] text-keu-black/50 mt-1">
                  {formatCurrency(form.valorEntrada)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="valorParcela" required>
                Valor de cada parcela (R$)
              </Label>
              <Input
                id="valorParcela"
                type="number"
                step="0.01"
                required
                value={form.valorParcela || ""}
                onChange={(e) =>
                  set("valorParcela", Number(e.target.value || 0))
                }
              />
              {form.valorParcela > 0 && (
                <p className="text-[11px] text-keu-black/50 mt-1">
                  {formatCurrency(form.valorParcela)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="datasVencimento">Datas de vencimento</Label>
              <Input
                id="datasVencimento"
                placeholder="Ex: 06 e 21"
                value={form.datasVencimento}
                onChange={(e) => set("datasVencimento", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vencimentoPrimeira">Vencimento da 1ª</Label>
              <Input
                id="vencimentoPrimeira"
                placeholder="Ex: 06 DE MAIO DE 2026"
                value={form.vencimentoPrimeira}
                onChange={(e) => set("vencimentoPrimeira", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                rows={2}
                value={form.observacoes}
                onChange={(e) => set("observacoes", e.target.value)}
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href={`/dashboard/aluguel/${aluguelId}`}>
            <Button type="button" variant="outline" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Gerar contrato
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
