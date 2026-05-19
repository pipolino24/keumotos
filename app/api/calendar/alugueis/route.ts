import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";

export const dynamic = "force-dynamic";

/**
 * GET /api/calendar/alugueis?token=<token>&include=ativos,atrasados
 *
 * Feed iCal/ICS dos aluguéis em curso. Cada aluguel vira um evento de dia
 * inteiro na dataFim (devolução prevista). Vendedores e admins assinam o
 * feed no app de calendário do iPhone/Mac/Google e veem todas as devoluções
 * upcoming sem precisar abrir o app KEU.
 *
 * Auth via query token (apps de calendário não enviam Bearer/cookie).
 * Token = HMAC SHA256 do email com CALENDAR_FEED_SECRET. Gerar via UI
 * de perfil e revogar invalidando o secret se vazar.
 *
 * Sem token válido → 401. Sem CALENDAR_FEED_SECRET configurado → 503.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CALENDAR_FEED_SECRET || "";
  if (!secret) {
    return NextResponse.json(
      { error: "Feed de calendário não configurado (CALENDAR_FEED_SECRET)" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const includeRaw = searchParams.get("include") || "ativos,atrasados";
  const includeStatuses = includeRaw.split(",").map((s) => s.trim()).filter(Boolean);

  // Valida token: precisa começar com email base64URL + ":" + sig
  // Formato: <emailB64URL>.<sig>
  const parts = token.split(".");
  if (parts.length !== 2) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  const emailB64 = parts[0];
  const sig = parts[1];
  let email: string;
  try {
    email = Buffer.from(emailB64, "base64url").toString("utf-8");
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(email)
    .digest("hex");
  if (
    sig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  ) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  try {
    await connectMongo();
    // Mapear status iOS-esperados para enum mongo
    const STATUS_MAP: Record<string, string[]> = {
      ativos: ["ativo"],
      atrasados: ["atrasado"],
      concluidos: ["concluido"],
    };
    const mongoStatuses: string[] = [];
    for (const s of includeStatuses) {
      const mapped = STATUS_MAP[s];
      if (mapped) mongoStatuses.push(...mapped);
    }
    if (mongoStatuses.length === 0) mongoStatuses.push("ativo", "atrasado");

    const alugueis = await Aluguel.find({
      status: { $in: mongoStatuses as any },
      dataFim: { $exists: true, $ne: null },
    })
      .sort({ dataFim: 1 })
      .limit(500)
      .lean();

    const ics = buildICS(alugueis, email);
    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "private, max-age=300",
        "X-Calendar-Email": email,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatICSDate(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
    date.getUTCSeconds()
  )}Z`;
}

function formatICSAllDay(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

interface AluguelLike {
  _id: unknown;
  dataFim?: Date;
  motoModelo?: string;
  motoMarca?: string;
  clienteNome?: string;
  status?: string;
  placa?: string;
  valorTotal?: number;
}

function buildICS(alugueis: AluguelLike[], owner: string): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KEU Motos//Aluguéis//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:KEU — Devoluções",
    `X-WR-CALDESC:Devoluções de aluguéis pra ${escapeICS(owner)}`,
    "X-WR-TIMEZONE:America/Fortaleza",
  ];

  for (const a of alugueis) {
    if (!a.dataFim) continue;
    const fim = new Date(a.dataFim);
    const id = String(a._id);
    const modelo = [a.motoMarca, a.motoModelo].filter(Boolean).join(" ");
    const cliente = a.clienteNome ?? "Cliente";
    const titulo = `Devolução · ${modelo || "Moto"} · ${cliente}`;
    const placa = a.placa ? ` (${a.placa})` : "";
    const valor =
      typeof a.valorTotal === "number"
        ? `\\nValor contrato: R$ ${a.valorTotal.toLocaleString("pt-BR")}`
        : "";
    const desc = `Cliente: ${cliente}${placa}\\nStatus: ${a.status ?? "—"}${valor}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:aluguel-${id}@keumotos.com.br`,
      `DTSTAMP:${formatICSDate(now)}`,
      `DTSTART;VALUE=DATE:${formatICSAllDay(fim)}`,
      `SUMMARY:${escapeICS(titulo)}`,
      `DESCRIPTION:${desc}`,
      "TRANSP:TRANSPARENT",
      `URL:https://keumotos.com.br/dashboard/aluguel/${id}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  // ICS standard: CRLF line endings
  return lines.join("\r\n");
}
