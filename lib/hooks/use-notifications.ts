"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface NotificationItem {
  _id: string;
  destinatarioId: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  clienteId?: string;
  clienteNome?: string;
  link?: string;
  prioridade: "baixa" | "normal" | "alta" | "urgente";
  lido: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

/**
 * Hook que mantém a lista de notificações sincronizada com polling.
 * - Refetch a cada `pollIntervalMs` (default 25s).
 * - Refetch imediato quando a aba volta a ficar visível.
 * - Retorna `markRead`, `markAllRead`, `archive` que atualizam servidor + UI.
 */
export function useNotifications(pollIntervalMs = 25000) {
  const [data, setData] = useState<NotificationsResponse>({
    notifications: [],
    unreadCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const fetchOnce = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=30", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = (await res.json()) as NotificationsResponse;
      if (mounted.current) {
        setData(json);
        setLoading(false);
      }
    } catch {
      // silent — vai tentar de novo no próximo poll
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Primeira chamada via timeout zero pra evitar "setState in effect" warning
    // do React 19 — não muda o comportamento prático.
    const initial = setTimeout(fetchOnce, 0);
    const id = setInterval(fetchOnce, pollIntervalMs);
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchOnce();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted.current = false;
      clearTimeout(initial);
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchOnce, pollIntervalMs]);

  const markRead = useCallback(async (ids: string[]) => {
    // otimista
    setData((prev) => ({
      notifications: prev.notifications.map((n) =>
        ids.includes(n._id) ? { ...n, lido: true } : n
      ),
      unreadCount: Math.max(
        0,
        prev.unreadCount -
          prev.notifications.filter((n) => ids.includes(n._id) && !n.lido).length
      ),
    }));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, acao: "ler" }),
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setData((prev) => ({
      notifications: prev.notifications.map((n) => ({ ...n, lido: true })),
      unreadCount: 0,
    }));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "ler_todas" }),
    });
  }, []);

  const archive = useCallback(async (ids: string[]) => {
    setData((prev) => ({
      notifications: prev.notifications.filter((n) => !ids.includes(n._id)),
      unreadCount: prev.unreadCount,
    }));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, acao: "arquivar" }),
    });
  }, []);

  return {
    notifications: data.notifications,
    unreadCount: data.unreadCount,
    loading,
    markRead,
    markAllRead,
    archive,
    refetch: fetchOnce,
  };
}
