import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Notification } from "@/lib/models/notification";
import { requireAuth } from "@/lib/auth/api-guards";

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
  const auth = await requireAuth();
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

    const dataStr = data.dataPretendida
      ? new Date(data.dataPretendida).toLocaleDateString("pt-BR")
      : "em breve";
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
