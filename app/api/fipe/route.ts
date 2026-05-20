import { NextRequest, NextResponse } from "next/server";
import {
  fipeBrands,
  fipeModels,
  fipeYears,
  fipeValue,
  parseFipePrice,
} from "@/lib/fipe";

export const dynamic = "force-dynamic";

/**
 * Endpoint público de consulta FIPE — dados de referência públicos, sem auth.
 * Anti-abuso: rate limit por IP (60 req / minuto) + validação estrita dos params
 * (evita usar como proxy SSRF).
 *
 * Query params:
 *   ?type=motorcycles|cars|trucks (default: motorcycles)
 *   ?brand=<code>                  → lista modelos
 *   ?brand=<code>&model=<code>     → lista anos
 *   ?brand=<code>&model=<code>&year=<code> → retorna valor
 *   (sem params)                    → lista marcas
 */

const TIPOS_VALIDOS = new Set(["motorcycles", "cars", "trucks"]);
const CODE_RE = /^[A-Za-z0-9-]{1,32}$/;

// Rate limit in-memory: 60 req/min por IP. Suficiente pra dev e single-instance
// Vercel. Pra multi-instance, migrar pra Upstash Redis.
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateHits = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "anon";
}

function rateLimitExceeded(ip: string): boolean {
  const now = Date.now();
  const cur = rateHits.get(ip);
  if (!cur || cur.resetAt < now) {
    rateHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  cur.count += 1;
  return cur.count > RATE_LIMIT_MAX;
}

function valido(v: string | null): v is string {
  return !!v && CODE_RE.test(v);
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  if (rateLimitExceeded(ip)) {
    return NextResponse.json(
      { error: "Muitas requisições. Tenta de novo em 1min." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type") || "motorcycles";
    if (!TIPOS_VALIDOS.has(typeParam)) {
      return NextResponse.json({ error: "type inválido" }, { status: 400 });
    }
    const type = typeParam as "motorcycles" | "cars" | "trucks";
    const brand = searchParams.get("brand");
    const model = searchParams.get("model");
    const year = searchParams.get("year");

    for (const [name, value] of [
      ["brand", brand],
      ["model", model],
      ["year", year],
    ] as const) {
      if (value !== null && !valido(value)) {
        return NextResponse.json(
          { error: `${name} inválido` },
          { status: 400 }
        );
      }
    }

    // Dados FIPE são públicos e atualizados mensalmente — cacheável por
    // hora no CDN (Vercel Edge), poupando hits no upstream Parallelum
    // (que tem rate limit). s-maxage só vale pro CDN; client guarda 5min.
    const cacheHeaders = {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400, max-age=300",
    };

    if (brand && model && year) {
      const data = await fipeValue(brand, model, year, type);
      return NextResponse.json(
        { ...data, priceNumber: parseFipePrice(data.price) },
        { headers: cacheHeaders }
      );
    }

    if (brand && model) {
      const years = await fipeYears(brand, model, type);
      return NextResponse.json({ years }, { headers: cacheHeaders });
    }

    if (brand) {
      const models = await fipeModels(brand, type);
      return NextResponse.json({ models }, { headers: cacheHeaders });
    }

    const brands = await fipeBrands(type);
    return NextResponse.json({ brands }, { headers: cacheHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro FIPE";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
