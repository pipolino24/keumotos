import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

/**
 * Resolve role via Bearer JWT (mobile). Lê profiles com service role pra
 * passar por baixo do RLS — query é sempre WHERE id = <jwt.sub> então é seguro.
 */
async function resolveBearer(bearer: string): Promise<AuthOk | null> {
  try {
    const anon = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon.auth.getUser(bearer);
    if (error || !data.user) return null;
    const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: prof } = await admin
      .from("profiles")
      .select("role,email")
      .eq("id", data.user.id)
      .single();
    const role = ((prof?.role as UserRole) ?? "cliente") as UserRole;
    const email = (prof?.email as string) ?? data.user.email ?? "";
    return { ok: true, userId: data.user.id, email, role };
  } catch {
    return null;
  }
}

/**
 * Garante que o caller está autenticado. Aceita cookie SSR (web) OU Bearer
 * JWT (mobile). Retorna o user (ok:true) ou um NextResponse 401.
 *
 * Uso:
 *   const auth = await requireAuth();
 *   if (!auth.ok) return auth.response;
 */
export async function requireAuth(req?: NextRequest): Promise<AuthOk | AuthDenied> {
  // 1. Mobile: Bearer header
  // Lê de NextRequest se passado (mais confiável), senão tenta headers() async.
  let authHeader = "";
  if (req) {
    authHeader = req.headers.get("authorization") ?? "";
  } else {
    try {
      const h = await headers();
      authHeader = h.get("authorization") ?? "";
    } catch { /* segue */ }
  }
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;
  if (bearer) {
    const resolved = await resolveBearer(bearer);
    if (resolved) return resolved;
  }

  // 2. Web: cookie SSR
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
  // SECURITY: role precisa vir da tabela profiles (server-source-of-truth).
  // user_metadata é mutável pelo próprio usuário via auth.updateUser({data:{...}})
  // — se confiarmos nele, qualquer cliente vira admin com 1 chamada.
  const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: prof } = await admin
    .from("profiles")
    .select("role,email")
    .eq("id", user.id)
    .single();
  const role = ((prof?.role as UserRole) ?? "cliente") as UserRole;
  const email = (prof?.email as string) ?? user.email ?? "";
  return { ok: true, userId: user.id, email, role };
}

/**
 * Garante caller autenticado + role em allowed[]. Retorna user ou 401/403.
 */
export async function requireRole(
  allowed: UserRole[],
  req?: NextRequest
): Promise<AuthOk | AuthDenied> {
  const auth = await requireAuth(req);
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
export async function requireAdmin(req?: NextRequest): Promise<AuthOk | AuthDenied> {
  return requireRole(["admin"], req);
}

/**
 * Verifica se a request vem do Vercel Cron com o CRON_SECRET correto.
 *
 * Vercel envia `Authorization: Bearer $CRON_SECRET` quando dispara o
 * endpoint configurado em vercel.json. Esse header NÃO é o JWT do
 * usuário — é um secret estável que só a infra Vercel conhece.
 */
export function isVercelCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

/**
 * Permite acesso se for admin OU se a request veio do Vercel Cron.
 * Usado em endpoints de manutenção que precisam rodar agendado.
 */
export async function requireAdminOrCron(
  req: NextRequest
): Promise<AuthOk | AuthDenied> {
  if (isVercelCron(req)) {
    // Identidade sintética pra cron — não é um usuário real, mas
    // satisfaz a forma AuthOk pros endpoints que esperam `auth.userId` etc.
    return {
      ok: true,
      userId: "system:vercel-cron",
      email: "cron@vercel",
      role: "admin",
    };
  }
  return requireAdmin(req);
}
