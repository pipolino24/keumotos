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
const CACHE_TTL_MS = 30_000;

// In-flight requests deduplication. A fetch NÃO recebe AbortSignal — se 1
// instância desmonta, outras instâncias da mesma URL continuam recebendo
// o resultado quando ele chegar. Antes a fetch era cancelada e os hooks
// remanescentes ficavam com loading=true pra sempre.
const IN_FLIGHT = new Map<string, Promise<ApiResult<unknown>>>();

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
 * Útil depois de POST/PATCH pra forçar refetch fresco.
 */
export function invalidateApiCache(url?: string): void {
  if (!url) {
    CACHE.clear();
    return;
  }
  CACHE.delete(url);
}

function fetchDedup<T>(url: string): Promise<ApiResult<T>> {
  const existing = IN_FLIGHT.get(url);
  if (existing) return existing as Promise<ApiResult<T>>;
  // SEM signal: a fetch corre até o fim independente de qual instância
  // desmontou. O apiGet ainda tem timeout interno (default 15s).
  const p = apiGet<T>(url).finally(() => {
    // Remove do mapa pra próxima requisição não pegar dado stale do flight
    IN_FLIGHT.delete(url);
  });
  IN_FLIGHT.set(url, p as Promise<ApiResult<unknown>>);
  return p;
}

/**
 * Hook genérico pra GET de API.
 * - Cache in-memory SWR (stale-while-revalidate) de 30s
 * - Deduplica requests concorrentes pra mesma URL
 * - Cleanup correto: se a instância desmonta antes da fetch resolver,
 *   o resultado ainda é gravado no cache (próxima montagem pega instantâneo)
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
    let mounted = true;

    if (!url) {
      // setTimeout 0 evita "setState in effect" warning do React 19
      const t = setTimeout(() => {
        if (mounted) setLoading(false);
      }, 0);
      return () => {
        mounted = false;
        clearTimeout(t);
      };
    }

    const cacheHit = readCache<T>(url);
    if (cacheHit !== null && tick === 0) {
      // Cache hit: sync set, sem precisar de loading state
      setData(cacheHit);
      setLoading(false);
    } else {
      // Sem cache: já temos useState(loading=true) no init.
      // Resetar error pra refetch limpo.
      setError(null);
    }
    // ANTES: usávamos setTimeout(setLoading(true), 0) "pra evitar setState
    // warning do React 19". Mas isso criava race condition: se a fetch
    // resolvia ANTES do setTimeout (CDN cache rápido, dedup hit), o
    // setLoading(true) atrasado executava DEPOIS do setLoading(false) do
    // fetch resolve — `loading` ficava preso em true pra sempre.
    // /dashboard/administracao reproduzia 100% das vezes.

    fetchDedup<T>(url).then((r) => {
      // Sempre atualiza o cache mesmo se a instância desmontou.
      // Próxima montagem do hook pega cache fresh imediato.
      if (!r.error && r.data !== null) {
        CACHE.set(url, { data: r.data, ts: Date.now() });
      }

      if (!mounted) return;

      if (r.error) {
        // AbortError não deveria mais acontecer aqui (sem signal),
        // mas mantemos o filtro por segurança.
        if (r.error === "AbortError" || r.error.includes("aborted")) {
          setLoading(false);
          return;
        }
        setError(r.error);
        if (!cacheHit) setData(null);
      } else if (r.data !== null) {
        setData(r.data);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...deps]);

  return { data, loading, error, refetch };
}
