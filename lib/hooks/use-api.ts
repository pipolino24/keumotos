"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet, type ApiResult } from "@/lib/api-client";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface CacheEntry<T = unknown> {
  data: T;
  ts: number;
}

// Cache global in-memory por URL. SWR-light: a página exibe imediatamente
// o último valor (se tiver) e revalida em background. Some no F5 (RAM only).
const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000; // 30s — frescor razoável pra dashboards

// In-flight requests deduplication: se duas instâncias do mesmo hook
// pedem a mesma URL ao mesmo tempo, só dispara uma fetch.
const IN_FLIGHT = new Map<string, Promise<unknown>>();

function readCache<T>(url: string): T | null {
  const hit = CACHE.get(url);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    CACHE.delete(url);
    return null;
  }
  return hit.data as T;
}

/**
 * Limpa o cache de uma URL específica (ou todas se sem arg).
 * Usado por componentes depois de POST/PATCH pra forçar refetch fresco.
 */
export function invalidateApiCache(url?: string): void {
  if (!url) {
    CACHE.clear();
    return;
  }
  CACHE.delete(url);
}

/**
 * Hook genérico pra GET de API.
 * - Cancela request em flight quando URL muda / componente desmonta
 * - Cache in-memory SWR (stale-while-revalidate) de 30s
 * - Deduplica requests concorrentes pra mesma URL
 */
export function useApi<T>(
  url: string | null,
  deps: unknown[] = []
): UseApiResult<T> {
  const cached = url ? readCache<T>(url) : null;
  const [data, setData] = useState<T | null>(cached);
  const [loading, setLoading] = useState(cached === null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    if (url) CACHE.delete(url);
    setTick((t) => t + 1);
  }, [url]);

  useEffect(() => {
    if (!url) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }

    // Cache hit fresh: já tem o dado, não precisa loading
    const cacheHit = readCache<T>(url);
    if (cacheHit !== null && tick === 0) {
      const t = setTimeout(() => {
        setData(cacheHit);
        setLoading(false);
      }, 0);
      // Continua pra revalidar em background mesmo com cache hit
      // (SWR pattern). Mas sem mostrar loading ao usuário.
      void t;
    } else {
      const initial = setTimeout(() => {
        setLoading(true);
        setError(null);
      }, 0);
      void initial;
    }

    const controller = new AbortController();
    // Dedup: se já tem uma request pendente pra essa URL, reusa a promise
    let promise = IN_FLIGHT.get(url) as Promise<ApiResult<T>> | undefined;
    if (!promise) {
      promise = apiGet<T>(url, { signal: controller.signal });
      IN_FLIGHT.set(url, promise as Promise<unknown>);
      promise.finally(() => IN_FLIGHT.delete(url));
    }

    promise.then((r) => {
      if (controller.signal.aborted) return;
      if (r.error) {
        if (r.error === "AbortError" || r.error.includes("aborted")) return;
        setError(r.error);
        // Se já tinha cache válido, mantém — não derruba a UI por flap
        if (!cacheHit) setData(null);
      } else if (r.data !== null) {
        CACHE.set(url, { data: r.data, ts: Date.now() });
        setData(r.data);
      }
      setLoading(false);
    });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...deps]);

  return { data, loading, error, refetch };
}
