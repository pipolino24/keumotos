import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { AuditLog } from "@/lib/models/audit-log";
import { requireAdmin } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit-log/export
 *
 * Baixa CSV de todos os eventos no range escolhido — admin only.
 * Filtros aceitos iguais à rota de listagem: ?dias, ?alvoTipo, ?acao
 *
 * Cap em 50k linhas pra evitar OOM na função serverless. Caso passe disso,
 * frontend recebe header X-Truncated e pode warnar o admin.
 */
const HEADERS = [
  "data",
  "hora",
  "acao",
  "categoria",
  "ator_nome",
  "ator_id",
  "ator_role",
  "alvo_tipo",
  "alvo_id",
  "alvo_label",
  "ip",
  "estado_anterior",
  "estado_novo",
  "motivo",
];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);

    const query: Record<string, unknown> = {};
    const acao = searchParams.get("acao");
    if (acao && acao.length < 64) query.acao = acao;
    const alvoTipo = searchParams.get("alvoTipo");
    if (alvoTipo && alvoTipo.length < 32) query.alvoTipo = alvoTipo;
    const diasRaw = Number(searchParams.get("dias"));
    const dias =
      Number.isFinite(diasRaw) && diasRaw > 0 && diasRaw <= 365 ? diasRaw : 30;
    query.createdAt = {
      $gte: new Date(Date.now() - dias * 24 * 60 * 60 * 1000),
    };

    const CAP = 50000;
    const events = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(CAP + 1) // +1 pra saber se truncou
      .lean();
    const truncated = events.length > CAP;
    const usados = truncated ? events.slice(0, CAP) : events;

    const linhas = [HEADERS.join(",")];
    for (const ev of usados) {
      const d = new Date(ev.createdAt);
      const cat = categoriaFromAcao(ev.acao);
      linhas.push(
        [
          d.toLocaleDateString("pt-BR"),
          d.toLocaleTimeString("pt-BR"),
          ev.acao,
          cat,
          ev.atorNome ?? "",
          ev.ator,
          ev.atorRole ?? "",
          ev.alvoTipo,
          ev.alvoId,
          ev.alvoLabel ?? "",
          ev.ip ?? "",
          // JSON inline em coluna CSV (com aspas dobradas)
          ev.estadoAnterior ? JSON.stringify(ev.estadoAnterior) : "",
          ev.estadoNovo ? JSON.stringify(ev.estadoNovo) : "",
          ev.motivo ?? "",
        ]
          .map(csvEscape)
          .join(",")
      );
    }

    const csv = "﻿" + linhas.join("\n"); // BOM pra Excel abrir UTF-8 certo
    const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...(truncated ? { "X-Truncated": "true" } : {}),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function categoriaFromAcao(acao: string): string {
  if (acao.endsWith(".pagar") || acao.endsWith(".estornar")) return "pagamento";
  if (
    acao.endsWith(".delete") ||
    acao.endsWith(".cancel") ||
    acao.endsWith(".cancelar")
  )
    return "exclusao";
  if (acao.endsWith(".create")) return "cadastro";
  if (
    acao.startsWith("login.") ||
    acao.startsWith("page.") ||
    acao.startsWith("form.")
  )
    return "acesso";
  return "atualizacao";
}
