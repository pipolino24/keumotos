/**
 * Constantes de negócio do KEU Motos. Centralizadas pra não divergirem entre
 * site, app iOS e dashboards.
 *
 * Pra customizar via env (sem rebuild), use process.env.KEU_META_VENDAS_MENSAL.
 */

export const KEU_CONFIG = {
  /** Meta mensal de vendas por vendedor — usada no progresso do dashboard. */
  metaVendasMensal: Number(process.env.KEU_META_VENDAS_MENSAL) || 10,
} as const;
