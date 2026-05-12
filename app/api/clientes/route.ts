import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { Venda } from "@/lib/models/venda";
import { Aluguel } from "@/lib/models/aluguel";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/clientes
 * Lista de clientes ativos do ponto de vista do staff:
 *  - quem tem qualquer Interesse, Venda ou Aluguel registrado
 *  - agrega contadores e a última atividade
 *
 * Vendedor só vê clientes que ele atendeu (vendedorId match em venda/aluguel).
 * Admin vê todos.
 */
export async function GET() {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();

    // Filtro de scope: vendedor só vê os próprios; admin vê tudo
    const vendaScope =
      auth.role === "vendedor" ? { vendedorId: auth.userId } : {};
    const alugScope =
      auth.role === "vendedor" ? { vendedorId: auth.userId } : {};
    const interesseScope =
      auth.role === "vendedor" ? { vendedorAtendeu: auth.userId } : {};

    // $limit por pipeline pra evitar full scan quando collections crescerem.
    // 5000 docs por aggregation é o suficiente pra dashboard razoável.
    const PIPELINE_LIMIT = 5000;
    // allSettled: se uma aggregation falhar (timeout, índice), as outras
    // continuam e a lista é entregue parcial em vez de cair toda.
    const settled = await Promise.allSettled([
      Interesse.aggregate([
        {
          $match: {
            ...interesseScope,
            $or: [
              { clienteId: { $exists: true, $ne: null } },
              { clienteNome: { $exists: true, $ne: null } },
            ],
          },
        },
        { $limit: PIPELINE_LIMIT },
        {
          $group: {
            _id: {
              clienteId: "$clienteId",
              clienteNome: "$clienteNome",
            },
            telefone: { $last: "$clienteTelefone" },
            email: { $last: "$clienteEmail" },
            interesses: { $sum: 1 },
            ultimoAt: { $max: "$createdAt" },
          },
        },
      ]).option({ maxTimeMS: 5000 }),
      Venda.aggregate([
        { $match: vendaScope },
        { $limit: PIPELINE_LIMIT },
        {
          $group: {
            _id: { clienteId: "$clienteId", clienteNome: "$clienteNome" },
            telefone: { $last: "$clienteTelefone" },
            email: { $last: "$clienteEmail" },
            vendas: { $sum: 1 },
            totalGasto: { $sum: "$valorVendido" },
            ultimoAt: { $max: "$data" },
          },
        },
      ]).option({ maxTimeMS: 5000 }),
      Aluguel.aggregate([
        { $match: alugScope },
        { $limit: PIPELINE_LIMIT },
        {
          $group: {
            _id: { clienteId: "$clienteId", clienteNome: "$clienteNome" },
            telefone: { $last: "$clienteTelefone" },
            email: { $last: "$clienteEmail" },
            alugueis: { $sum: 1 },
            ultimoAt: { $max: "$dataInicio" },
          },
        },
      ]).option({ maxTimeMS: 5000 }),
    ]);
    const interesses = settled[0].status === "fulfilled" ? settled[0].value : [];
    const vendas = settled[1].status === "fulfilled" ? settled[1].value : [];
    const alugueis = settled[2].status === "fulfilled" ? settled[2].value : [];

    // Unifica por (clienteId || clienteNome) — vendedor vê tudo num só
    const byKey = new Map<
      string,
      {
        clienteId?: string;
        clienteNome?: string;
        telefone?: string;
        email?: string;
        interesses: number;
        vendas: number;
        alugueis: number;
        totalGasto: number;
        ultimoAt?: Date;
      }
    >();

    function pegar(row: {
      _id: { clienteId?: string; clienteNome?: string };
      telefone?: string;
      email?: string;
    }) {
      // Chave preferida: clienteId (UUID Supabase). Sem isso, monta uma
      // composta com nome+telefone OU nome+email pra evitar merge de
      // homônimos diferentes.
      const key = row._id.clienteId
        ? `id:${row._id.clienteId}`
        : row._id.clienteNome
          ? `n:${row._id.clienteNome.toLowerCase()}|${row.telefone ?? ""}|${row.email ?? ""}`
          : "";
      if (!key) return null;
      if (!byKey.has(key)) {
        byKey.set(key, {
          clienteId: row._id.clienteId,
          clienteNome: row._id.clienteNome,
          telefone: row.telefone,
          email: row.email,
          interesses: 0,
          vendas: 0,
          alugueis: 0,
          totalGasto: 0,
        });
      }
      return byKey.get(key)!;
    }

    for (const i of interesses) {
      const c = pegar(i);
      if (!c) continue;
      c.interesses += i.interesses;
      if (!c.ultimoAt || i.ultimoAt > c.ultimoAt) c.ultimoAt = i.ultimoAt;
    }
    for (const v of vendas) {
      const c = pegar(v);
      if (!c) continue;
      c.vendas += v.vendas;
      c.totalGasto += v.totalGasto;
      if (!c.ultimoAt || v.ultimoAt > c.ultimoAt) c.ultimoAt = v.ultimoAt;
    }
    for (const a of alugueis) {
      const c = pegar(a);
      if (!c) continue;
      c.alugueis += a.alugueis;
      if (!c.ultimoAt || a.ultimoAt > c.ultimoAt) c.ultimoAt = a.ultimoAt;
    }

    const clientes = Array.from(byKey.values()).sort(
      (a, b) => (b.ultimoAt?.getTime() ?? 0) - (a.ultimoAt?.getTime() ?? 0)
    );

    return NextResponse.json({ clientes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
