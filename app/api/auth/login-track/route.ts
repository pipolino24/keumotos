import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { emitAuditLog } from "@/lib/audit/emit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login-track
 *
 * Frontend chama esse endpoint após o supabase.auth.signInWithPassword
 * (success ou failed) pra registrar tentativa de login no audit log. Não
 * autentica nada — é apenas pra rastreabilidade.
 *
 * Body: { success: boolean, email: string }
 *
 * Rate limit por IP (60/min) pra evitar spam de logs em caso de bot
 * tentando enumerar.
 */
export async function POST(req: NextRequest) {
  let body: { success?: boolean; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const success = body.success === true;
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email obrigatório" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit({
    key: `login-track:ip:${ip}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!rl.ok) {
    // Silencia rate limit pro caller — não queremos vazar o limite e
    // tampouco fazer o login falhar por causa do tracking.
    return NextResponse.json({ ok: true });
  }

  // Em login.success a gente sabe quem é (o próprio email), em login.failed
  // o "ator" é o email tentado — sem userId do Supabase (não autenticou).
  // O ID do user só descobrimos olhando a tabela profiles, mas só no success
  // (em failed o email pode nem existir, então não vale a query).
  let userId: string | undefined;
  if (success) {
    try {
      const admin = createSupabaseAdminClient();
      const { data } = await admin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (data?.id) userId = data.id as string;
    } catch {
      // best-effort — sem userId é OK, ator fica = email
    }
  }

  emitAuditLog({
    acao: success ? "login.success" : "login.failed",
    ator: userId ?? email,
    atorNome: email,
    alvoTipo: "user",
    alvoId: userId ?? email,
    alvoLabel: email,
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
