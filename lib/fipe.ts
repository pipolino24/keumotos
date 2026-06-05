export const FIPE_BASE = "https://parallelum.com.br/fipe/api/v2";

export interface FipeBrand {
  code: string;
  name: string;
}

export interface FipeModel {
  code: string;
  name: string;
}

export interface FipeYear {
  code: string;
  name: string;
}

export interface FipeValue {
  vehicleType: number;
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  codeFipe: string;
  referenceMonth: string;
  fuelAcronym: string;
}

type VehicleType = "cars" | "motorcycles" | "trucks";

async function fetchFipe<T>(
  path: string,
  options?: { revalidate?: number }
): Promise<T> {
  // Timeout de 5s — se Parallelum cair, antes a request travava até a
  // Vercel matar a função (até 5min). Agora retorna erro rápido e o
  // catálogo segue (componentes upstream tratam o erro).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${FIPE_BASE}${path}`, {
      next: { revalidate: options?.revalidate ?? 60 * 60 * 24 },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(
        `FIPE API error: ${res.status} ${res.statusText} (${path})`
      );
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`FIPE API timeout (5s) — ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function fipeBrands(
  type: VehicleType = "motorcycles"
): Promise<FipeBrand[]> {
  return fetchFipe<FipeBrand[]>(`/${type}/brands`);
}

export function fipeModels(
  brandCode: string,
  type: VehicleType = "motorcycles"
): Promise<FipeModel[]> {
  return fetchFipe<FipeModel[]>(`/${type}/brands/${brandCode}/models`);
}

export function fipeYears(
  brandCode: string,
  modelCode: string,
  type: VehicleType = "motorcycles"
): Promise<FipeYear[]> {
  return fetchFipe<FipeYear[]>(
    `/${type}/brands/${brandCode}/models/${modelCode}/years`
  );
}

export function fipeValue(
  brandCode: string,
  modelCode: string,
  yearCode: string,
  type: VehicleType = "motorcycles"
): Promise<FipeValue> {
  return fetchFipe<FipeValue>(
    `/${type}/brands/${brandCode}/models/${modelCode}/years/${yearCode}`
  );
}

export function parseFipePrice(price: string): number {
  return Number(
    price.replace(/[R$\s.]/g, "").replace(",", ".").trim()
  );
}
