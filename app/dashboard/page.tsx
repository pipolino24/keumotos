"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  Bike,
  Target,
  Phone,
  ArrowRight,
  CheckCircle2,
  Clock,
  Trophy,
  Flame,
  Loader2,
  ShoppingBag,
  KeyRound,
  Sparkles,
  Calendar,
  AlertCircle,
  Wallet,
  History,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { InteressesWidget } from "@/components/dashboard/interesses-widget";
import { ConversaoWidget } from "@/components/dashboard/conversao-widget";
import { TopMotosWidget } from "@/components/dashboard/top-motos-widget";
import { LeadsQuentesWidget } from "@/components/dashboard/leads-quentes-widget";
import { SkeletonListRow } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth/user-context";
import { useApi } from "@/lib/hooks/use-api";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const me = useCurrentUser();
  if (me.role === "cliente") return <ClienteDashboard />;
  return <StaffDashboard />;
}

// ============== CLIENTE ==============

interface MotoCatalogo {
  _id: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  valorAnunciado: number;
  fotos: string[];
}

interface VendaCliente {
  _id: string;
  motoModelo: string;
  motoMarca?: string;
  motoAno?: number;
  valorVendido: number;
  status: "pendente" | "concluida" | "cancelada";
  data: string;
  vendedorId?: string;
  vendedorNome?: string;
  pagamentos: Array<{
    forma: string;
    valor: number;
    parcelasLoja?: number;
    parcelasPagasLoja?: number;
    valorParcelaLoja?: number;
    primeiraParcelaEm?: string;
    proximaParcelaEm?: string;
  }>;
}

interface AluguelCliente {
  _id: string;
  motoModelo: string;
  motoMarca?: string;
  motoAno?: number;
  dataInicio: string;
  dataFim: string;
  dataDevolucao?: string;
  valorTotal: number;
  caucao: number;
  status: "ativo" | "concluido" | "atrasado" | "cancelado";
  valorAReceberCaucao?: number;
  vendedorId?: string;
  vendedorNome?: string;
}

function ClienteDashboard() {
  const me = useCurrentUser();

  const { data: motosData, loading: lm } = useApi<{ motos: MotoCatalogo[] }>(
    "/api/motos?status=disponivel"
  );
  const { data: vendasData, loading: lv } = useApi<{ vendas: VendaCliente[] }>(
    "/api/vendas"
  );
  const { data: alugueisData, loading: la } = useApi<{
    alugueis: AluguelCliente[];
  }>("/api/alugueis");

  const destaques = (motosData?.motos ?? []).slice(0, 3);
  const minhasCompras = vendasData?.vendas ?? [];
  const meusAlugueis = alugueisData?.alugueis ?? [];
  const alugueisAtivos = meusAlugueis.filter(
    (a) => a.status === "ativo" || a.status === "atrasado"
  );
  const alugueisFinalizados = meusAlugueis.filter(
    (a) => a.status === "concluido"
  );

  // Calcula próximos pagamentos: parcelas de venda parcelado-loja + aluguéis ativos
  const proximosPagamentos = calcularProximosPagamentos(
    minhasCompras,
    alugueisAtivos
  );
  const totalEmAberto = proximosPagamentos.reduce((s, p) => s + p.valor, 0);

  // Timeline de ações do próprio cliente (Interesses registrados)
  const { data: interessesData, loading: li } = useApi<{
    interesses: Array<{
      _id: string;
      tipo: string;
      motoModelo: string;
      motoMarca?: string;
      motoId: string;
      createdAt: string;
    }>;
  }>("/api/interesses?limit=15");
  const minhasAcoes = interessesData?.interesses ?? [];
  // Snapshot do "agora" capturado em useEffect — evita chamar Date.now()
  // durante render (regra react-hooks/purity do React 19). setTimeout(0)
  // contorna a regra set-state-in-effect sem alterar comportamento.
  const [nowSnapshot, setNowSnapshot] = useState<number>(0);
  useEffect(() => {
    const t = setTimeout(() => setNowSnapshot(Date.now()), 0);
    return () => clearTimeout(t);
  }, [interessesData]);

  return (
    <div>
      <PageHeader
        title={`Olá, ${me.nome.split(" ")[0]}! 👋`}
        description="Sua área pessoal — catálogo, compras, aluguéis e pagamentos"
      >
        <Link
          href="/motos"
          className={cn(
            buttonVariants({ size: "lg" }),
            "shadow-lg shadow-keu-red/30"
          )}
        >
          <Bike className="h-4 w-4" /> Ver catálogo
        </Link>
      </PageHeader>

      {/* TOP HERO + CTAs */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0 overflow-hidden relative lg:col-span-2">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <Sparkles className="h-8 w-8 mb-3 text-white/80" />
            <h2 className="text-2xl font-black mb-2 leading-tight">
              Procurando sua próxima moto?
            </h2>
            <p className="text-white/85 mb-5 max-w-md">
              Mais de 100 modelos seminovos e zero km com FIPE garantida.
              Compra, troca e financiamento na hora.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/motos"
                className={cn(buttonVariants({ variant: "white", size: "lg" }))}
              >
                Ver motos disponíveis <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/5588998505859"
                target="_blank"
                rel="noopener"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "bg-white/0 border-white/40 text-white hover:bg-white/10 hover:border-white"
                )}
              >
                <Phone className="h-4 w-4" /> Falar com vendedor
              </a>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="bg-emerald-500/10 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg mb-1">Vai alugar?</h3>
          <p className="text-sm text-keu-black/60 mb-4">
            Locação por diária, semana ou mês. Documentação e manutenção em dia.
          </p>
          <a
            href="https://wa.me/5588988143757?text=Quero%20alugar%20uma%20moto"
            target="_blank"
            rel="noopener"
            className="text-sm text-keu-red font-semibold inline-flex items-center gap-1 hover:underline"
          >
            Falar com a KEU Loca <ArrowRight className="h-3 w-3" />
          </a>
        </Card>
      </div>

      {/* STATS */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <SimpleCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Minhas compras"
          value={String(minhasCompras.length)}
          color="bg-keu-red"
          hint={
            minhasCompras.length === 0
              ? "nenhuma compra ainda"
              : `${minhasCompras.length} ${minhasCompras.length === 1 ? "moto comprada" : "motos compradas"}`
          }
        />
        <SimpleCard
          icon={<KeyRound className="h-5 w-5" />}
          label="Aluguéis ativos"
          value={String(alugueisAtivos.length)}
          color="bg-emerald-500"
          hint={
            alugueisAtivos.length === 0
              ? "sem aluguel em andamento"
              : `${alugueisFinalizados.length} já finalizados`
          }
        />
        <SimpleCard
          icon={<Wallet className="h-5 w-5" />}
          label="Em aberto"
          value={formatCurrency(totalEmAberto)}
          color={totalEmAberto > 0 ? "bg-amber-500" : "bg-blue-500"}
          hint={
            proximosPagamentos.length === 0
              ? "nada pra pagar agora"
              : `${proximosPagamentos.length} ${proximosPagamentos.length === 1 ? "pagamento" : "pagamentos"} pendentes`
          }
        />
      </div>

      {/* MINHAS AÇÕES — timeline de Interesses */}
      {(minhasAcoes.length > 0 || li) && (
        <Card className="mb-6">
          <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Suas ações recentes</h2>
                <p className="text-sm text-keu-black/60">
                  Motos que você visualizou, simulou ou enviou interesse
                </p>
              </div>
            </div>
            <Link
              href="/motos"
              className="text-xs text-keu-red hover:underline font-semibold"
            >
              Explorar mais →
            </Link>
          </div>
          {li ? (
            <div className="p-10 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-keu-red mx-auto" />
            </div>
          ) : (
            <div className="divide-y divide-keu-black/5 max-h-72 overflow-y-auto scrollbar-thin">
              {minhasAcoes.slice(0, 10).map((a) => {
                const tipoLabel: Record<string, { label: string; cor: string }> = {
                  visualizou: { label: "Você visualizou", cor: "bg-keu-gray-light text-keu-black/70" },
                  simulou_financiamento: { label: "Você simulou financiamento de", cor: "bg-amber-100 text-amber-700" },
                  enviou_lead: { label: "Você enviou interesse em", cor: "bg-blue-100 text-blue-700" },
                  solicitou_aluguel: { label: "Você solicitou aluguel de", cor: "bg-emerald-100 text-emerald-700" },
                  solicitou_compra: { label: "Você solicitou compra de", cor: "bg-keu-red/10 text-keu-red" },
                  favoritou: { label: "Você favoritou", cor: "bg-pink-100 text-pink-700" },
                };
                const cfg = tipoLabel[a.tipo] ?? {
                  label: "Interagiu com",
                  cor: "bg-keu-gray-light text-keu-black/70",
                };
                const dias = Math.floor(
                  (nowSnapshot - new Date(a.createdAt).getTime()) / 86400000
                );
                const quando =
                  dias === 0 ? "hoje" : dias === 1 ? "ontem" : `há ${dias} dias`;
                return (
                  <div
                    key={a._id}
                    className="block hover:bg-keu-gray-light transition group/row"
                  >
                    <div className="p-3 px-6 flex items-center gap-3">
                      <Link
                        href={`/motos/${a.motoId}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                      <span
                        className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-full ${cfg.cor} flex-shrink-0`}
                      >
                        {cfg.label.split(" ")[1] ?? cfg.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          {cfg.label}{" "}
                          <span className="font-semibold">
                            {a.motoMarca ? `${a.motoMarca} ` : ""}
                            {a.motoModelo}
                          </span>
                        </div>
                        <div className="text-[10px] text-keu-black/50 uppercase font-bold">
                          {quando}
                        </div>
                      </div>
                      <ArrowRight className="h-3 w-3 text-keu-black/30 flex-shrink-0" />
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/interesses/${a._id}`, {
                            method: "DELETE",
                          }).catch(() => {});
                          toast.success("Interesse removido do histórico");
                          // Refetch via reload — useApi não tem refetch público fácil aqui
                          window.location.reload();
                        }}
                        title="Remover do histórico"
                        aria-label="Remover do histórico"
                        className="opacity-0 group-hover/row:opacity-100 transition w-7 h-7 rounded-full hover:bg-keu-red/10 hover:text-keu-red text-keu-black/40 flex items-center justify-center"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* PRÓXIMOS PAGAMENTOS */}
      <Card className="mb-6">
        <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 text-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Próximos pagamentos</h2>
              <p className="text-sm text-keu-black/60">
                Parcelas de motos compradas e aluguéis a vencer
              </p>
            </div>
          </div>
        </div>
        {lv || la ? (
          <div>
            <SkeletonListRow />
            <SkeletonListRow />
            <SkeletonListRow />
          </div>
        ) : proximosPagamentos.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-keu-black/60">
              Nenhum pagamento em aberto. 🎉
            </p>
          </div>
        ) : (
          <div className="divide-y divide-keu-black/5">
            {proximosPagamentos.map((p) => (
              <PagamentoRow key={p.id} item={p} />
            ))}
          </div>
        )}
      </Card>

      {/* GRID: Aluguéis ativos + Minhas compras */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* ALUGUÉIS ATIVOS */}
        <Card>
          <div className="p-6 border-b border-keu-black/5 flex items-center gap-3">
            <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Meus aluguéis ativos</h2>
              <p className="text-sm text-keu-black/60">Locações em andamento</p>
            </div>
          </div>
          {la ? (
            <div>
              <SkeletonListRow />
              <SkeletonListRow />
            </div>
          ) : alugueisAtivos.length === 0 ? (
            <div className="p-10 text-center text-sm text-keu-black/60">
              Você não tem nenhum aluguel em andamento.
            </div>
          ) : (
            <div className="divide-y divide-keu-black/5">
              {alugueisAtivos.map((a) => (
                <AluguelRow key={a._id} aluguel={a} />
              ))}
            </div>
          )}
        </Card>

        {/* MINHAS COMPRAS */}
        <Card>
          <div className="p-6 border-b border-keu-black/5 flex items-center gap-3">
            <div className="bg-keu-red/10 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Minhas compras</h2>
              <p className="text-sm text-keu-black/60">
                Motos que você comprou
              </p>
            </div>
          </div>
          {lv ? (
            <div>
              <SkeletonListRow />
              <SkeletonListRow />
            </div>
          ) : minhasCompras.length === 0 ? (
            <div className="p-10 text-center text-sm text-keu-black/60">
              Você ainda não comprou nenhuma moto.
            </div>
          ) : (
            <div className="divide-y divide-keu-black/5">
              {minhasCompras.slice(0, 5).map((v) => (
                <CompraRow key={v._id} venda={v} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* HISTÓRICO DE ALUGUÉIS */}
      {alugueisFinalizados.length > 0 && (
        <Card className="mb-6">
          <div className="p-6 border-b border-keu-black/5 flex items-center gap-3">
            <div className="bg-blue-500/10 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Histórico de aluguéis</h2>
              <p className="text-sm text-keu-black/60">
                Aluguéis já finalizados
              </p>
            </div>
          </div>
          <div className="divide-y divide-keu-black/5">
            {alugueisFinalizados.slice(0, 5).map((a) => (
              <AluguelRow key={a._id} aluguel={a} />
            ))}
          </div>
        </Card>
      )}

      {/* DESTAQUES DO CATÁLOGO */}
      <Card>
        <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Destaques pra você</h2>
            <p className="text-sm text-keu-black/60">
              Motos selecionadas pelos nossos especialistas
            </p>
          </div>
          <Link
            href="/motos"
            className="text-sm text-keu-red font-semibold hover:underline flex items-center gap-1"
          >
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {lm ? (
          <div className="p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-keu-red mx-auto" />
          </div>
        ) : destaques.length === 0 ? (
          <div className="p-12 text-center">
            <Bike className="h-10 w-10 text-keu-black/20 mx-auto mb-3" />
            <p className="text-sm text-keu-black/60">
              Nenhuma moto no catálogo agora. Volte logo!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4 p-6">
            {destaques.map((m) => (
              <Link
                key={m._id}
                href={`/motos/${m._id}`}
                className="group block"
              >
                <div className="aspect-video bg-gradient-to-br from-keu-gray-light via-white to-keu-red/10 rounded-lg overflow-hidden flex items-center justify-center mb-3">
                  {m.fotos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.fotos[0]}
                      alt={`${m.marca} ${m.modelo}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <Bike className="h-10 w-10 text-keu-red/30" />
                  )}
                </div>
                <div className="text-xs font-bold text-keu-red">{m.marca}</div>
                <div className="font-semibold truncate">
                  {m.modelo} {m.anoModelo}
                </div>
                <div className="text-sm font-bold text-keu-black mt-1">
                  {formatCurrency(m.valorAnunciado)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

interface ProximoPagamento {
  id: string;
  tipo: "parcela-venda" | "aluguel";
  titulo: string;
  subtitulo: string;
  valor: number;
  vencimento: Date;
  atrasado: boolean;
}

function calcularProximosPagamentos(
  compras: VendaCliente[],
  alugueisAtivos: AluguelCliente[]
): ProximoPagamento[] {
  const out: ProximoPagamento[] = [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (const v of compras) {
    for (const p of v.pagamentos) {
      if (
        p.forma === "parcelado-loja" &&
        p.parcelasLoja &&
        p.valorParcelaLoja
      ) {
        const restantes =
          p.parcelasLoja - (p.parcelasPagasLoja ?? 0);
        if (restantes <= 0) continue;
        const venc = p.proximaParcelaEm
          ? new Date(p.proximaParcelaEm)
          : p.primeiraParcelaEm
            ? new Date(p.primeiraParcelaEm)
            : null;
        if (!venc) continue;
        out.push({
          id: `${v._id}-parcela`,
          tipo: "parcela-venda",
          titulo: `${v.motoMarca ?? ""} ${v.motoModelo}`.trim(),
          subtitulo: `Parcela ${(p.parcelasPagasLoja ?? 0) + 1}/${p.parcelasLoja} — parcelado direto na loja`,
          valor: p.valorParcelaLoja,
          vencimento: venc,
          atrasado: venc < hoje,
        });
      }
    }
  }

  for (const a of alugueisAtivos) {
    const fim = new Date(a.dataFim);
    out.push({
      id: a._id,
      tipo: "aluguel",
      titulo: `${a.motoMarca ?? ""} ${a.motoModelo}`.trim(),
      subtitulo: `Aluguel ativo — devolução prevista`,
      valor: a.valorTotal,
      vencimento: fim,
      atrasado: a.status === "atrasado" || fim < hoje,
    });
  }

  return out.sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime());
}

function PagamentoRow({ item }: { item: ProximoPagamento }) {
  const dataFmt = item.vencimento.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="p-4 px-6 flex items-center gap-4 hover:bg-keu-gray-light transition">
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          item.atrasado
            ? "bg-red-500/10 text-red-600"
            : "bg-amber-500/10 text-amber-600"
        )}
      >
        {item.atrasado ? (
          <AlertCircle className="h-5 w-5" />
        ) : (
          <Calendar className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{item.titulo}</div>
        <div className="text-xs text-keu-black/60 truncate">
          {item.subtitulo}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-keu-black">
          {formatCurrency(item.valor)}
        </div>
        <div
          className={cn(
            "text-xs",
            item.atrasado ? "text-red-600 font-semibold" : "text-keu-black/60"
          )}
        >
          {item.atrasado ? "Atrasado · " : ""}
          {dataFmt}
        </div>
      </div>
    </div>
  );
}

function AluguelRow({ aluguel }: { aluguel: AluguelCliente }) {
  const inicio = new Date(aluguel.dataInicio).toLocaleDateString("pt-BR");
  const fim = new Date(aluguel.dataFim).toLocaleDateString("pt-BR");
  const variant: "success" | "danger" | "secondary" | "warning" =
    aluguel.status === "ativo"
      ? "success"
      : aluguel.status === "atrasado"
        ? "danger"
        : aluguel.status === "concluido"
          ? "secondary"
          : "warning";

  // Captura now via useEffect — evita warning react-hooks/purity (React 19)
  const [now, setNow] = useState<number>(0);
  const [requestSent, setRequestSent] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const ativo = aluguel.status === "ativo" || aluguel.status === "atrasado";
  let countdown: { label: string; tone: "danger" | "warning" | "info" } | null = null;
  if (ativo && now > 0) {
    const dias = Math.ceil(
      (new Date(aluguel.dataFim).getTime() - now) / 86400000
    );
    if (dias < 0) {
      countdown = { label: `${Math.abs(dias)}d atraso`, tone: "danger" };
    } else if (dias === 0) {
      countdown = { label: "vence hoje", tone: "danger" };
    } else if (dias <= 3) {
      countdown = { label: `vence em ${dias}d`, tone: "warning" };
    } else {
      countdown = { label: `${dias}d restantes`, tone: "info" };
    }
  }

  async function solicitarDevolucao() {
    try {
      const res = await fetch(
        `/api/alugueis/${aluguel._id}/solicitar-devolucao`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao solicitar devolução");
        return;
      }
      toast.success("Solicitação enviada! O vendedor vai te responder em breve.");
      setRequestSent(true);
    } catch {
      toast.error("Erro de rede");
    }
  }

  return (
    <div className="p-4 px-6 flex items-center gap-4">
      <div className="bg-keu-gray-light w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
        <Bike className="h-5 w-5 text-keu-black/60" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">
          {aluguel.motoMarca ?? ""} {aluguel.motoModelo}
        </div>
        <div className="text-xs text-keu-black/60">
          {inicio} → {fim} · {formatCurrency(aluguel.valorTotal)}
        </div>
        {aluguel.vendedorNome && (
          <div className="text-[10px] text-keu-black/50 mt-0.5">
            Atendido por <strong className="text-keu-black/70">{aluguel.vendedorNome}</strong>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Badge variant={variant} className="text-[10px] uppercase">
          {aluguel.status}
        </Badge>
        {countdown && (
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
              countdown.tone === "danger"
                ? "bg-red-100 text-red-700 animate-pulse-soft"
                : countdown.tone === "warning"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            )}
          >
            {countdown.label}
          </span>
        )}
        {ativo && !requestSent && (
          <button
            type="button"
            onClick={solicitarDevolucao}
            className="text-[10px] text-keu-black/50 hover:text-keu-red font-semibold underline"
            title="Avisa o vendedor que você quer devolver a moto"
          >
            Quero devolver
          </button>
        )}
        {requestSent && (
          <span className="text-[10px] text-emerald-700 font-semibold">
            ✓ vendedor avisado
          </span>
        )}
      </div>
    </div>
  );
}

function CompraRow({ venda }: { venda: VendaCliente }) {
  const dataFmt = new Date(venda.data).toLocaleDateString("pt-BR");
  return (
    <div className="p-4 px-6 flex items-center gap-4">
      <div className="bg-keu-red/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
        <Bike className="h-5 w-5 text-keu-red" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">
          {venda.motoMarca ?? ""} {venda.motoModelo}
        </div>
        <div className="text-xs text-keu-black/60">
          Comprada em {dataFmt} · {formatCurrency(venda.valorVendido)}
        </div>
        {venda.vendedorNome && (
          <div className="text-[10px] text-keu-black/50 mt-0.5">
            Atendido por <strong className="text-keu-black/70">{venda.vendedorNome}</strong>
          </div>
        )}
      </div>
      <Badge
        variant={venda.status === "concluida" ? "success" : "warning"}
        className="text-[10px] uppercase"
      >
        {venda.status}
      </Badge>
    </div>
  );
}

function SimpleCard({
  icon,
  label,
  value,
  color,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  hint: string;
}) {
  return (
    <Card className="p-6">
      <div
        className={`${color} text-white w-10 h-10 rounded-lg flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <div className="text-3xl font-black mb-1">{value}</div>
      <div className="text-sm text-keu-black/60">{label}</div>
      <div className="text-xs text-keu-black/40 mt-2">{hint}</div>
    </Card>
  );
}

// ============== STAFF (vendedor, admin, afiliado) ==============

interface MotoApi {
  _id: string;
  status: string;
  marca: string;
  modelo: string;
  destaque?: boolean;
}

interface ContatoApi {
  _id: string;
  nome: string;
  telefone: string;
  status: string;
  vendedorResponsavel?: string;
  motoInteresse?: string;
}

interface VendaStaff {
  _id: string;
  motoModelo: string;
  motoMarca?: string;
  clienteNome: string;
  valorVendido: number;
  comissao: number;
  vendedorId?: string;
  status: "pendente" | "concluida" | "cancelada";
  data: string;
  pagamentos: Array<{
    forma: string;
    valor: number;
    parcelasLoja?: number;
    parcelasPagasLoja?: number;
    valorParcelaLoja?: number;
    proximaParcelaEm?: string;
  }>;
}

interface AluguelStaff {
  _id: string;
  motoModelo: string;
  motoMarca?: string;
  clienteNome: string;
  clienteTelefone?: string;
  dataInicio: string;
  dataFim: string;
  dataDevolucao?: string;
  valorTotal: number;
  status: "ativo" | "concluido" | "atrasado" | "cancelado";
}

function StaffDashboard() {
  const me = useCurrentUser();

  const { data: motosData, loading: lm } = useApi<{ motos: MotoApi[] }>(
    "/api/motos"
  );
  const { data: contData, loading: lc } = useApi<{ contatos: ContatoApi[] }>(
    "/api/contatos"
  );
  const { data: vendasData, loading: lv } = useApi<{ vendas: VendaStaff[] }>(
    "/api/vendas"
  );
  const { data: alugData, loading: la } = useApi<{ alugueis: AluguelStaff[] }>(
    "/api/alugueis"
  );

  const motos = motosData?.motos ?? [];
  const contatos = contData?.contatos ?? [];
  const todasVendas = vendasData?.vendas ?? [];
  const todosAlugueis = alugData?.alugueis ?? [];

  const motosDisponiveis = motos.filter((m) => m.status === "disponivel").length;
  const meusLeads = contatos.filter(
    (c) => c.vendedorResponsavel === me.nome || c.status === "novo"
  );
  const meusLeadsAtivos = meusLeads.filter(
    (c) => c.status === "novo" || c.status === "em-atendimento"
  );

  // Vendas: admin vê todas, vendedor vê só as próprias (a API já filtra,
  // mas como vendedorId no shape pode vir vazio, mantemos só ordenação).
  const minhasVendas = todasVendas
    .filter((v) => v.status !== "cancelada")
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Comissão do mês corrente
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const minhaComissao = minhasVendas
    .filter((v) => new Date(v.data) >= inicioMes)
    .reduce((sum, v) => sum + (v.comissao || 0), 0);
  const vendasMes = minhasVendas.filter(
    (v) => new Date(v.data) >= inicioMes
  ).length;

  // Próximas devoluções de aluguel (ativo/atrasado, ordenado por dataFim)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fimSemana = new Date(hoje);
  fimSemana.setDate(fimSemana.getDate() + 7);
  const proximasDevolucoes = todosAlugueis
    .filter((a) => a.status === "ativo" || a.status === "atrasado")
    .map((a) => ({
      ...a,
      dataFimDt: new Date(a.dataFim),
    }))
    .sort((a, b) => a.dataFimDt.getTime() - b.dataFimDt.getTime())
    .slice(0, 5);

  // Próximas parcelas (parcelado-loja) vencendo até 30 dias
  const limite30 = new Date(hoje);
  limite30.setDate(limite30.getDate() + 30);
  const proximasParcelas: Array<{
    vendaId: string;
    clienteNome: string;
    motoModelo: string;
    valorParcela: number;
    parcelasPagasLoja: number;
    parcelasLoja: number;
    proxima: Date;
  }> = [];
  for (const v of todasVendas) {
    if (v.status !== "concluida") continue;
    for (const p of v.pagamentos ?? []) {
      if (p.forma !== "parcelado-loja") continue;
      if (!p.proximaParcelaEm) continue;
      const prox = new Date(p.proximaParcelaEm);
      if (prox > limite30) continue;
      proximasParcelas.push({
        vendaId: v._id,
        clienteNome: v.clienteNome,
        motoModelo: v.motoModelo,
        valorParcela: p.valorParcelaLoja ?? 0,
        parcelasPagasLoja: p.parcelasPagasLoja ?? 0,
        parcelasLoja: p.parcelasLoja ?? 0,
        proxima: prox,
      });
    }
  }
  proximasParcelas.sort((a, b) => a.proxima.getTime() - b.proxima.getTime());

  const loading = lm || lc || lv || la;

  return (
    <div>
      <PageHeader
        title={`Olá, ${me.nome.split(" ")[0]}! 👋`}
        description="Seu painel pessoal — vendas, leads e estoque do dia"
      >
        <Link href="/dashboard/estoque/novo">
          <Button>
            <Bike className="h-4 w-4" /> Cadastrar Moto
          </Button>
        </Link>
      </PageHeader>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Vendas do mês"
          value={vendasMes.toString()}
          trend={`${minhasVendas.length} no histórico`}
          color="bg-emerald-500"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Comissão do mês"
          value={formatCurrency(minhaComissao)}
          trend="acumulado no mês corrente"
          color="bg-keu-red"
        />
        <StatCard
          icon={<Phone className="h-5 w-5" />}
          label="Meus leads ativos"
          value={meusLeadsAtivos.length.toString()}
          trend={`${meusLeads.length} no total`}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Bike className="h-5 w-5" />}
          label="Motos no estoque"
          value={motosDisponiveis.toString()}
          trend="disponíveis para venda"
          color="bg-amber-500"
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-6">
        <InteressesWidget limit={6} />
        <div className="space-y-6">
          <ConversaoWidget />
          <TopMotosWidget limit={5} />
        </div>
      </div>

      <div className="mb-6">
        <LeadsQuentesWidget limit={6} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Vendas recentes</h2>
              <p className="text-sm text-keu-black/60">
                Últimas transações concluídas
              </p>
            </div>
            <Link
              href="/dashboard/vendas"
              className="text-sm text-keu-red font-semibold hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-keu-red mx-auto" />
            </div>
          ) : minhasVendas.length === 0 ? (
            <div className="p-12 text-center">
              <Target className="h-10 w-10 text-keu-black/20 mx-auto mb-3" />
              <p className="text-sm text-keu-black/60">
                Nenhuma venda registrada ainda.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-keu-black/5">
              {minhasVendas.slice(0, 5).map((v) => (
                <div
                  key={v._id}
                  className="p-4 px-6 flex items-center gap-4 hover:bg-keu-gray-light transition"
                >
                  <div className="bg-emerald-500/10 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {v.motoMarca ? `${v.motoMarca} ` : ""}
                      {v.motoModelo}
                    </div>
                    <div className="text-xs text-keu-black/60 flex flex-wrap items-center gap-2">
                      <span>{v.clienteNome}</span>
                      <span>•</span>
                      <span>
                        {new Date(v.data).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {formatCurrency(v.valorVendido)}
                    </div>
                    {v.comissao > 0 && (
                      <div className="text-xs text-emerald-600">
                        comissão {formatCurrency(v.comissao)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-keu-red to-keu-red-dark text-white border-0 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="bg-white/20 backdrop-blur w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-1">Meta do mês</h3>
              <p className="text-sm text-white/80 mb-4">
                Acompanhe seu progresso pessoal
              </p>
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/80">
                    {vendasMes} de 8 vendas
                  </span>
                  <span className="font-bold">
                    {Math.round((vendasMes / 8) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{
                      width: `${Math.min(100, (vendasMes / 8) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-white/70 mt-3">
                {vendasMes >= 8
                  ? "🎉 Meta batida! Parabéns!"
                  : `Faltam ${8 - vendasMes} vendas pra bater a meta`}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Próximas devoluções</h3>
              {proximasDevolucoes.length > 0 && (
                <Badge variant="warning" className="text-[10px]">
                  {proximasDevolucoes.length}
                </Badge>
              )}
            </div>
            {loading ? (
              <div className="py-6 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-keu-red mx-auto" />
              </div>
            ) : proximasDevolucoes.length === 0 ? (
              <div className="text-xs text-keu-black/40 text-center py-6">
                Nenhum aluguel ativo no momento
              </div>
            ) : (
              <div className="space-y-3">
                {proximasDevolucoes.map((a) => {
                  const dias = Math.ceil(
                    (a.dataFimDt.getTime() - hoje.getTime()) / 86400000
                  );
                  const atrasado = dias < 0;
                  return (
                    <Link
                      key={a._id}
                      href={`/dashboard/aluguel/${a._id}`}
                      className="block group"
                    >
                      <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg group-hover:bg-keu-gray-light transition">
                        <div
                          className={cn(
                            "w-2 h-10 rounded-full",
                            atrasado
                              ? "bg-red-500"
                              : dias <= 2
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {a.motoMarca ? `${a.motoMarca} ` : ""}
                            {a.motoModelo}
                          </div>
                          <div className="text-xs text-keu-black/60 truncate">
                            {a.clienteNome}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={cn(
                              "text-xs font-bold",
                              atrasado
                                ? "text-red-600"
                                : dias <= 2
                                ? "text-amber-600"
                                : "text-keu-black/70"
                            )}
                          >
                            {atrasado
                              ? `${Math.abs(dias)}d atraso`
                              : dias === 0
                              ? "Hoje"
                              : `${dias}d`}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Parcelas a vencer
              </h3>
              {proximasParcelas.length > 0 && (
                <Badge variant="info" className="text-[10px]">
                  {proximasParcelas.length}
                </Badge>
              )}
            </div>
            {loading ? (
              <div className="py-6 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-keu-red mx-auto" />
              </div>
            ) : proximasParcelas.length === 0 ? (
              <div className="text-xs text-keu-black/40 text-center py-6">
                Sem parcelas próximas (30 dias)
              </div>
            ) : (
              <div className="space-y-3">
                {proximasParcelas.slice(0, 5).map((p, i) => {
                  const dias = Math.ceil(
                    (p.proxima.getTime() - hoje.getTime()) / 86400000
                  );
                  const atrasado = dias < 0;
                  return (
                    <Link
                      key={`${p.vendaId}-${i}`}
                      href={`/dashboard/vendas/${p.vendaId}`}
                      className="block group"
                    >
                      <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg group-hover:bg-keu-gray-light transition">
                        <div
                          className={cn(
                            "w-2 h-10 rounded-full",
                            atrasado
                              ? "bg-red-500"
                              : dias <= 3
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {p.clienteNome}
                          </div>
                          <div className="text-xs text-keu-black/60 truncate">
                            {p.parcelasPagasLoja + 1}/{p.parcelasLoja} ·{" "}
                            {p.motoModelo}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">
                            {formatCurrency(p.valorParcela)}
                          </div>
                          <div
                            className={cn(
                              "text-[10px] font-semibold",
                              atrasado
                                ? "text-red-600"
                                : dias <= 3
                                ? "text-amber-600"
                                : "text-keu-black/50"
                            )}
                          >
                            {atrasado
                              ? `${Math.abs(dias)}d atraso`
                              : dias === 0
                              ? "vence hoje"
                              : `em ${dias}d`}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Meus leads ativos</h2>
              <p className="text-sm text-keu-black/60">
                Contatos para você atender
              </p>
            </div>
            <Link
              href="/dashboard/contatos"
              className="text-sm text-keu-red font-semibold hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-keu-red mx-auto" />
            </div>
          ) : meusLeadsAtivos.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm text-keu-black/60">
                Nenhum lead pendente — bom trabalho!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-keu-black/5">
              {meusLeadsAtivos.slice(0, 5).map((c) => (
                <div
                  key={c._id}
                  className="p-4 px-6 flex items-center gap-4 hover:bg-keu-gray-light transition"
                >
                  <div className="bg-keu-red text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {c.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{c.nome}</div>
                    <div className="text-xs text-keu-black/60 flex items-center gap-2 flex-wrap">
                      <span>{c.telefone}</span>
                      {c.motoInteresse && (
                        <>
                          <span>•</span>
                          <span>interessado em {c.motoInteresse}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={c.status === "novo" ? "info" : "warning"}
                    className="text-[10px]"
                  >
                    {c.status === "novo" ? (
                      <Clock className="h-3 w-3" />
                    ) : null}
                    {c.status === "novo" ? "Novo" : "Em atendimento"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  color: string;
}) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all">
      <div
        className={`${color} text-white w-10 h-10 rounded-lg flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <div className="text-3xl font-black mb-1">{value}</div>
      <div className="text-sm text-keu-black/60">{label}</div>
      <div className="text-xs text-keu-black/40 mt-2">{trend}</div>
    </Card>
  );
}
