import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Notification } from "@/lib/models/notification";
import { requireAuth } from "@/lib/auth/api-guards";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/alugueis/[id]/solicitar-devolucao
 *
 * Cliente avisa o vendedor que vai devolver a moto. Não conclui o aluguel —
 * apenas adiciona uma observação ao registro e cria uma Notification de
 * prioridade alta pro vendedor responsável.
 *
 * Body: { dataPretendida?: string, observacao?: string }
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.role !== "cliente") {
    return NextResponse.json(
      { error: "Apenas cliente pode solicitar devolução" },
      { status: 403 }
    );
  }
  try {
    await connectMongo();
    const { id } = await params;

    // Rate limit: 3 solicitações por hora por usuário por aluguel
    const rl = rateLimit({
      key: `solicitar-devolucao:${auth.userId}:${id}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Você já solicitou recentemente. Aguarde a resposta do vendedor." },
        { status: 429 }
      );
    }

    const data = await req.json().catch(() => ({}));

    const aluguel = await Aluguel.findById(id);
    if (!aluguel) {
      return NextResponse.json(
        { error: "Aluguel não encontrado" },
        { status: 404 }
      );
    }
    if (aluguel.clienteId !== auth.userId) {
      return NextResponse.json(
        { error: "Esse aluguel não é seu" },
        { status: 403 }
      );
    }
    if (aluguel.status !== "ativo" && aluguel.status !== "atrasado") {
      return NextResponse.json(
        { error: `Aluguel em status "${aluguel.status}" não aceita solicitação` },
        { status: 409 }
      );
    }

    // Valida dataPretendida: precisa ser data válida e estar entre hoje e
    // +1 ano (evita texto "Invalid Date" ou datas absurdas na notif).
    let dataStr = "em breve";
    if (data.dataPretendida) {
      const d = new Date(data.dataPretendida);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "dataPretendida inválida" },
          { status: 400 }
        );
      }
      const agoraMs = Date.now();
      const umAnoFrente = agoraMs + 365 * 24 * 60 * 60 * 1000;
      if (d.getTime() < agoraMs - 24 * 60 * 60 * 1000 || d.getTime() > umAnoFrente) {
        return NextResponse.json(
          { error: "dataPretendida fora do intervalo permitido" },
          { status: 400 }
        );
      }
      dataStr = d.toLocaleDateString("pt-BR");
    }
    const obs = typeof data.observacao === "string"
      ? String(data.observacao).slice(0, 1000)
      : undefined;

    // Append à observação existente (não sobrescreve histórico)
    const linha = `[${new Date().toLocaleString("pt-BR")}] Cliente solicitou devolução para ${dataStr}.${obs ? " Obs: " + obs : ""}`;
    aluguel.observacoes = aluguel.observacoes
      ? `${aluguel.observacoes}\n${linha}`
      : linha;
    await aluguel.save();

    // Notifica vendedor responsável (e admins via fanout do destinatarioRole)
    if (aluguel.vendedorId) {
      await Notification.create({
        destinatarioId: aluguel.vendedorId,
        destinatarioRole: "vendedor",
        tipo: "aluguel",
        titulo: `${aluguel.clienteNome ?? "Cliente"} quer devolver — ${aluguel.motoMarca ?? ""} ${aluguel.motoModelo}`.trim(),
        descricao: `Data pretendida: ${dataStr}${obs ? `. Obs: ${obs}` : ""}`,
        origemTipo: "aluguel",
        origemId: aluguel._id.toString(),
        clienteId: aluguel.clienteId,
        clienteNome: aluguel.clienteNome,
        link: `/dashboard/aluguel/${aluguel._id}`,
        prioridade: "alta",
        lido: false,
        arquivado: false,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
