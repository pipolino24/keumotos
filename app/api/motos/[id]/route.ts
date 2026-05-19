import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";
import { requireRole, requireAuth } from "@/lib/auth/api-guards";
import { emitAuditLog } from "@/lib/audit/emit";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET é público mas filtra dados internos (preço de custo, repasse) pra
// non-staff. Catálogo é visível, mas margem da KEU não vaza.
const PRIVATE_FIELDS = [
  "valorCompra",
  "valorMinimo",
  "comissao",
  "compra",
  "repasse",
  // vendedorResponsavel é interno (ID do staff). Público vê só dados públicos
  // do vendedor via endpoint dedicado (/api/motos/[id]/vendedor).
  "vendedorResponsavel",
] as const;

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const moto = await Moto.findById(id).lean<Record<string, unknown> | null>();
    if (!moto) {
      return NextResponse.json({ error: "Moto não encontrada" }, { status: 404 });
    }
    const auth = await requireAuth(req);
    const isStaff =
      auth.ok && (auth.role === "admin" || auth.role === "vendedor");
    if (!isStaff) {
      for (const f of PRIVATE_FIELDS) delete moto[f];
    }
    return NextResponse.json({ moto });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Campos que vendedor/admin podem editar via PATCH. Tudo que não estiver
// aqui (origem, compra, proprietarioId, createdAt, etc.) precisa de
// endpoint dedicado pra evitar tampering.
const CAMPOS_EDITAVEIS = [
  "marca",
  "modelo",
  "versao",
  "anoFabricacao",
  "anoModelo",
  "cor",
  "placa",
  "chassi",
  "renavam",
  "numeroMotor",
  "cilindrada",
  "combustivel",
  "cambio",
  "partida",
  "km",
  "potencia",
  "valorFipe",
  "valorAnunciado",
  "valorMinimo",
  "comissao",
  "valorDiaria",
  "valorSemanal",
  "valorMensal",
  "caucao",
  "tipo",
  "status",
  "destaque",
  "fotos",
  "descricao",
  "observacoes",
  "vendedorResponsavel",
  "setor",
] as const;

// Campos que SÓ admin pode editar (preço de compra, comissão repasse)
const CAMPOS_ADMIN = ["valorCompra"] as const;

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const data = await req.json();

    const update: Record<string, unknown> = {};
    for (const k of CAMPOS_EDITAVEIS) {
      if (data[k] !== undefined) update[k] = data[k];
    }
    if (auth.role === "admin") {
      for (const k of CAMPOS_ADMIN) {
        if (data[k] !== undefined) update[k] = data[k];
      }
    }

    const moto = await Moto.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!moto) {
      return NextResponse.json({ error: "Moto não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ moto });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(["admin"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Bloqueia delete se a moto tem aluguel ativo ou venda concluída.
    // Imports tardios pra não criar ciclo no top-level.
    const [{ Aluguel }, { Venda }] = await Promise.all([
      import("@/lib/models/aluguel"),
      import("@/lib/models/venda"),
    ]);
    const [temAluguel, temVenda] = await Promise.all([
      Aluguel.exists({
        motoId: id,
        status: { $in: ["ativo", "atrasado"] },
      }),
      Venda.exists({ motoId: id, status: "concluida" }),
    ]);
    if (temAluguel) {
      return NextResponse.json(
        { error: "Moto tem aluguel ativo — encerre antes de deletar" },
        { status: 409 }
      );
    }
    if (temVenda) {
      return NextResponse.json(
        { error: "Moto tem venda concluída registrada — não pode ser deletada" },
        { status: 409 }
      );
    }

    const moto = await Moto.findByIdAndDelete(id).lean();
    if (!moto) {
      return NextResponse.json({ error: "Moto não encontrada" }, { status: 404 });
    }
    // Audit trail — admin removeu moto do catálogo
    emitAuditLog({
      acao: "moto.delete",
      ator: auth.userId,
      atorRole: "admin",
      alvoTipo: "moto",
      alvoId: id,
      alvoLabel: `${moto.marca ?? ""} ${moto.modelo}`.trim() || id,
      estadoAnterior: {
        status: moto.status,
        valorAnunciado: moto.valorAnunciado,
        proprietarioId: moto.proprietarioId,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao deletar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

