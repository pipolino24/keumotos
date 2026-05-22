import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function formatKm(km: number): string {
  return new Intl.NumberFormat("pt-BR").format(km) + " km";
}

/**
 * Mask para input de CPF — aceita string com ou sem máscara e devolve
 * "000.000.000-00" (incompleta enquanto user digita). Usar em onChange:
 *   onChange={(e) => set("cpf", formatCpfInput(e.target.value))}
 */
export function formatCpfInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Mask para input de telefone BR. Aceita 10 ou 11 dígitos.
 * Formatos: "(88) 9999-9999" ou "(88) 99999-9999".
 */
export function formatPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length === 0 ? "" : `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Mask para input de placa Mercosul (AAA-0A00) ou antiga (AAA-0000).
 * Aceita 7 chars alfanuméricos, uppercase forçado.
 */
export function formatPlacaInput(raw: string): string {
  const d = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)}-${d.slice(3)}`;
}

/**
 * Tempo relativo compacto (sem sufixo). Granularidade minuto/hora/dia.
 * Output: "agora" | "5m" | "2h" | "3d". Pra widgets e bell.
 */
export function tempoRelativo(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

/**
 * Tempo relativo verbose com sufixo "atrás". Granularidade minuto/hora/dia.
 * Output: "agora" | "5m atrás" | "2h atrás" | "3d atrás".
 */
export function tempoAtras(iso?: string | null): string {
  if (!iso) return "—";
  const r = tempoRelativo(iso);
  return r === "agora" ? r : `${r} atrás`;
}

/**
 * Tempo relativo com granularidade dia (sem minuto/hora).
 * Output: "hoje" | "ontem" | "5d atrás" | "2m atrás".
 * Pra listagens onde o "minuto exato" não importa.
 */
export function tempoDia(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `${d}d atrás`;
  const m = Math.floor(d / 30);
  return `${m}m atrás`;
}
