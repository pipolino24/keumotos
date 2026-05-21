import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api-guards";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/email
 *
 * Envia email transacional via Resend. Apenas staff (admin/vendedor).
 *
 * Body:
 *   {
 *     "to": "cliente@email.com" | ["a@x.com", "b@y.com"],
 *     "subject": "Sua moto está pronta",
 *     "html": "<h1>...</h1>"  // OU
 *     "text": "..."
 *   }
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;

  // Rate limit por usuário: Resend cobra por email. Token comprometido podia
  // gerar custo + dano reputacional (domínio entra em blacklist). 100/min
  // cobre uso humano legítimo (envio em lote pra ~10-20 clientes).
  const rl = rateLimit({
    key: `email-send:${auth.userId}:${getClientIp(req)}`,
    limit: 100,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitos envios em pouco tempo, espere 1min" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email não configurado. Defina RESEND_API_KEY no servidor pra habilitar.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { to, subject, html, text, replyTo } = body ?? {};

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return NextResponse.json({ error: "to obrigatório" }, { status: 400 });
    }
    if (typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json(
        { error: "subject obrigatório" },
        { status: 400 }
      );
    }
    if (!html && !text) {
      return NextResponse.json(
        { error: "html ou text obrigatório" },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to,
      subject,
      html: typeof html === "string" ? html : undefined,
      text: typeof text === "string" ? text : undefined,
      replyTo: typeof replyTo === "string" ? replyTo : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Falha ao enviar email" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: result.id,
      enviadoPor: auth.email,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/notifications/email — health check (sem expor a chave).
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ configured: isEmailConfigured() });
}
