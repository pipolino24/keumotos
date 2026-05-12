import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Retorna o profile do usuário logado, ou null se não há sessão.
 * Use em Server Components / Route Handlers.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (profile as Profile) ?? null;
}

/**
 * Retorna o profile do usuário logado, ou redireciona para /login.
 * Use em rotas que exigem autenticação.
 */
export async function requireProfile(redirectTo?: string): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    const url = redirectTo ? `/login?next=${encodeURIComponent(redirectTo)}` : "/login";
    redirect(url);
  }
  return profile;
}

/**
 * Retorna o profile do usuário e exige que seja admin.
 * Redireciona para /dashboard com flag forbidden se não for.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    redirect("/dashboard?forbidden=1");
  }
  return profile;
}
