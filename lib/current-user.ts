/**
 * Mock do usuário atual. Em produção, viria da sessão (NextAuth/cookies).
 * Centralizo aqui para facilitar a troca quando implementar auth real.
 */

import type { UserRole } from "./types";

export interface CurrentUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  cargoId?: string;
  permissoes: string[];
  loja: "multimarcas" | "loca" | "pecas";
}

// Mock para desenvolvimento. Em produção: lookup da sessão.
const MOCK_USER: CurrentUser = {
  id: "u2",
  nome: "Marcos Vinícius Lima",
  email: "marcos@keumotos.com.br",
  role: "vendedor",
  permissoes: [],
  loja: "multimarcas",
};

// Toggle pra simular login como admin durante desenvolvimento.
// Em produção, isso virá do JWT/cookie da sessão.
const ENABLE_ADMIN_MODE = false;

const MOCK_ADMIN: CurrentUser = {
  id: "u1",
  nome: "Antônio Carlos Silva",
  email: "keu.admin@keumotos.com.br",
  role: "admin",
  permissoes: [],
  loja: "multimarcas",
};

export function getCurrentUser(): CurrentUser {
  return ENABLE_ADMIN_MODE ? MOCK_ADMIN : MOCK_USER;
}

export function isAdmin(user: CurrentUser = getCurrentUser()): boolean {
  return user.role === "admin";
}

export function canSeeFinancialData(
  user: CurrentUser = getCurrentUser()
): boolean {
  return user.role === "admin";
}
