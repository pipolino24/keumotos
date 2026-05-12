import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Venda } from "@/lib/models/venda";
import { Moto } from "@/lib/models/moto";
import { Notification } from "@/lib/models/notification";
import { Interesse } from "@/lib/models/interesse";
import { vendaCreateSchema } from "@/lib/schemas";
import { requireAuth, requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET: vendedores veem só as próprias vendas; admin vê todas.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const vendedorIdParam = searchParams.get("vendedorId");
    const status = searchParams.get("status");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const query: Record<string, unknown> = {};
    // admin: filtra por quem quiser; staff: só as próprias; cliente: as suas compras
    if (auth.role === "admin") {
      if (vendedorIdParam) query.vendedorId = vendedorIdParam;
      const clienteIdParam = searchParams.get("clienteId");
      if (clienteIdParam) query.clienteId = clienteIdParam;
    } else if (auth.role === "vendedor" || auth.role === "afiliado") {
      query.vendedorId = auth.userId;
    } else if (auth.role === "cliente") {
      query.clienteId = auth.userId;
    } else {
      return NextResponse.json({ vendas: [] });
    }
    if (status) query.status = status;
    if (dataInicio || dataFim) {
      const range: Record<string, Date> = {};
      if (dataInicio) range.$gte = new Date(dataInicio);
      if (dataFim) range.$lte = new Date(dataFim);
      query.data = range;
    }

    const vendas = await Venda.find(query)
      .sort({ data: -1 })
      .limit(500)
      .lean()
      .maxTimeMS(15_000);
    return NextResponse.json({ vendas });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const raw = await req.json();
    const parsed = vendaCreateSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validação: ${issues}` },
        { status: 400 }
      );
    }

    // Vendedor só pode registrar venda em nome próprio.
    // Admin pode atribuir a qualquer vendedor.
    if (auth.role !== "admin") {
      parsed.data.vendedorId = auth.userId;
    }

    // Lock atômico da moto: tenta marcar como "vendida" condicionalmente.
    // Resolve race condition entre dois POSTs simultâneos pra mesma moto.
    const motoIdStr = String(parsed.data.motoId);
    if (!mongoose.Types.ObjectId.isValid(motoIdStr)) {
      return NextResponse.json({ error: "motoId inválido" }, { status: 400 });
    }
    const lock = await Moto.findOneAndUpdate(
      { _id: motoIdStr, status: { $in: ["disponivel", "reservada"] } },
      { $set: { status: "vendida" } },
      { new: false }
    )
      .select("status")
      .lean();
    if (!lock) {
      const existe = await Moto.exists({ _id: motoIdStr });
      if (!existe) {
        return NextResponse.json(
          { error: "Moto não encontrada" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Moto não está disponível para venda" },
        { status: 409 }
      );
    }

    let venda;
    try {
      venda = await Venda.create(parsed.data);
    } catch (createErr) {
      // Reverte lock se criação falhou
      await Moto.updateOne(
        { _id: motoIdStr, status: "vendida" },
        { $set: { status: "disponivel" } }
      ).catch(() => {});
      throw createErr;
    }

    // Notifica o cliente (se identificado) que a compra foi registrada.
    // Falha silenciosa pra não derrubar a criação.
    if (venda.clienteId) {
      Notification.create({
        destinatarioId: venda.clienteId,
        tipo: "venda",
        titulo: `Sua compra foi registrada — ${venda.motoMarca ?? ""} ${venda.motoModelo}`.trim(),
        descricao: `Vendedor ${venda.vendedorNome ?? ""} concluiu o registro. Em breve você terá acesso aos próximos passos.`,
        origemTipo: "venda",
        origemId: venda._id.toString(),
        link: "/dashboard",
        prioridade: "alta",
        lido: false,
        arquivado: false,
      }).catch(() => {});

      // Auto-converte Interesses pendentes do cliente nessa moto → "convertido".
      // Limpa hot leads que viraram venda concreta. Não bloqueia o response.
      Interesse.updateMany(
        {
          clienteId: venda.clienteId,
          motoId: venda.motoId,
          resultado: { $ne: "convertido" },
        },
        {
          $set: {
            resultado: "convertido",
            vendedorAtendeu: parsed.data.vendedorId,
            atendidoEm: new Date(),
          },
        }
      ).catch(() => {});
    }

    return NextResponse.json({ venda }, { status: 201 });
  } catch (err) {
    // Erros não-validation são internos (DB, network, etc.) → 500.
    // Validation já foi tratada acima com 400 explícito.
    const message =
      err instanceof Error ? err.message : "Erro ao registrar venda";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
