import type { UserRole } from "./types";

export interface CurrentUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  cargoId?: string;
  permissoes: string[];
  setor: "multimarcas" | "loca" | "pecas";
}

const MOCK_USERS: Record<UserRole, CurrentUser> = {
  admin: {
    id: "u1",
    nome: "Antônio Carlos Silva",
    email: "keu.admin@keumotos.com.br",
    role: "admin",
    permissoes: [],
    setor: "multimarcas",
  },
  vendedor: {
    id: "u2",
    nome: "Marcos Vinícius Lima",
    email: "marcos@keumotos.com.br",
    role: "vendedor",
    permissoes: [],
    setor: "multimarcas",
  },
  afiliado: {
    id: "u7",
    nome: "João Silva",
    email: "joao@email.com",
    role: "afiliado",
    permissoes: [],
    setor: "multimarcas",
  },
  cliente: {
    id: "u4",
    nome: "João Pedro Santos",
    email: "joaopedro@gmail.com",
    role: "cliente",
    permissoes: [],
    setor: "multimarcas",
  },
};

export function userByRole(role: UserRole): CurrentUser {
  return MOCK_USERS[role] ?? MOCK_USERS.vendedor;
}

/**
 * Server-side: lê o role do cookie `keu_role` (seteado no login).
 * Em produção, trocar por sessão real (NextAuth).
 */
export async function getCurrentUserServer(): Promise<CurrentUser> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const role = (store.get("keu_role")?.value as UserRole) || "vendedor";
    return MOCK_USERS[role] ?? MOCK_USERS.vendedor;
  } catch {
    return MOCK_USERS.vendedor;
  }
}

/**
 * Client-side: lê o role do cookie via document.cookie.
 * Fallback pra "vendedor" se não tiver cookie.
 */
export function getCurrentUser(): CurrentUser {
  if (typeof document === "undefined") {
    return MOCK_USERS.vendedor;
  }
  const match = document.cookie.match(/(?:^|;\s*)keu_role=([^;]+)/);
  const role = (match?.[1] as UserRole) || "vendedor";
  return MOCK_USERS[role] ?? MOCK_USERS.vendedor;
}

export function isAdmin(user: CurrentUser = getCurrentUser()): boolean {
  return user.role === "admin";
}

export function canSeeFinancialData(
  user: CurrentUser = getCurrentUser()
): boolean {
  return user.role === "admin";
}
