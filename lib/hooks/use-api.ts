"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api-client";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook genérico pra GET de API. Cancela a request em flight quando a URL
 * muda ou o componente desmonta — evita race condition onde resposta
 * antiga sobrescreve estado novo.
 */
export function useApi<T>(
  url: string | null,
  deps: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!url) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    const controller = new AbortController();
    // setState diferido pra evitar cascading render warning
    const initial = setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    apiGet<T>(url, { signal: controller.signal }).then((r) => {
      if (controller.signal.aborted) return;
      if (r.error) {
        // Aborted requests não devem virar error visível pro usuário
        if (r.error === "AbortError" || r.error.includes("aborted")) return;
        setError(r.error);
        setData(null);
      } else {
        setData(r.data);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(initial);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...deps]);

  return { data, loading, error, refetch };
}
