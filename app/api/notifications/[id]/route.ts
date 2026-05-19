import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Notification } from "@/lib/models/notification";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/notifications/[id]
 * Retorna uma notificação específica. Caller só pode ver as próprias
 * (filtro implícito via destinatarioId = auth.userId).
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    // Filtro inclui arquivado=false pra evitar info leak via ID direto
    // de notificações que o usuário "deletou" (soft delete).
    const notification = await Notification.findOne({
      _id: id,
      destinatarioId: auth.userId,
      arquivado: false,
    }).lean();
    if (!notification) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ notification });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/[id]
 * Arquiva (soft delete via flag arquivado=true). Mantém histórico pra
 * audit/restore.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const updated = await Notification.findOneAndUpdate(
      { _id: id, destinatarioId: auth.userId },
      { $set: { arquivado: true } },
      { new: true }
    ).lean();
    if (!updated) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }
    // Retorna unreadCount atualizado pra UI reconciliar badge
    const unreadCount = await Notification.countDocuments({
      destinatarioId: auth.userId,
      lido: false,
      arquivado: false,
    });
    return NextResponse.json({ ok: true, unreadCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
