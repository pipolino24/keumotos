import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";
import { Interesse } from "@/lib/models/interesse";
import { Revisao } from "@/lib/models/revisao";
import { Venda } from "@/lib/models/venda";
import { Aluguel } from "@/lib/models/aluguel";
import { AuditLog } from "@/lib/models/audit-log";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

type Evento = {
  id: string;
  tipo:
    | "cadastro"
    | "interesse"
    | "revisao"
    | "venda"
    | "aluguel-inicio"
    | "aluguel-devolucao"
    | "aluguel-atrasado"
    | "audit";
  titulo: string;
  detalhe?: string;
  data: string; // ISO
  ator?: string;
  meta?: Record<string, unknown>;
};

/**
 * GET /api/motos/[id]/historico
 *
 * Linha do tempo agregada de uma moto: cadastro, interesses (leads), revisões,
 * vendas, aluguéis e ações administrativas. Pra a tela HistoricoMotoView.
 *
 * Apenas staff (admin/vendedor) — dados internos da operação.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await connectMongo();
    const motoOid = new mongoose.Types.ObjectId(id);

    const moto = await Moto.findById(motoOid).lean();
    if (!moto) {
      return NextResponse.json({ error: "Moto não encontrada" }, { status: 404 });
    }

    // Limites defensivos: nenhuma moto razoável tem >1000 interesses, mas se
    // tiver, paginamos.
    const [interesses, revisoes, vendas, alugueis, audits] = await Promise.all([
      Interesse.find({ motoId: motoOid })
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      Revisao.find({ motoId: motoOid }).sort({ data: -1 }).limit(100).lean(),
      Venda.find({ motoId: motoOid }).sort({ data: -1 }).limit(20).lean(),
      Aluguel.find({ motoId: motoOid }).sort({ dataInicio: -1 }).limit(50).lean(),
      AuditLog.find({ alvoTipo: "moto", alvoId: id })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const eventos: Evento[] = [];

    // Cadastro
    const motoCreatedAt = (moto as { createdAt?: Date }).createdAt;
    if (motoCreatedAt) {
      eventos.push({
        id: `cad-${id}`,
        tipo: "cadastro",
        titulo: "Moto cadastrada no estoque",
        detalhe: `${(moto as { marca?: string }).marca ?? ""} ${(moto as { modelo?: string }).modelo ?? ""}`.trim(),
        data: new Date(motoCreatedAt).toISOString(),
      });
    }

    // Interesses
    for (const it of interesses) {
      const tipo = (it.tipo as string) ?? "interesse";
      const cliente = (it.clienteNome as string) || "Anônimo";
      const labelTipo =
        tipo === "visualizou"
          ? "Visualizou anúncio"
          : tipo === "favoritou"
          ? "Favoritou"
          : tipo === "simulou_financiamento"
          ? "Simulou financiamento"
          : tipo === "enviou_lead"
          ? "Enviou lead"
          : tipo === "solicitou_aluguel"
          ? "Solicitou aluguel"
          : tipo === "solicitou_compra"
          ? "Solicitou compra"
          : tipo === "agendar_visita"
          ? "Agendou visita"
          : "Interesse";
      eventos.push({
        id: `int-${String((it as { _id: mongoose.Types.ObjectId })._id)}`,
        tipo: "interesse",
        titulo: labelTipo,
        detalhe: cliente,
        data: new Date(it.createdAt as Date).toISOString(),
        meta: { resultado: it.resultado, origem: it.origem },
      });
    }

    // Revisões
    for (const r of revisoes) {
      eventos.push({
        id: `rev-${String((r as { _id: mongoose.Types.ObjectId })._id)}`,
        tipo: "revisao",
        titulo: `Revisão · ${r.tipo ?? "revisao"}`,
        detalhe: (r as { descricao?: string }).descricao ?? "",
        data: new Date(r.data as Date).toISOString(),
        meta: {
          custo: r.custoTotal,
          kmNaRevisao: r.kmNaRevisao,
          responsavel: r.responsavel,
        },
      });
    }

    // Vendas
    for (const v of vendas) {
      const cliente = (v as { clienteNome?: string }).clienteNome ?? "Cliente";
      const valor = (v as { valorVendido?: number }).valorVendido ?? 0;
      eventos.push({
        id: `ven-${String((v as { _id: mongoose.Types.ObjectId })._id)}`,
        tipo: "venda",
        titulo: "Vendida",
        detalhe: `${cliente} · R$ ${valor.toLocaleString("pt-BR")}`,
        data: new Date(v.data as Date).toISOString(),
        meta: { status: v.status, valorVendido: valor },
      });
    }

    // Aluguéis: cada doc gera 1 ou 2 eventos (início + devolução)
    for (const a of alugueis) {
      const cliente = (a as { clienteNome?: string }).clienteNome ?? "Cliente";
      const aluguelId = String((a as { _id: mongoose.Types.ObjectId })._id);
      eventos.push({
        id: `alu-i-${aluguelId}`,
        tipo: "aluguel-inicio",
        titulo: "Aluguel iniciado",
        detalhe: cliente,
        data: new Date(a.dataInicio as Date).toISOString(),
        meta: { status: a.status, valorTotal: a.valorTotal },
      });
      const status = a.status as string;
      if (status === "concluido" || status === "atrasado") {
        const dataFinal = (a as { dataFimReal?: Date }).dataFimReal || a.dataFim;
        if (dataFinal) {
          eventos.push({
            id: `alu-d-${aluguelId}`,
            tipo: status === "atrasado" ? "aluguel-atrasado" : "aluguel-devolucao",
            titulo: status === "atrasado" ? "Devolução atrasada" : "Devolvida",
            detalhe: cliente,
            data: new Date(dataFinal as Date).toISOString(),
          });
        }
      }
    }

    // Audit log
    for (const al of audits) {
      const acao = al.acao as string;
      const titulo =
        acao === "moto.delete"
          ? "Removida do estoque"
          : `Ação: ${acao.replace(/\./g, " ")}`;
      eventos.push({
        id: `aud-${String((al as { _id: mongoose.Types.ObjectId })._id)}`,
        tipo: "audit",
        titulo,
        detalhe: (al as { motivo?: string }).motivo,
        ator: (al as { atorNome?: string }).atorNome,
        data: new Date(al.createdAt as Date).toISOString(),
      });
    }

    eventos.sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    return NextResponse.json({
      motoId: id,
      moto: {
        marca: (moto as { marca?: string }).marca,
        modelo: (moto as { modelo?: string }).modelo,
        anoModelo: (moto as { anoModelo?: number }).anoModelo,
        placa: (moto as { placa?: string }).placa,
      },
      eventos,
      total: eventos.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
