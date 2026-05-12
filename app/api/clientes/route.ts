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
 * Restrito a admin/vendedor.
 */
export async function GET() {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();

    const [interesses, vendas, alugueis] = await Promise.all([
      Interesse.aggregate([
        {
          $match: {
            $or: [
              { clienteId: { $exists: true, $ne: null } },
              { clienteNome: { $exists: true, $ne: null } },
            ],
          },
        },
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
      ]),
      Venda.aggregate([
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
      ]),
      Aluguel.aggregate([
        {
          $group: {
            _id: { clienteId: "$clienteId", clienteNome: "$clienteNome" },
            telefone: { $last: "$clienteTelefone" },
            email: { $last: "$clienteEmail" },
            alugueis: { $sum: 1 },
            ultimoAt: { $max: "$dataInicio" },
          },
        },
      ]),
    ]);

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
      const key =
        row._id.clienteId ||
        (row._id.clienteNome ? `nome:${row._id.clienteNome}` : "");
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
