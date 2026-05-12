import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Notification } from "@/lib/models/notification";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications
 * Bloqueado externamente. Notificações são criadas só por emit interno
 * (lib/notifications/emit.ts) ou direto via Notification.create() em
 * handlers de eventos (venda, aluguel, etc). Sem esse 405 explícito, um
 * atacante poderia spammar bell de qualquer usuário via POST.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Operação não permitida — notificações são geradas pelo sistema" },
    { status: 405 }
  );
}

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

    // Valida limit: positivo e finito, máx 100
    const limitRaw = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), 100)
        : 30;
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
      if (!Array.isArray(ids) || !ids.length || ids.length > 200) {
        return NextResponse.json({ error: "ids inválidos" }, { status: 400 });
      }
      // Defesa em profundidade: garante que cada ID pertence ao caller.
      // O filter abaixo já restringe via destinatarioId, mas validamos
      // aqui pra retornar 403 explícito em vez de "0 modificados".
      const safeIds = ids.filter(
        (id) => typeof id === "string" && id.length > 0 && id.length < 100
      );
      if (safeIds.length !== ids.length) {
        return NextResponse.json(
          { error: "ids contêm valores inválidos" },
          { status: 400 }
        );
      }
      filter = { ...filter, _id: { $in: safeIds } };
    }

    const update =
      acao === "arquivar"
        ? { arquivado: true }
        : { lido: true, lidoEm: new Date() };

    const res = await Notification.updateMany(filter, update);

    // Retorna o novo unreadCount pra UI atualizar o badge sem refetch
    const unreadCount = await Notification.countDocuments({
      destinatarioId: auth.userId,
      lido: false,
      arquivado: false,
    });

    return NextResponse.json({
      ok: true,
      modified: res.modifiedCount,
      unreadCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
