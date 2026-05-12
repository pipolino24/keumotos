import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

interface AuthOk {
  ok: true;
  userId: string;
  email: string;
  role: UserRole;
}

interface AuthDenied {
  ok: false;
  response: NextResponse;
}

/**
 * Garante que o caller está autenticado. Retorna o user (ok:true)
 * ou um NextResponse 401 (ok:false) pronto pra ser retornado.
 *
 * Uso:
 *   const auth = await requireAuth();
 *   if (!auth.ok) return auth.response;
 *   // auth.userId, auth.role disponíveis
 */
export async function requireAuth(): Promise<AuthOk | AuthDenied> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  const role = ((user.user_metadata?.role as UserRole) || "cliente") as UserRole;
  return { ok: true, userId: user.id, email: user.email ?? "", role };
}

/**
 * Garante caller autenticado + role em allowed[]. Retorna user ou 401/403.
 */
export async function requireRole(
  allowed: UserRole[]
): Promise<AuthOk | AuthDenied> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;
  if (!allowed.includes(auth.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Sem permissão para essa operação" },
        { status: 403 }
      ),
    };
  }
  return auth;
}

/**
 * Apenas admin.
 */
export async function requireAdmin(): Promise<AuthOk | AuthDenied> {
  return requireRole(["admin"]);
}
