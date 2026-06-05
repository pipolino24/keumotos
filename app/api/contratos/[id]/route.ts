import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Contrato } from "@/lib/models/contrato";
import { requireAuth, requireRole } from "@/lib/auth/api-guards";
import { emitAuditLog } from "@/lib/audit/emit";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const contrato = await Contrato.findById(id).lean();
    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }
    // Cliente só vê próprios contratos
    if (auth.role === "cliente" && String(contrato.clienteId) !== String(auth.userId)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    return NextResponse.json({ contrato });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/contratos/[id]  — admin/vendedor pode mudar status (ativo →
 * rescindido / concluido / assinado). Não permite editar snapshots — pra
 * isso, criar um contrato novo.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const body = await req.json();
    const statusValidos = [
      "rascunho",
      "ativo",
      "assinado",
      "rescindido",
      "concluido",
    ];
    if (body.status && !statusValidos.includes(body.status)) {
      return NextResponse.json({ error: "status inválido" }, { status: 400 });
    }
    const update: Record<string, unknown> = {};
    if (body.status) update.status = body.status;
    if (body.observacoes !== undefined) update.observacoes = body.observacoes;
    // Pega o snapshot antes pra registrar no audit log o estado anterior
    // — antes essa rota não auditava nada, ficava impossível rastrear quem
    // rescindiu/concluiu uma locação.
    const anterior = await Contrato.findById(id)
      .select("status observacoes contratante moto")
      .lean();
    const contrato = await Contrato.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }
    if (anterior) {
      const nomeContratante = anterior.contratante?.nome;
      const motoLabel = anterior.moto
        ? `${anterior.moto.marca ?? ""} ${anterior.moto.modelo ?? ""}`.trim()
        : "";
      emitAuditLog({
        acao: "contrato.update",
        ator: auth.userId,
        atorRole: auth.role,
        alvoTipo: "contrato",
        alvoId: id,
        alvoLabel:
          (nomeContratante ? `${nomeContratante} · ` : "") + (motoLabel || id),
        estadoAnterior: {
          status: anterior.status,
          observacoes: anterior.observacoes,
        },
        estadoNovo: update,
      });
    }
    return NextResponse.json({ contrato });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
