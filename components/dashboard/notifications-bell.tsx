"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/hooks/use-notifications";

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

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function NotificationsBell() {
  const { notifications, unreadCount, markRead, markAllRead, archive } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative w-10 h-10 rounded-full flex items-center justify-center transition-all",
          "hover:bg-keu-black/5 active:scale-95",
          open && "bg-keu-black/5"
        )}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} novas)` : ""}`}
      >
        <Bell className="h-5 w-5 text-keu-black/70" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1",
              "bg-keu-red text-white text-[10px] font-bold rounded-full",
              "flex items-center justify-center",
              "ring-2 ring-white animate-pulse-soft"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)]",
            "bg-white rounded-2xl shadow-2xl border border-keu-black/10",
            "overflow-hidden z-50",
            "animate-slide-down origin-top-right"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-keu-black/5">
            <div>
              <h3 className="font-bold">Notificações</h3>
              <p className="text-xs text-keu-black/50">
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-keu-red hover:underline font-semibold flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" /> Marcar tudo
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-sm text-keu-black/40">
                <Bell className="h-8 w-8 mx-auto mb-2 text-keu-black/20" />
                Sem notificações por enquanto.
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n._id}
                    className={cn(
                      "group relative px-4 py-3 border-b border-keu-black/5 last:border-0",
                      "hover:bg-keu-gray-light transition",
                      !n.lido && "bg-keu-red/[0.03]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl leading-none flex-shrink-0 mt-0.5">
                        {tipoEmoji[n.tipo] ?? "🔔"}
                      </div>
                      <div className="flex-1 min-w-0">
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => {
                              if (!n.lido) markRead([n._id]);
                              setOpen(false);
                            }}
                            className="block"
                          >
                            <p
                              className={cn(
                                "text-sm leading-snug",
                                !n.lido ? "font-semibold" : "text-keu-black/70"
                              )}
                            >
                              {n.titulo}
                            </p>
                          </Link>
                        ) : (
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              !n.lido ? "font-semibold" : "text-keu-black/70"
                            )}
                          >
                            {n.titulo}
                          </p>
                        )}
                        {n.descricao && (
                          <p className="text-xs text-keu-black/50 mt-0.5 line-clamp-2">
                            {n.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-keu-black/40 uppercase tracking-wide font-semibold">
                            {tempoRelativo(n.createdAt)}
                          </span>
                          {n.prioridade === "alta" && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                              ALTA
                            </span>
                          )}
                          {n.prioridade === "urgente" && (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                              URGENTE
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition flex flex-col gap-1">
                        {!n.lido && (
                          <button
                            onClick={() => markRead([n._id])}
                            className="p-1 hover:bg-keu-black/10 rounded text-keu-black/40 hover:text-keu-black/70"
                            aria-label="Marcar como lida"
                            title="Marcar como lida"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => archive([n._id])}
                          className="p-1 hover:bg-keu-black/10 rounded text-keu-black/40 hover:text-red-500"
                          aria-label="Arquivar"
                          title="Arquivar"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
