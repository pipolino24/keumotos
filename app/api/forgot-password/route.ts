import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/forgot-password
 *
 * Endpoint server-side pro reset de senha. Antes o forgot-password chamava
 * `supabase.auth.resetPasswordForEmail` direto do browser sem nenhuma
 * proteção — qualquer atacante podia disparar 1000 emails/segundo, fazer
 * enumeration de emails válidos ou DoS na caixa do user.
 *
 * Agora:
 *  - Rate limit por IP (10 req / 15min): protege contra atacante único
 *  - Rate limit por email (3 req / hora): protege user específico de spam
 *  - Resposta SEMPRE "ok" mesmo se email não existe (anti-enumeration)
 *  - Validação básica de formato
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; redirectTo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "E-mail inválido" },
      { status: 400 }
    );
  }

  // Rate limit por IP (10/15min) — atacante único não consegue spammar
  const ip = getClientIp(req);
  const rlIp = rateLimit({
    key: `forgot-password:ip:${ip}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rlIp.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas — tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  // Rate limit por email (3/hora) — proteção pro usuário do spam de reset
  const rlEmail = rateLimit({
    key: `forgot-password:email:${email}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rlEmail.ok) {
    // Resposta neutra: não revela se email existe. Atacante só vê 200 sempre.
    return NextResponse.json({ ok: true });
  }

  // Valida redirectTo pra evitar open redirect (cliente pode mandar qualquer
  // URL no body). Só aceita URLs do nosso domínio.
  const ALLOWED_HOSTS = new Set([
    "keumotos.com",
    "www.keumotos.com",
    "localhost:3000",
  ]);
  let redirectTo: string | undefined;
  if (body.redirectTo) {
    try {
      const u = new URL(body.redirectTo);
      if (ALLOWED_HOSTS.has(u.host)) {
        redirectTo = body.redirectTo;
      }
    } catch {
      // ignore — sem redirectTo válido o Supabase usa o Site URL padrão
    }
  }

  // Service role pra disparar email do lado server (sem expor key pro browser)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );

  // resetPasswordForEmail é idempotente do lado Supabase — se email não
  // existe, retorna ok mesmo. Não revela se a conta existe pro chamador.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  return NextResponse.json({ ok: true });
}
