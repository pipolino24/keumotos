import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Aceita só paths locais — bloqueia open redirect. Mesmo padrão do
 * /auth/callback. Se `next` vier como URL absoluta (ex.: o Supabase
 * passa o redirectTo bruto), reduz pro pathname seguro.
 */
function safeNextPath(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  let candidate = raw;
  // Trata URL absoluta — extrai só pathname+search se aponta pra
  // gente; rejeita se for outro host.
  if (/^https?:\/\//i.test(candidate)) {
    try {
      const url = new URL(candidate);
      candidate = url.pathname + url.search + url.hash;
    } catch {
      return "/dashboard";
    }
  }
  if (candidate.length > 200) return "/dashboard";
  if (!/^\/[^/\\]/.test(candidate)) return "/dashboard";
  if (candidate.includes("://")) return "/dashboard";
  return candidate;
}

const TIPOS_OTP_VALIDOS = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

/**
 * Endpoint usado pelos links de e-mail do Supabase (Auth → URL Configuration
 * → template padrão `{{ .ConfirmationURL }}` em PKCE). O link chega como
 *   /auth/confirm?token_hash=...&type=recovery&next=/auth/reset-password
 *
 * Trocamos o token_hash por uma sessão via verifyOtp e mandamos pra `next`.
 * Recovery cai no /auth/reset-password (a sessão fica "PASSWORD_RECOVERY"
 * e o front mostra o form de nova senha).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const typeRaw = searchParams.get("type");
  const type =
    typeRaw && TIPOS_OTP_VALIDOS.has(typeRaw) ? (typeRaw as EmailOtpType) : null;
  const next = safeNextPath(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Falha: manda pro login com erro pra usuário tentar de novo
  return NextResponse.redirect(
    `${origin}/login?error=auth_confirm_failed`
  );
}
