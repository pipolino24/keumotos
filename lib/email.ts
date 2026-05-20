/**
 * Wrapper minimal pra envio de emails transacionais via Resend.
 *
 * Variáveis de ambiente requeridas:
 *   RESEND_API_KEY      — chave da Resend (https://resend.com/api-keys)
 *   RESEND_FROM         — remetente verificado (ex: "KEU Motos <no-reply@keumotos.com>")
 *
 * Custo (2026): 3.000 emails/mês grátis, depois US$ 20/mês até 50k,
 * US$ 0,90 por 1k além do plano.
 *
 * Uso típico:
 *   await sendEmail({
 *     to: "cliente@email.com",
 *     subject: "Sua moto está pronta pra retirada",
 *     html: "<h1>KEU Motos</h1>...",
 *     text: "KEU Motos: sua moto está pronta...",
 *   });
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM =
  process.env.RESEND_FROM || "KEU Motos <no-reply@keumotos.com>";

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  // CC/BCC ficam pra V2 se precisar
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    return {
      ok: false,
      error:
        "Email não configurado: defina RESEND_API_KEY no servidor pra habilitar envio.",
    };
  }
  if (!args.html && !args.text) {
    return { ok: false, error: "É preciso pelo menos html ou text" };
  }

  const payload: Record<string, unknown> = {
    from: args.from || RESEND_FROM,
    to: Array.isArray(args.to) ? args.to : [args.to],
    subject: args.subject,
  };
  if (args.html) payload.html = args.html;
  if (args.text) payload.text = args.text;
  if (args.replyTo) payload.reply_to = args.replyTo;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro Resend";
    return { ok: false, error: message };
  }
}
