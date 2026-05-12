"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  Inbox,
  ArchiveRestore,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface NotificationItem {
  _id: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  link?: string;
  prioridade: "baixa" | "normal" | "alta" | "urgente";
  lido: boolean;
  arquivado: boolean;
  createdAt: string;
}

const tipoEmoji: Record<string, string> = {
  interesse: "👀",
  lead: "📞",
  venda: "💰",
  aluguel: "🔑",
  pagamento_proximo: "⏰",
  pagamento_atrasado: "⚠️",
  devolucao_proxima: "📅",
  devolucao_atrasada: "🚨",
  novo_cliente: "👋",
  documento_pendente: "📄",
};

function tempo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

type Aba = "inbox" | "arquivadas";

export default function NotificacoesPage() {
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>("inbox");

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      // GET /api/notifications já filtra arquivado=false. Pra ver arquivadas
      // chamamos uma vez todas e dividimos client-side (até ter param dedicado).
      const res = await fetch("/api/notifications?limit=100", {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({ notifications: [] }));
      setList(json.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchList, 0);
    return () => clearTimeout(t);
  }, [fetchList]);

  const visible = list.filter((n) =>
    aba === "inbox" ? !n.arquivado : n.arquivado
  );
  const unreadCount = list.filter((n) => !n.lido && !n.arquivado).length;

  async function patch(acao: string, ids?: string[]) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { acao, ids } : { acao }),
    });
    fetchList();
  }

  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Histórico completo de alertas, eventos e atividades"
      >
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => patch("ler_todas")}>
            <CheckCheck className="h-4 w-4" /> Marcar tudo como lido
          </Button>
        )}
      </PageHeader>

      <div className="flex gap-1.5 mb-6 border-b border-keu-black/5">
        {(
          [
            ["inbox", "Caixa de entrada", <Inbox key="i" className="h-4 w-4" />],
            [
              "arquivadas",
              "Arquivadas",
              <Archive key="a" className="h-4 w-4" />,
            ],
          ] as const
        ).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all",
              "border-b-2 -mb-px",
              aba === key
                ? "border-keu-red text-keu-red"
                : "border-transparent text-keu-black/60 hover:text-keu-black"
            )}
          >
            {icon}
            {label}
            {key === "inbox" && unreadCount > 0 && (
              <span className="ml-1 bg-keu-red text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-keu-red mx-auto" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={
              aba === "inbox" ? (
                <Bell className="h-7 w-7" />
              ) : (
                <Archive className="h-7 w-7" />
              )
            }
            title={
              aba === "inbox"
                ? "Caixa de entrada vazia"
                : "Nenhuma notificação arquivada"
            }
            description={
              aba === "inbox"
                ? "Tudo em dia. Quando algo novo acontecer, aparece aqui."
                : "Notificações arquivadas ficam acessíveis aqui pra consulta."
            }
          />
        ) : (
          <div className="divide-y divide-keu-black/5">
            {visible.map((n) => {
              const Container: React.ElementType = n.link ? Link : "div";
              const containerProps = n.link ? { href: n.link } : {};
              return (
                <div
                  key={n._id}
                  className={cn(
                    "px-6 py-4 group hover:bg-keu-gray-light transition relative",
                    !n.lido && !n.arquivado && "bg-keu-red/[0.03]"
                  )}
                >
                  <Container
                    {...containerProps}
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => {
                      if (!n.lido) patch("ler", [n._id]);
                    }}
                  >
                    <div className="text-2xl leading-none flex-shrink-0 mt-0.5">
                      {tipoEmoji[n.tipo] ?? "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !n.lido ? "font-bold" : "text-keu-black/80"
                        )}
                      >
                        {n.titulo}
                      </p>
                      {n.descricao && (
                        <p className="text-xs text-keu-black/55 mt-0.5">
                          {n.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-keu-black/40 uppercase font-bold">
                          {tempo(n.createdAt)}
                        </span>
                        {n.prioridade === "alta" && (
                          <Badge variant="warning" className="text-[9px]">
                            ALTA
                          </Badge>
                        )}
                        {n.prioridade === "urgente" && (
                          <Badge variant="danger" className="text-[9px]">
                            <AlertCircle className="h-2.5 w-2.5" /> URGENTE
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Container>
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition flex gap-1">
                    {!n.lido && !n.arquivado && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          patch("ler", [n._id]);
                        }}
                        className="p-1.5 hover:bg-keu-black/10 rounded text-keu-black/50 hover:text-keu-black"
                        title="Marcar como lida"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {!n.arquivado ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          patch("arquivar", [n._id]);
                        }}
                        className="p-1.5 hover:bg-keu-black/10 rounded text-keu-black/50 hover:text-keu-red"
                        title="Arquivar"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span
                        className="p-1.5 text-keu-black/30 cursor-not-allowed"
                        title="Arquivada"
                      >
                        <ArchiveRestore className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
