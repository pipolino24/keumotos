/**
 * Rate limiter simples em memória — janela deslizante por chave (IP).
 *
 * Limitação consciente: como Next no Vercel cria múltiplas instâncias
 * serverless, o limite por instância pode ser menor que o configurado.
 * Pra protecão real em escala, trocar por Upstash Ratelimit ou similar.
 * Aqui já barra a maioria do tráfego abusivo sem dependência externa.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

// Limpeza preguiçosa: a cada N entradas, varre buckets expirados.
let opsSinceClean = 0;
function maybeCleanup(now: number) {
  opsSinceClean++;
  if (opsSinceClean < 200) return;
  opsSinceClean = 0;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitOptions {
  /** Identificador único — geralmente IP + endpoint. */
  key: string;
  /** Máximo de hits permitidos na janela. */
  limit: number;
  /** Janela em milissegundos. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  maybeCleanup(now);
  const bucket = buckets.get(opts.key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, resetAt: now + opts.windowMs };
  }
  if (bucket.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count++;
  return {
    ok: true,
    remaining: opts.limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/**
 * Helper que extrai IP do request — usa X-Forwarded-For (Vercel/Cloudflare),
 * X-Real-IP como fallback, ou "unknown" se nada.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
