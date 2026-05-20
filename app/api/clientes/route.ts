import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { Venda } from "@/lib/models/venda";
import { Aluguel } from "@/lib/models/aluguel";
import { Emprestimo } from "@/lib/models/emprestimo";
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
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();

    // KEU opera com pool compartilhado: admin e vendedor veem todos os
    // clientes. (Antes filtravamos por vendedorId/vendedorAtendeu — removido.)
    const PIPELINE_LIMIT = 5000;
    const settled = await Promise.allSettled([
      Interesse.aggregate([
        {
          $match: {
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
      // Empréstimos — cliente que pegou empréstimo (mesmo sem nenhuma outra
      // interação) aparece na lista de clientes
      Emprestimo.aggregate([
        { $limit: PIPELINE_LIMIT },
        {
          $group: {
            _id: { clienteId: "$clienteId", clienteNome: "$clienteNome" },
            telefone: { $last: "$clienteTelefone" },
            email: { $last: "$clienteEmail" },
            emprestimos: { $sum: 1 },
            ultimoAt: { $max: "$dataEmprestimo" },
          },
        },
      ]).option({ maxTimeMS: 5000 }),
    ]);
    const interesses = settled[0].status === "fulfilled" ? settled[0].value : [];
    const vendas = settled[1].status === "fulfilled" ? settled[1].value : [];
    const alugueis = settled[2].status === "fulfilled" ? settled[2].value : [];
    const emprestimos = settled[3].status === "fulfilled" ? settled[3].value : [];

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
        emprestimos: number;
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
          emprestimos: 0,
          totalGasto: 0,
        });
      }
      // Atualiza telefone/email se vier preenchido (algumas tabelas têm
      // info melhor — preferimos a mais recente que tenha valor)
      const cur = byKey.get(key)!;
      if (!cur.telefone && row.telefone) cur.telefone = row.telefone;
      if (!cur.email && row.email) cur.email = row.email;
      return cur;
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
    for (const e of emprestimos) {
      const c = pegar(e);
      if (!c) continue;
      c.emprestimos += e.emprestimos;
      if (!c.ultimoAt || e.ultimoAt > c.ultimoAt) c.ultimoAt = e.ultimoAt;
    }

    // Fonte adicional: TODOS os profiles Supabase com role=cliente, mesmo
    // sem nenhuma interação ainda. Decisão de produto (2026-05): cadastro
    // de cliente é ÚNICO — todo form (venda/aluguel/empréstimo) consulta E
    // grava na mesma fonte. Aqui agregamos Interesse+Venda+Aluguel+
    // Empréstimo+Profiles num só lugar.
    try {
      const { createSupabaseAdminClient } = await import(
        "@/lib/supabase/admin"
      );
      const admin = createSupabaseAdminClient();
      const { data: clientesProfiles } = await admin
        .from("profiles")
        .select("id, nome, email, telefone, cpf, created_at")
        .eq("role", "cliente")
        .limit(2000);
      for (const p of clientesProfiles ?? []) {
        if (!p.id) continue;
        const key = `id:${p.id}`;
        if (!byKey.has(key)) {
          byKey.set(key, {
            clienteId: p.id,
            clienteNome: (p.nome as string) ?? undefined,
            telefone: (p.telefone as string) ?? undefined,
            email: (p.email as string) ?? undefined,
            interesses: 0,
            vendas: 0,
            alugueis: 0,
            emprestimos: 0,
            totalGasto: 0,
            ultimoAt: p.created_at ? new Date(p.created_at as string) : undefined,
          });
        } else {
          const cur = byKey.get(key)!;
          if (!cur.clienteNome && p.nome) cur.clienteNome = p.nome as string;
          if (!cur.telefone && p.telefone) cur.telefone = p.telefone as string;
          if (!cur.email && p.email) cur.email = p.email as string;
        }
      }
    } catch {
      // Degrada: lista sem profile-only clients se Supabase falhar
    }

    const clientes = Array.from(byKey.values()).sort(
      (a, b) => (b.ultimoAt?.getTime() ?? 0) - (a.ultimoAt?.getTime() ?? 0)
    );

    // Enrich: clientes com clienteId mas sem nome puxam do profile.
    // (rare path: Interesse/Venda com clienteId mas sem campos denormalizados
    // E sem role=cliente)
    const idsSemDados = clientes
      .filter((c) => c.clienteId && !c.clienteNome)
      .map((c) => c.clienteId!);
    if (idsSemDados.length > 0) {
      try {
        const { createSupabaseAdminClient } = await import(
          "@/lib/supabase/admin"
        );
        const admin = createSupabaseAdminClient();
        const { data: profiles } = await admin
          .from("profiles")
          .select("id, nome, email, telefone")
          .in("id", Array.from(new Set(idsSemDados)));
        const byId = new Map(
          (profiles ?? []).map((p) => [
            p.id as string,
            p as { id: string; nome?: string; email?: string; telefone?: string },
          ])
        );
        for (const c of clientes) {
          if (!c.clienteId) continue;
          const p = byId.get(c.clienteId);
          if (!p) continue;
          if (!c.clienteNome && p.nome) c.clienteNome = p.nome;
          if (!c.email && p.email) c.email = p.email;
          if (!c.telefone && p.telefone) c.telefone = p.telefone;
        }
      } catch {
        // degrada
      }
    }

    // Adiciona aliases `_id` e `nome` pra compatibilidade com forms antigos
    // que esperavam o shape de /api/users (vendas/nova, aluguel/novo).
    const comAliases = clientes.map((c) => ({
      ...c,
      _id: c.clienteId,
      nome: c.clienteNome,
    }));

    return NextResponse.json({ clientes: comAliases });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
