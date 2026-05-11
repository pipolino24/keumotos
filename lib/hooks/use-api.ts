"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/api-client";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

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
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<T>(url).then((r) => {
      if (cancelled) return;
      if (r.error) {
        setError(r.error);
        setData(null);
      } else {
        setData(r.data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...deps]);

  return { data, loading, error, refetch };
}
