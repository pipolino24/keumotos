import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { AuditLog } from "@/lib/models/audit-log";
import { requireAdmin } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit-log
 *
 * Lista os últimos eventos de auditoria — só admin.
 * Filtros: ?acao, ?alvoTipo, ?alvoId, ?ator, ?dias (default 30), ?limit
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);

    const query: Record<string, unknown> = {};

    const acao = searchParams.get("acao");
    if (acao && typeof acao === "string" && acao.length < 64) {
      query.acao = acao;
    }
    const alvoTipo = searchParams.get("alvoTipo");
    const ALVO_TIPOS_VALIDOS = [
      "user", "moto", "aluguel", "venda", "role", "contato",
      "afiliado", "interesse", "emprestimo", "contrato",
      "cliente", "proprietario", "page", "form", "sistema",
    ];
    if (alvoTipo && ALVO_TIPOS_VALIDOS.includes(alvoTipo)) {
      query.alvoTipo = alvoTipo;
    }
    const alvoId = searchParams.get("alvoId");
    if (alvoId && typeof alvoId === "string" && alvoId.length < 100) {
      query.alvoId = alvoId;
    }
    const ator = searchParams.get("ator");
    if (ator && typeof ator === "string" && ator.length < 100) {
      query.ator = ator;
    }

    const diasRaw = Number(searchParams.get("dias"));
    const dias =
      Number.isFinite(diasRaw) && diasRaw > 0 && diasRaw <= 365
        ? diasRaw
        : 30;
    query.createdAt = {
      $gte: new Date(Date.now() - dias * 24 * 60 * 60 * 1000),
    };

    const limitRaw = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), 200)
        : 50;

    const events = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ events, total: events.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
