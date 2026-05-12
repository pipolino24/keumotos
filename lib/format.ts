/**
 * Helpers de formatação BR — CPF, telefone, placa, dinheiro.
 * Normaliza pra armazenamento (digits-only) e formata pra exibição.
 */

export function normalizeDigits(s: string | undefined | null): string {
  return (s ?? "").replace(/\D/g, "");
}

export function normalizeCpf(s: string | undefined | null): string {
  return normalizeDigits(s).slice(0, 11);
}

export function formatCpf(digits: string | undefined | null): string {
  const d = normalizeCpf(digits);
  if (d.length !== 11) return d;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function normalizeTelefone(s: string | undefined | null): string {
  return normalizeDigits(s).slice(0, 11);
}

export function formatTelefone(digits: string | undefined | null): string {
  const d = normalizeTelefone(digits);
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return d;
}

export function normalizeCep(s: string | undefined | null): string {
  return normalizeDigits(s).slice(0, 8);
}

export function formatCep(digits: string | undefined | null): string {
  const d = normalizeCep(digits);
  if (d.length !== 8) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function normalizePlaca(s: string | undefined | null): string {
  return (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

export function formatPlaca(s: string | undefined | null): string {
  const p = normalizePlaca(s);
  if (p.length === 7) return `${p.slice(0, 3)}-${p.slice(3)}`;
  return p;
}

/**
 * Valida CPF brasileiro (algoritmo dos dois dígitos verificadores).
 * Não bloqueia campos opcionais — caller decide.
 */
export function isCpfValid(s: string | undefined | null): boolean {
  const d = normalizeCpf(s);
  if (d.length !== 11) return false;
  if (/^(\d)\1+$/.test(d)) return false; // 11111111111 etc.
  const calc = (slice: number): number => {
    let sum = 0;
    for (let i = 0; i < slice; i++) {
      sum += parseInt(d[i], 10) * (slice + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === parseInt(d[9], 10) && calc(10) === parseInt(d[10], 10);
}
