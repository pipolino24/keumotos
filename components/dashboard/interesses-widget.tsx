"use client";

import Link from "next/link";
import { Phone, Eye, MessageCircle, FileText, Heart, Calculator, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";

interface InteresseItem {
  _id: string;
  clienteId?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  motoId: string;
  motoModelo: string;
  motoMarca?: string;
  tipo:
    | "visualizou"
    | "simulou_financiamento"
    | "enviou_lead"
    | "solicitou_aluguel"
    | "solicitou_compra"
    | "favoritou";
  mensagem?: string;
  resultado?: "convertido" | "perdido" | "em-atendimento";
  createdAt: string;
}

const tipoConfig: Record<
  InteresseItem["tipo"],
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  visualizou: {
    label: "Visualizou",
    icon: <Eye className="h-3.5 w-3.5" />,
    color: "text-keu-black/60",
    bg: "bg-keu-gray-light",
  },
  simulou_financiamento: {
    label: "Simulou financiamento",
    icon: <Calculator className="h-3.5 w-3.5" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  enviou_lead: {
    label: "Enviou lead",
    icon: <MessageCircle className="h-3.5 w-3.5" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  solicitou_aluguel: {
    label: "Solicitou aluguel",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  solicitou_compra: {
    label: "Solicitou compra",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-keu-red",
    bg: "bg-keu-red/10",
  },
  favoritou: {
    label: "Favoritou",
    icon: <Heart className="h-3.5 w-3.5" />,
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
};

function tempoRel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

interface Props {
  limit?: number;
}

/**
 * Widget que vendedor/admin vê no dashboard com os interesses mais recentes
 * dos clientes — visualizações, leads, simulações.
 *
 * Filtra padrão pra Interesses NÃO atendidos (resultado=null|em-atendimento).
 * Polling implícito via revalidação ao montar o dashboard.
 */
export function InteressesWidget({ limit = 6 }: Props) {
  const { data, loading, error, refetch } = useApi<{
    interesses: InteresseItem[];
  }>(`/api/interesses?limit=${limit * 3}`);

  const list = (data?.interesses ?? [])
    .filter((i) => i.resultado !== "convertido" && i.resultado !== "perdido")
    .slice(0, limit);

  async function marcarAtendido(id: string) {
    try {
      const res = await fetch(`/api/interesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultado: "em-atendimento" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || "Não foi possível marcar como atendido");
        return;
      }
      toast.success("Marcado como em atendimento");
      refetch();
    } catch {
      toast.error("Erro de rede");
    }
  }

  return (
    <Card>
      <div className="p-6 border-b border-keu-black/5 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Eye className="h-4 w-4 text-keu-red" /> Interesses ativos
          </h2>
          <p className="text-sm text-keu-black/60">
            Clientes interagindo com motos agora
          </p>
        </div>
        <Link
          href="/dashboard/clientes"
          className="text-sm text-keu-red font-semibold hover:underline flex items-center gap-1"
        >
          Ver clientes <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-keu-red mx-auto" />
        </div>
      ) : error || list.length === 0 ? (
        <EmptyState
          icon={<Eye className="h-7 w-7" />}
          title="Nenhum interesse ativo"
          description="Quando um cliente clicar numa moto, simular financiamento ou enviar lead, aparece aqui."
        />
      ) : (
        <div className="divide-y divide-keu-black/5">
          {list.map((it) => {
            const cfg = tipoConfig[it.tipo];
            return (
              <div
                key={it._id}
                className="p-4 px-6 flex items-start gap-3 hover:bg-keu-gray-light transition"
              >
                <div
                  className={`${cfg.bg} ${cfg.color} w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {it.clienteNome ?? "Visitante anônimo"}
                  </div>
                  <div className="text-xs text-keu-black/60 truncate">
                    {cfg.label} ·{" "}
                    <Link
                      href={`/motos/${it.motoId}`}
                      className="hover:text-keu-red"
                    >
                      {it.motoMarca ? `${it.motoMarca} ` : ""}
                      {it.motoModelo}
                    </Link>
                  </div>
                  {it.mensagem && (
                    <div className="text-xs text-keu-black/50 mt-1 line-clamp-1 italic">
                      &ldquo;{it.mensagem}&rdquo;
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-keu-black/40 uppercase font-bold">
                    {tempoRel(it.createdAt)}
                  </span>
                  {it.clienteTelefone && (
                    <a
                      href={`https://wa.me/55${it.clienteTelefone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener"
                      onClick={() => marcarAtendido(it._id)}
                      className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold transition"
                    >
                      <Phone className="h-2.5 w-2.5" /> WhatsApp
                    </a>
                  )}
                  {it.clienteId && !it.clienteTelefone && (
                    <Link
                      href={`/dashboard/clientes/${it.clienteId}`}
                      className="text-[10px] bg-keu-red/10 text-keu-red hover:bg-keu-red/20 px-2 py-0.5 rounded-full font-bold transition"
                    >
                      Ver perfil
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => marcarAtendido(it._id)}
                    className="text-[9px] text-keu-black/40 hover:text-keu-black underline"
                    title="Marca como atendido — some da lista"
                  >
                    Atendi
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
