/**
 * Feature flags do KEU. Mude o valor aqui pra reativar/desativar features
 * SEM mexer no código das pages/APIs subjacentes.
 *
 * Histórico:
 * - 2026-06-05: AFILIADOS_OCULTOS=true a pedido do dono (esconder portal
 *   /afiliado, rotas admin /dashboard/afiliados, deep link /m/[codigo]
 *   e tracker em /motos/[id]). Backend e dados intactos.
 */

export const AFILIADOS_OCULTOS = true;
