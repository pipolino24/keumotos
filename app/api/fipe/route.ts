import { NextRequest, NextResponse } from "next/server";
import {
  fipeBrands,
  fipeModels,
  fipeYears,
  fipeValue,
  parseFipePrice,
} from "@/lib/fipe";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * Endpoint unificado para consulta FIPE. Requer autenticação (qualquer role)
 * pra evitar uso como proxy aberto de SSRF / abuso da API externa.
 *
 * Query params validados como dígitos curtos. Tipo restrito ao enum.
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

function valido(v: string | null): v is string {
  return !!v && CODE_RE.test(v);
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
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

    if (brand && model && year) {
      const data = await fipeValue(brand, model, year, type);
      return NextResponse.json({
        ...data,
        priceNumber: parseFipePrice(data.price),
      });
    }

    if (brand && model) {
      const years = await fipeYears(brand, model, type);
      return NextResponse.json({ years });
    }

    if (brand) {
      const models = await fipeModels(brand, type);
      return NextResponse.json({ models });
    }

    const brands = await fipeBrands(type);
    return NextResponse.json({ brands });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro FIPE";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
