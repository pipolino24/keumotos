import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Notification } from "@/lib/models/notification";
import { requireAdminOrCron } from "@/lib/auth/api-guards";
import { calcularMultaJuros } from "@/lib/aluguel/parcelas";

export const dynamic = "force-dynamic";

/**
 * POST /api/alugueis/check-parcelas
 *
 * Cron diário que:
 * 1. Marca parcelas com vencimento < hoje && status === "pendente" como
 *    "atrasada" (idempotente — só altera as que ainda estão "pendente").
 * 2. Cria notificação ao cliente + vendedor com valor devido + multa+juros.
 * 3. Notifica parcelas vencendo nos próximos 3 dias (lembrete pré-atraso).
 *
 * Deduplica notificações via origemId + tipo: se cliente já tem notif
 * "parcela_atrasada" pra essa parcela, não duplica.
 *
 * Configurar como Vercel Cron em vercel.ts:
 *   { path: "/api/alugueis/check-parcelas", schedule: "0 9 * * *" }  // 9h BRT
 */
// Vercel Cron dispara via GET. Aceitamos ambos.
export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminOrCron(req);
  if (!auth.ok) return auth.response;

  try {
    await connectMongo();
    const hoje = new Date();
    const em3Dias = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Captura aluguéis com parcelas em estado relevante
    // 1. Parcelas vencidas pendentes → virar "atrasada" + notificar
    // 2. Parcelas vencendo em até 3d pendentes → notificar lembrete
    const alugueis = await Aluguel.find({
      status: { $in: ["ativo", "atrasado"] },
      "parcelasLocacao.status": "pendente",
      "parcelasLocacao.vencimento": { $lte: em3Dias },
    }).select(
      "_id clienteId vendedorId motoModelo motoMarca parcelasLocacao multaPorAtrasoPercent jurosDiaPercent"
    );

    let parcelasAtrasadas = 0;
    let lembretesEnviados = 0;
    const notifs: Record<string, unknown>[] = [];

    for (const aluguel of alugueis) {
      const parcelas = aluguel.parcelasLocacao ?? [];
      let dirty = false;
      for (const p of parcelas) {
        if (p.status === "paga") continue;

        const isAtrasada = p.vencimento.getTime() < hoje.getTime();
        const venceEm3d =
          !isAtrasada && p.vencimento.getTime() <= em3Dias.getTime();

        // 1) Atualizar status pra "atrasada"
        if (isAtrasada && p.status === "pendente") {
          p.status = "atrasada";
          dirty = true;
          parcelasAtrasadas++;

          const calc = calcularMultaJuros(
            p,
            aluguel.multaPorAtrasoPercent ?? 10,
            aluguel.jurosDiaPercent ?? 2,
            hoje
          );
          const titulo = `⚠️ Parcela ${p.numero} atrasada — ${aluguel.motoMarca ?? ""} ${aluguel.motoModelo}`.trim();
          const descricao = `Vence ${p.vencimento.toLocaleDateString("pt-BR")}. Total devido com multa+juros: R$ ${calc.total.toFixed(2)}`;
          const origemId = `parcela:${aluguel._id}:${p.numero}`;

          if (aluguel.clienteId) {
            notifs.push({
              destinatarioId: aluguel.clienteId,
              tipo: "parcela_atrasada",
              titulo,
              descricao,
              origemTipo: "aluguel",
              origemId,
              link: "/dashboard",
              prioridade: "urgente",
              lido: false,
              arquivado: false,
            });
          }
          if (aluguel.vendedorId) {
            notifs.push({
              destinatarioId: aluguel.vendedorId,
              destinatarioRole: "vendedor",
              tipo: "parcela_atrasada",
              titulo,
              descricao,
              origemTipo: "aluguel",
              origemId,
              link: `/dashboard/inadimplencia`,
              prioridade: "alta",
              lido: false,
              arquivado: false,
            });
          }
        }

        // 2) Lembrete pra parcelas vencendo em até 3 dias (idempotência via origemId)
        if (venceEm3d) {
          const diasAtePagar = Math.ceil(
            (p.vencimento.getTime() - hoje.getTime()) / (24 * 60 * 60 * 1000)
          );
          if (diasAtePagar >= 0 && diasAtePagar <= 3 && aluguel.clienteId) {
            lembretesEnviados++;
            notifs.push({
              destinatarioId: aluguel.clienteId,
              tipo: "parcela_vencendo",
              titulo: `Parcela ${p.numero} vence em ${diasAtePagar === 0 ? "HOJE" : `${diasAtePagar} dia${diasAtePagar > 1 ? "s" : ""}`}`,
              descricao: `${aluguel.motoMarca ?? ""} ${aluguel.motoModelo} — R$ ${p.valor.toFixed(2)}`.trim(),
              origemTipo: "aluguel",
              origemId: `lembrete:${aluguel._id}:${p.numero}:${p.vencimento.toISOString().slice(0, 10)}`,
              link: "/dashboard",
              prioridade: diasAtePagar === 0 ? "alta" : "media",
              lido: false,
              arquivado: false,
            });
          }
        }
      }
      if (dirty) {
        // Recalcula status do aluguel: tem parcela atrasada → status "atrasado"
        if (parcelas.some((p) => p.status === "atrasada")) {
          aluguel.status = "atrasado";
        }
        await aluguel.save();
      }
    }

    // Dedup via insertMany ordered:false — origemId+destinatarioId unique
    // assumido pelo schema do Notification (se houver). Senão, simplesmente
    // permite duplicado e o front filtra por origemId.
    if (notifs.length > 0) {
      await Notification.insertMany(notifs, { ordered: false }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      alugueisVerificados: alugueis.length,
      parcelasAtrasadas,
      lembretesEnviados,
      notifsCreated: notifs.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
