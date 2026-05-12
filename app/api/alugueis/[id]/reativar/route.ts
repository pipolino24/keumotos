import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Moto } from "@/lib/models/moto";
import { Notification } from "@/lib/models/notification";
import { requireAdmin } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/alugueis/[id]/reativar
 *
 * Admin reverte um aluguel cancelado de volta pra ativo. Re-marca moto
 * como "alugada" se a moto ainda está disponível. Append em observações
 * pra rastreabilidade. Notifica cliente.
 */
export async function POST(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;

    const aluguel = await Aluguel.findById(id);
    if (!aluguel) {
      return NextResponse.json(
        { error: "Aluguel não encontrado" },
        { status: 404 }
      );
    }
    if (aluguel.status !== "cancelado") {
      return NextResponse.json(
        {
          error: `Apenas aluguéis cancelados podem ser reativados (atual: ${aluguel.status})`,
        },
        { status: 409 }
      );
    }

    // Tenta reservar a moto novamente (lock atômico)
    const motoLock = await Moto.findOneAndUpdate(
      { _id: aluguel.motoId, status: "disponivel" },
      { $set: { status: "alugada" } },
      { new: true }
    );
    if (!motoLock) {
      return NextResponse.json(
        {
          error:
            "Moto não está mais disponível — não dá pra reativar o aluguel",
        },
        { status: 409 }
      );
    }

    aluguel.status = "ativo";
    const linha = `[${new Date().toLocaleString("pt-BR")}] Aluguel reativado pelo admin.`;
    aluguel.observacoes = aluguel.observacoes
      ? `${aluguel.observacoes}\n${linha}`
      : linha;
    await aluguel.save();

    // Notifica cliente
    if (aluguel.clienteId) {
      Notification.create({
        destinatarioId: aluguel.clienteId,
        tipo: "aluguel",
        titulo: `Aluguel reativado — ${aluguel.motoMarca ?? ""} ${aluguel.motoModelo}`.trim(),
        descricao:
          "Seu aluguel cancelado foi reativado pelo time. Em caso de dúvidas, fale com o vendedor.",
        origemTipo: "aluguel",
        origemId: aluguel._id.toString(),
        link: "/dashboard",
        prioridade: "alta",
        lido: false,
        arquivado: false,
      }).catch(() => {});
    }

    return NextResponse.json({ aluguel });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
