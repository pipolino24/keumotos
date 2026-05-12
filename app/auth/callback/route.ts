import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Aceita só paths locais — bloqueia open redirect via `?next=https://evil.com`
 * ou `?next=//evil.com`. Mesmo padrão do /login.
 */
function safeNextPath(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  if (raw.length > 200) return "/dashboard";
  if (!/^\/[^/\\]/.test(raw)) return "/dashboard";
  if (raw.includes("://")) return "/dashboard";
  return raw;
}

/**
 * Callback usado por confirmação de e-mail (signup) e magic links.
 * Troca o `code` por uma sessão (PKCE flow) e redireciona.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
