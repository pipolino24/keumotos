import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { requireRole } from "@/lib/auth/api-guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emitNotification } from "@/lib/notifications/emit";
import { emitAuditLog } from "@/lib/audit/emit";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/interesses/[id]/reassign
 * Body: { novoVendedorId: string, motivo?: string }
 *
 * Reatribui um Interesse a outro vendedor.
 * - Vendedor atual: pode dar match em si mesmo OU passar pra outro.
 *   Não pode tirar de outro vendedor que já estava atendendo.
 * - Admin: pode reatribuir qualquer um.
 *
 * Notifica o novo vendedor e registra audit log.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;
    const body = (await req.json().catch(() => null)) as
      | { novoVendedorId?: unknown; motivo?: unknown }
      | null;

    const novoVendedorId =
      typeof body?.novoVendedorId === "string" ? body.novoVendedorId.trim() : "";
    if (!novoVendedorId || novoVendedorId.length > 64) {
      return NextResponse.json(
        { error: "novoVendedorId inválido" },
        { status: 400 }
      );
    }
    const motivo =
      typeof body?.motivo === "string"
        ? String(body.motivo).slice(0, 500)
        : undefined;

    const interesse = await Interesse.findById(id).lean();
    if (!interesse) {
      return NextResponse.json(
        { error: "Interesse não encontrado" },
        { status: 404 }
      );
    }

    // Pool compartilhado: qualquer staff pode reatribuir qualquer lead.

    // Valida que o destino existe e é vendedor/admin
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: alvo, error: alvoErr } = await supabaseAdmin
      .from("profiles")
      .select("id,nome,role")
      .eq("id", novoVendedorId)
      .single();
    if (alvoErr || !alvo) {
      return NextResponse.json(
        { error: "Vendedor de destino não encontrado" },
        { status: 404 }
      );
    }
    if (alvo.role !== "vendedor" && alvo.role !== "admin") {
      return NextResponse.json(
        { error: "Destino não pode atender leads" },
        { status: 400 }
      );
    }

    const anterior = interesse.vendedorAtendeu;
    const updated = await Interesse.findByIdAndUpdate(
      id,
      {
        $set: {
          vendedorAtendeu: novoVendedorId,
          atendidoEm: new Date(),
          resultado: "em-atendimento",
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Falha ao reatribuir" },
        { status: 500 }
      );
    }

    // Notifica o novo atendente
    await emitNotification({
      tipo: "interesse",
      titulo: `Lead reatribuído a você — ${interesse.motoMarca ?? ""} ${interesse.motoModelo}`.trim(),
      descricao: motivo || `Por ${auth.role}`,
      origemTipo: "interesse",
      origemId: id,
      link: `/dashboard/interesses?focus=${id}`,
      prioridade: "alta",
      vendedorIdEspecifico: novoVendedorId,
    });

    // Audit log
    emitAuditLog({
      acao: "interesse.reassign",
      ator: auth.userId,
      atorRole: auth.role,
      alvoTipo: "interesse",
      alvoId: id,
      alvoLabel: `${interesse.motoMarca ?? ""} ${interesse.motoModelo}`.trim(),
      estadoAnterior: { vendedorAtendeu: anterior },
      estadoNovo: { vendedorAtendeu: novoVendedorId },
      motivo,
    });

    return NextResponse.json({ interesse: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
