import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Notification } from "@/lib/models/notification";
import { requireAdminOrCron } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * POST /api/alugueis/check-overdue
 *
 * Detecta aluguéis cuja dataFim já passou e ainda estão "ativo".
 * Marca como "atrasado" e emite notificação ao cliente + vendedor responsável.
 *
 * Idempotente: pode ser chamado várias vezes — só atualiza o que ainda está
 * "ativo". As notificações são criadas a partir do que estava ativo (não
 * gera duplicado pra quem já foi flagado).
 *
 * Pra rodar como cron: configure schedule no Vercel apontando pra esse
 * endpoint com requireAdmin (cron secret).
 */
// Vercel Cron dispara via GET. Aceitamos ambos pra permitir que admin
// também rode manualmente via POST do dashboard se quiser.
export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  // Admin-only OU Vercel Cron (header Authorization: Bearer CRON_SECRET).
  // A operação faz updateMany + insertMany e gera notificações em massa.
  const auth = await requireAdminOrCron(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const agora = new Date();

    // Captura quem vai virar atrasado antes do updateMany pra poder notificar
    const candidatos = await Aluguel.find({
      status: "ativo",
      dataFim: { $lt: agora },
    })
      .select("_id clienteId vendedorId motoModelo motoMarca dataFim")
      .lean();

    if (candidatos.length === 0) {
      return NextResponse.json({ ok: true, flagged: 0 });
    }

    await Aluguel.updateMany(
      { _id: { $in: candidatos.map((c) => c._id) } },
      { $set: { status: "atrasado" } }
    );

    // Emite notificações em batch
    const docs: Record<string, unknown>[] = [];
    for (const c of candidatos) {
      const titulo = `⚠️ Devolução atrasada — ${c.motoMarca ?? ""} ${c.motoModelo}`.trim();
      const descricao = `Devolução prevista para ${new Date(c.dataFim).toLocaleDateString("pt-BR")} ainda não foi feita.`;
      if (c.clienteId) {
        docs.push({
          destinatarioId: c.clienteId,
          tipo: "devolucao_atrasada",
          titulo,
          descricao,
          origemTipo: "aluguel",
          origemId: c._id.toString(),
          link: "/dashboard",
          prioridade: "urgente",
          lido: false,
          arquivado: false,
        });
      }
      if (c.vendedorId) {
        docs.push({
          destinatarioId: c.vendedorId,
          destinatarioRole: "vendedor",
          tipo: "devolucao_atrasada",
          titulo,
          descricao,
          origemTipo: "aluguel",
          origemId: c._id.toString(),
          link: `/dashboard/aluguel/${c._id}`,
          prioridade: "urgente",
          lido: false,
          arquivado: false,
        });
      }
    }

    if (docs.length > 0) {
      await Notification.insertMany(docs, { ordered: false }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      flagged: candidatos.length,
      notificationsCreated: docs.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
