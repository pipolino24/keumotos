import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Aluguel } from "@/lib/models/aluguel";
import { Venda } from "@/lib/models/venda";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export type ProximaAcaoTipo =
  | "devolucao-aluguel"
  | "aluguel-vencido"
  | "parcela-pagar"
  | "revisao-recomendada";

interface ProximaAcao {
  id: string;
  tipo: ProximaAcaoTipo;
  titulo: string;
  descricao?: string;
  data: string; // ISO
  diasRestantes: number; // negativo = vencido
  prioridade: "alta" | "normal" | "baixa";
  link?: string;
  valor?: number;
}

/**
 * GET /api/clientes/[id]/proximas-acoes
 *
 * Calcula próximas ações do cliente (devoluções, parcelas, revisões).
 * Só cliente vê próprio; admin/vendedor podem consultar de qualquer um.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;

    if (auth.role === "cliente" && auth.userId !== id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    if (
      auth.role !== "cliente" &&
      auth.role !== "admin" &&
      auth.role !== "vendedor"
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const hoje = new Date();
    const horizonte = new Date(hoje.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 dias

    const [alugueisAtivos, vendasComParcelas] = await Promise.all([
      Aluguel.find({
        clienteId: id,
        status: { $in: ["ativo", "atrasado"] },
      })
        .select("motoModelo motoMarca dataFim status")
        .lean(),
      Venda.find({
        clienteId: id,
        status: "concluida",
        "pagamentos.proximaParcelaEm": { $lte: horizonte },
      })
        .select("motoModelo motoMarca pagamentos")
        .lean(),
    ]);

    const acoes: ProximaAcao[] = [];

    // Devoluções pendentes (aluguel ativo)
    for (const a of alugueisAtivos) {
      if (!a.dataFim) continue;
      const dt = new Date(a.dataFim).getTime();
      const diasRest = Math.ceil((dt - hoje.getTime()) / (24 * 60 * 60 * 1000));
      const venceu = diasRest < 0;
      acoes.push({
        id: `dev-${a._id}`,
        tipo: venceu ? "aluguel-vencido" : "devolucao-aluguel",
        titulo: venceu
          ? `Devolução atrasada — ${a.motoMarca ?? ""} ${a.motoModelo}`.trim()
          : `Devolver moto — ${a.motoMarca ?? ""} ${a.motoModelo}`.trim(),
        descricao: venceu
          ? "Procure a loja para regularizar"
          : "Confirme data e horário com o vendedor",
        data: new Date(a.dataFim).toISOString(),
        diasRestantes: diasRest,
        prioridade: venceu || diasRest <= 2 ? "alta" : "normal",
        link: "/dashboard",
      });
    }

    // Parcelas próximas (vendas com parcelamento loja)
    for (const v of vendasComParcelas) {
      let parcelaIdx = 0;
      for (const p of v.pagamentos || []) {
        parcelaIdx += 1;
        if (!p.proximaParcelaEm) continue;
        const dt = new Date(p.proximaParcelaEm).getTime();
        const diasRest = Math.ceil(
          (dt - hoje.getTime()) / (24 * 60 * 60 * 1000)
        );
        if (diasRest > 60) continue;
        acoes.push({
          id: `parc-${v._id}-${parcelaIdx}`,
          tipo: "parcela-pagar",
          titulo: `Parcela ${p.forma === "parcelado-loja" ? "da loja" : ""}: ${
            v.motoMarca ?? ""
          } ${v.motoModelo}`.trim(),
          descricao: `Próximo vencimento: ${new Date(
            p.proximaParcelaEm
          ).toLocaleDateString("pt-BR")}`,
          data: new Date(p.proximaParcelaEm).toISOString(),
          diasRestantes: diasRest,
          prioridade: diasRest < 0 ? "alta" : diasRest <= 5 ? "alta" : "normal",
          valor: p.valorParcelaLoja || p.valor,
          link: "/dashboard",
        });
      }
    }

    acoes.sort((a, b) => a.diasRestantes - b.diasRestantes);

    return NextResponse.json({ acoes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
