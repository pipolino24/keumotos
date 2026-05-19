/**
 * WhatsApp Cloud API (Meta) — wrapper minimal pra disparar template messages
 * a partir do backend.
 *
 * Variáveis de ambiente requeridas:
 *   WHATSAPP_PHONE_NUMBER_ID   — id do número (Meta Business)
 *   WHATSAPP_ACCESS_TOKEN      — token permanente do system user
 *   WHATSAPP_API_VERSION       — opcional (default v22.0)
 *
 * Templates esperados (precisam estar aprovados no Meta Business Manager):
 *   - "lembrete_parcela"       — utility (lembrete de parcela do Plano Conquista)
 *   - "boas_vindas_cliente"    — utility (pós-cadastro)
 *   - "moto_disponivel"        — marketing (alerta de interesse)
 *
 * Custos referência (Brasil, 2026): utility ~$0.014/msg, marketing $0.0625/msg,
 * auth $0.014/msg. Sem cobrança em mensagens que falham na entrega.
 */

const META_API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v22.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";

export type TemplateParam = { type: "text"; text: string };

export interface SendTemplateArgs {
  to: string; // telefone E.164 sem + (ex: 5588998505859)
  template: string;
  language?: string; // default pt_BR
  bodyParams?: string[]; // strings que vão pros {{1}}, {{2}}... do template
  headerParams?: string[];
  buttonParams?: { subType: "url" | "quick_reply"; index: number; param: string }[];
}

export interface SendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  status?: number;
}

function normalizePhone(raw: string): string {
  // Aceita +55..., 88998505859, (88) 99850-5859, etc → devolve só dígitos
  const digits = raw.replace(/\D/g, "");
  // Se já começa com 55, mantém; senão, prepende 55 (Brasil)
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export async function sendWhatsAppTemplate(
  args: SendTemplateArgs
): Promise<SendResult> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return {
      ok: false,
      error:
        "WhatsApp não configurado: defina WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN",
    };
  }

  const components: Record<string, unknown>[] = [];

  if (args.headerParams && args.headerParams.length > 0) {
    components.push({
      type: "header",
      parameters: args.headerParams.map<TemplateParam>((t) => ({
        type: "text",
        text: t,
      })),
    });
  }

  if (args.bodyParams && args.bodyParams.length > 0) {
    components.push({
      type: "body",
      parameters: args.bodyParams.map<TemplateParam>((t) => ({
        type: "text",
        text: t,
      })),
    });
  }

  if (args.buttonParams) {
    for (const b of args.buttonParams) {
      components.push({
        type: "button",
        sub_type: b.subType,
        index: String(b.index),
        parameters: [{ type: "text", text: b.param }],
      });
    }
  }

  const payload = {
    messaging_product: "whatsapp",
    to: normalizePhone(args.to),
    type: "template",
    template: {
      name: args.template,
      language: { code: args.language || "pt_BR" },
      components,
    },
  };

  try {
    const url = `https://graph.facebook.com/${META_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: text, status: res.status };
    }
    const data = JSON.parse(text);
    const messageId = data?.messages?.[0]?.id;
    return { ok: true, messageId, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro WhatsApp";
    return { ok: false, error: message };
  }
}

export function isWhatsAppConfigured(): boolean {
  return !!(PHONE_NUMBER_ID && ACCESS_TOKEN);
}
