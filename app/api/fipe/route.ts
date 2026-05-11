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
 * Endpoint unificado para consulta FIPE.
 *
 * Query params:
 *   ?type=motorcycles|cars|trucks (default: motorcycles)
 *   ?brand=<code>                  → lista modelos
 *   ?brand=<code>&model=<code>     → lista anos
 *   ?brand=<code>&model=<code>&year=<code> → retorna valor
 *   (sem params)                    → lista marcas
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type =
      (searchParams.get("type") as "motorcycles" | "cars" | "trucks") ||
      "motorcycles";
    const brand = searchParams.get("brand");
    const model = searchParams.get("model");
    const year = searchParams.get("year");

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
