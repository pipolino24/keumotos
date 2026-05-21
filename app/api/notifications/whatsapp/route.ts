import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/api-guards";
import {
  sendWhatsAppTemplate,
  isWhatsAppConfigured,
} from "@/lib/whatsapp";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/whatsapp
 *
 * Dispara um template message via WhatsApp Cloud API (Meta).
 * Apenas admin/vendedor — emite mensagens em nome da KEU.
 *
 * Body:
 *   {
 *     "to": "5588998505859",           // E.164 sem + (ou aceitamos com formato BR)
 *     "template": "lembrete_parcela",
 *     "bodyParams": ["João", "R$ 450,00", "15/06/2026"]
 *   }
 *
 * Templates precisam estar aprovados no Meta Business Manager antes do uso.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;

  // Rate limit por usuário (não IP): WhatsApp Cloud API cobra por mensagem
  // template. Um token comprometido podia gerar custo real. 60 envios/min
  // é alto pro uso humano legítimo, baixo o suficiente pra cortar bot.
  const rl = rateLimit({
    key: `whatsapp-send:${auth.userId}:${getClientIp(req)}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitos envios em pouco tempo, espere 1min" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      {
        error:
          "WhatsApp não configurado. Defina WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN no servidor.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { to, template, bodyParams, headerParams, language } = body ?? {};

    if (typeof to !== "string" || !to.trim()) {
      return NextResponse.json({ error: "to obrigatório" }, { status: 400 });
    }
    if (typeof template !== "string" || !template.trim()) {
      return NextResponse.json(
        { error: "template obrigatório" },
        { status: 400 }
      );
    }
    if (bodyParams && !Array.isArray(bodyParams)) {
      return NextResponse.json(
        { error: "bodyParams deve ser array de strings" },
        { status: 400 }
      );
    }
    if (headerParams && !Array.isArray(headerParams)) {
      return NextResponse.json(
        { error: "headerParams deve ser array de strings" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppTemplate({
      to,
      template,
      bodyParams: bodyParams?.map(String),
      headerParams: headerParams?.map(String),
      language: typeof language === "string" ? language : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Falha ao enviar" },
        { status: result.status && result.status >= 400 ? result.status : 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
      enviadoPor: auth.email,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/notifications/whatsapp
 * Health-check: retorna se o WhatsApp está configurado (sem expor o token).
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    configured: isWhatsAppConfigured(),
    templates: [
      {
        nome: "lembrete_parcela",
        categoria: "utility",
        params: ["nome", "valor", "vencimento"],
      },
      {
        nome: "boas_vindas_cliente",
        categoria: "utility",
        params: ["nome"],
      },
      {
        nome: "moto_disponivel",
        categoria: "marketing",
        params: ["nome", "moto", "valor"],
      },
    ],
  });
}
