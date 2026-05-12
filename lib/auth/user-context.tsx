"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Profile } from "@/lib/types";

const CurrentUserContext = createContext<Profile | null>(null);

export function CurrentUserProvider({
  value,
  children,
}: {
  value: Profile | null;
  children: ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

/**
 * Hook que retorna o perfil do usuário logado.
 * Lança erro se chamado fora do <CurrentUserProvider>.
 * Em rotas protegidas (dashboard, afiliado) o provider sempre fornece um Profile.
 */
export function useCurrentUser(): Profile {
  const user = useContext(CurrentUserContext);
  if (!user) {
    throw new Error(
      "useCurrentUser deve ser usado dentro de <CurrentUserProvider> em uma rota autenticada"
    );
  }
  return user;
}

export function useCurrentUserOptional(): Profile | null {
  return useContext(CurrentUserContext);
}

export function isAdmin(user: Profile | null | undefined): boolean {
  return user?.role === "admin";
}

export function canSeeFinancialData(user: Profile | null | undefined): boolean {
  return user?.role === "admin";
}
