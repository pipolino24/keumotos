import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/calendar/token
 *
 * Retorna a URL do feed iCal pro caller. Apenas staff (admin/vendedor).
 * Gera HMAC do email do usuário com CALENDAR_FEED_SECRET — qualquer um com
 * a URL pode subscribar, mas só o admin/vendedor logado conhece a sua URL.
 *
 * Pra revogar todos os feeds: rotacionar CALENDAR_FEED_SECRET no servidor.
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;

  const secret = process.env.CALENDAR_FEED_SECRET || "";
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Feed de calendário não configurado no servidor (CALENDAR_FEED_SECRET ausente).",
      },
      { status: 503 }
    );
  }

  const emailB64 = Buffer.from(auth.email, "utf-8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(auth.email).digest("hex");
  const token = `${emailB64}.${sig}`;

  // Base URL: NEXT_PUBLIC_APP_URL ou fallback pra localhost
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    new URL(req.url).origin;

  const url = `${baseUrl}/api/calendar/alugueis?token=${encodeURIComponent(token)}`;
  // iOS reconhece webcal:// como assinatura de calendário
  const webcalUrl = url.replace(/^https?:\/\//, "webcal://");

  return NextResponse.json({
    url, // HTTPS direta — útil pra Google Calendar import
    webcalUrl, // iOS/Mac auto-subscribe ao clicar
    email: auth.email,
  });
}
