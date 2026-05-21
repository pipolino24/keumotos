/**
 * Helper de lookup de CEP via ViaCEP (oficial, gratuito, sem chave).
 *
 * Cache in-memory: 50 CEPs mais recentes. Como CEP→endereço é praticamente
 * imutável, faz sentido segurar até o user dar refresh.
 */

export interface CepData {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const CACHE = new Map<string, CepData | null>();
const CACHE_MAX = 50;

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

/**
 * Busca o endereço do CEP. Retorna null se CEP inválido / não encontrado.
 * Faz timeout de 4s pra não travar o form se o ViaCEP estiver lento.
 */
export async function lookupCep(cepRaw: string): Promise<CepData | null> {
  const cep = cepRaw.replace(/\D/g, "");
  if (cep.length !== 8) return null;

  if (CACHE.has(cep)) return CACHE.get(cep) ?? null;

  // ViaCEP retorna 200 com `{erro: true}` pra CEPs não-existentes.
  // Sem AbortController em React strict-mode + double-effect quebra.
  // 4s é mais que suficiente — ViaCEP normalmente responde em <500ms.
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      CACHE.set(cep, null);
      return null;
    }
    const data: ViaCepResponse = await res.json();
    if (data.erro) {
      CACHE.set(cep, null);
      return null;
    }
    const result: CepData = {
      cep,
      logradouro: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      estado: data.uf ?? "",
    };
    // LRU eviction simples: se passou do limite, dropa o primeiro
    if (CACHE.size >= CACHE_MAX) {
      const first = CACHE.keys().next().value;
      if (first !== undefined) CACHE.delete(first);
    }
    CACHE.set(cep, result);
    return result;
  } catch {
    // AbortError ou network error — silenciosamente retorna null,
    // user pode preencher manualmente.
    return null;
  }
}

/**
 * Formata "00000000" como "00000-000".
 */
export function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
