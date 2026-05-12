import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Notification } from "@/lib/models/notification";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Lista notificações do caller. Filtros: ?unread=true, ?prioridade=alta, ?limit=50
 * Sempre retorna `unreadCount` para o badge do bell icon.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);

    const query: Record<string, unknown> = {
      destinatarioId: auth.userId,
      arquivado: false,
    };
    if (searchParams.get("unread") === "true") query.lido = false;
    const prioridade = searchParams.get("prioridade");
    if (prioridade && ["baixa", "normal", "alta", "urgente"].includes(prioridade)) {
      query.prioridade = prioridade;
    }

    const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({
        destinatarioId: auth.userId,
        lido: false,
        arquivado: false,
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Marca lido/arquivado em massa. Body: { ids?: string[], acao: "ler"|"arquivar"|"ler_todas" }
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const data = await req.json();
    const { ids, acao } = data as { ids?: string[]; acao?: string };

    if (!acao || !["ler", "arquivar", "ler_todas"].includes(acao)) {
      return NextResponse.json({ error: "acao inválida" }, { status: 400 });
    }

    let filter: Record<string, unknown> = { destinatarioId: auth.userId };
    if (acao !== "ler_todas") {
      if (!Array.isArray(ids) || !ids.length) {
        return NextResponse.json({ error: "ids vazios" }, { status: 400 });
      }
      filter = { ...filter, _id: { $in: ids } };
    }

    const update =
      acao === "arquivar"
        ? { arquivado: true }
        : { lido: true, lidoEm: new Date() };

    const res = await Notification.updateMany(filter, update);
    return NextResponse.json({ ok: true, modified: res.modifiedCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
