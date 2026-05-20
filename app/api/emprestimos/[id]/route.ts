import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Emprestimo, recalcularStatus } from "@/lib/models/emprestimo";
import { requireRole } from "@/lib/auth/api-guards";
import { emitAuditLog } from "@/lib/audit/emit";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const doc = await Emprestimo.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ emprestimo: doc });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/emprestimos/[id]
 * Atualiza campos pontuais: status (cancelar), observações.
 * Pra mexer em parcelas use /api/emprestimos/[id]/parcelas/[idx].
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const body = await req.json();
    const doc = await Emprestimo.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const before: Record<string, unknown> = {
      status: doc.status,
      observacoes: doc.observacoes,
    };

    if (body.status !== undefined) {
      if (!["ativo", "quitado", "em_atraso", "cancelado"].includes(body.status)) {
        return NextResponse.json({ error: "Status inválido" }, { status: 400 });
      }
      doc.status = body.status;
    }
    if (body.observacoes !== undefined) {
      doc.observacoes = String(body.observacoes).slice(0, 2000);
    }
    // Re-deriva status se não foi mudado explicitamente pra cancelado
    if (doc.status !== "cancelado") {
      doc.status = recalcularStatus(doc);
    }
    await doc.save();

    emitAuditLog({
      acao: "emprestimo.update",
      ator: auth.userId,
      atorNome: auth.email,
      atorRole: "admin",
      alvoTipo: "emprestimo",
      alvoId: id,
      alvoLabel: `${doc.clienteNome}`,
      estadoAnterior: before,
      estadoNovo: { status: doc.status, observacoes: doc.observacoes },
    });

    return NextResponse.json({ emprestimo: doc.toObject() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const doc = await Emprestimo.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    // Soft-cancel em vez de delete pra preservar histórico financeiro.
    // Pra hard delete, use Mongo shell.
    doc.status = "cancelado";
    await doc.save();
    emitAuditLog({
      acao: "emprestimo.cancel",
      ator: auth.userId,
      atorNome: auth.email,
      atorRole: "admin",
      alvoTipo: "emprestimo",
      alvoId: id,
      alvoLabel: doc.clienteNome,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
