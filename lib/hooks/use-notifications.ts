"use client";

import { useEffect, useState, useCallback } from "react";

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

interface Snapshot {
  data: NotificationsResponse;
  loading: boolean;
}

// ===== STORE SINGLETON =====
// Antes o hook criava um polling separado por componente que o usava
// (Sidebar + cada NavLinkInner + Bell + dashboard). Múltiplas instâncias do
// hook viravam múltiplas chamadas paralelas pra /api/notifications a cada 25s.
// Aqui mantemos UMA fonte de verdade global compartilhada por todos os
// subscribers.

const POLL_MS = 30_000; // 30s — antes era 25s; subimos um pouco
const ENDPOINT = "/api/notifications?limit=30";

let snapshot: Snapshot = {
  data: { notifications: [], unreadCount: 0 },
  loading: true,
};

const subscribers = new Set<() => void>();
let pollTimer: ReturnType<typeof setInterval> | null = null;
let visibilityListenerArmed = false;
let lastFetchAt = 0;
let inFlight: Promise<void> | null = null;

function notifyAll() {
  for (const cb of subscribers) cb();
}

async function fetchOnce(): Promise<void> {
  // Dedup: se já tem uma fetch em flight, todos esperam ela
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as NotificationsResponse;
      snapshot = {
        data: {
          notifications: Array.isArray(json.notifications)
            ? json.notifications
            : [],
          unreadCount:
            typeof json.unreadCount === "number" ? json.unreadCount : 0,
        },
        loading: false,
      };
      lastFetchAt = Date.now();
      notifyAll();
    } catch {
      // silent — próximo poll tenta de novo. Mantém snapshot anterior.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

function ensurePolling() {
  if (pollTimer || typeof window === "undefined") return;
  pollTimer = setInterval(() => {
    if (document.visibilityState === "visible") fetchOnce();
  }, POLL_MS);
  if (!visibilityListenerArmed) {
    const onVisibility = () => {
      // Quando aba volta ao foco depois de 25s+, faz refresh imediato
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastFetchAt > POLL_MS
      ) {
        fetchOnce();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    visibilityListenerArmed = true;
  }
}

function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  ensurePolling();
  // Primeiro fetch on demand (se ninguém fez ainda OU se faz tempo)
  if (Date.now() - lastFetchAt > POLL_MS) fetchOnce();
  return () => {
    subscribers.delete(cb);
    // Mantém polling vivo enquanto houver pelo menos 1 subscriber
    if (subscribers.size === 0 && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

function applyOptimistic(updater: (s: Snapshot) => Snapshot) {
  snapshot = updater(snapshot);
  notifyAll();
}

/**
 * Hook que retorna o snapshot atual de notificações compartilhado por todos
 * os componentes. Múltiplas instâncias = 1 polling só.
 */
export function useNotifications() {
  const [, force] = useState({});
  useEffect(() => {
    const unsubscribe = subscribe(() => force({}));
    return unsubscribe;
  }, []);

  const markRead = useCallback(async (ids: string[]) => {
    applyOptimistic((s) => ({
      ...s,
      data: {
        notifications: s.data.notifications.map((n) =>
          ids.includes(n._id) ? { ...n, lido: true } : n
        ),
        unreadCount: Math.max(
          0,
          s.data.unreadCount -
            s.data.notifications.filter(
              (n) => ids.includes(n._id) && !n.lido
            ).length
        ),
      },
    }));
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, acao: "ler" }),
      });
      const json = await res.json().catch(() => null);
      if (json && typeof json.unreadCount === "number") {
        applyOptimistic((s) => ({
          ...s,
          data: { ...s.data, unreadCount: json.unreadCount },
        }));
      }
    } catch {
      // silent
    }
  }, []);

  const markAllRead = useCallback(async () => {
    applyOptimistic((s) => ({
      ...s,
      data: {
        notifications: s.data.notifications.map((n) => ({ ...n, lido: true })),
        unreadCount: 0,
      },
    }));
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "ler_todas" }),
      });
      const json = await res.json().catch(() => null);
      if (json && typeof json.unreadCount === "number") {
        applyOptimistic((s) => ({
          ...s,
          data: { ...s.data, unreadCount: json.unreadCount },
        }));
      }
    } catch {
      // silent
    }
  }, []);

  const archive = useCallback(async (ids: string[]) => {
    applyOptimistic((s) => ({
      ...s,
      data: {
        notifications: s.data.notifications.filter(
          (n) => !ids.includes(n._id)
        ),
        unreadCount: s.data.unreadCount,
      },
    }));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, acao: "arquivar" }),
    });
  }, []);

  return {
    notifications: snapshot.data.notifications,
    unreadCount: snapshot.data.unreadCount,
    loading: snapshot.loading,
    markRead,
    markAllRead,
    archive,
    refetch: fetchOnce,
  };
}
