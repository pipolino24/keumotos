/**
 * Fetch utilitário com timeout, parse de erro e tipagem.
 */
export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<ApiResult<T>> {
  const { timeoutMs = 15000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(rest.headers ?? {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err =
        (json as { error?: string; message?: string }).error ??
        (json as { message?: string }).message ??
        `${res.status} ${res.statusText}`;
      return { data: null, error: err };
    }
    return { data: json as T, error: null };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { data: null, error: "Tempo limite excedido. Tente novamente." };
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erro de rede",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet<T = unknown>(url: string): Promise<ApiResult<T>> {
  return apiFetch<T>(url);
}

export async function apiPost<T = unknown>(
  url: string,
  body: unknown
): Promise<ApiResult<T>> {
  return apiFetch<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export async function apiPatch<T = unknown>(
  url: string,
  body: unknown
): Promise<ApiResult<T>> {
  return apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiDelete<T = unknown>(
  url: string
): Promise<ApiResult<T>> {
  return apiFetch<T>(url, { method: "DELETE" });
}
