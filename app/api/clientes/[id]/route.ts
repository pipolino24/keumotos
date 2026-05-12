import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { Venda } from "@/lib/models/venda";
import { Aluguel } from "@/lib/models/aluguel";
import { Contato } from "@/lib/models/contato";
import { requireRole } from "@/lib/auth/api-guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clientes/[id]
 * Perfil unificado do cliente: profile Supabase + todas vendas + alugueis +
 * interesses + contatos relacionados.
 *
 * Vendedor só vê cliente se tiver pelo menos uma venda/aluguel registrada
 * por ele com esse cliente (defensa contra browsing arbitrário de PII).
 * Admin sempre acessa.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;

    // Vendedor só vê clientes que atendeu (compra/aluguel/interesse atendido)
    if (auth.role === "vendedor") {
      const [vendaOwn, alugOwn, interesseOwn] = await Promise.all([
        Venda.exists({ clienteId: id, vendedorId: auth.userId }),
        Aluguel.exists({ clienteId: id, vendedorId: auth.userId }),
        Interesse.exists({ clienteId: id, vendedorAtendeu: auth.userId }),
      ]);
      if (!vendaOwn && !alugOwn && !interesseOwn) {
        return NextResponse.json(
          { error: "Cliente não está sob seu atendimento" },
          { status: 403 }
        );
      }
    }

    // Perfil no Supabase. Admin vê tudo; vendedor recebe payload minimizado
    // (sem CPF/RG/CNH/endereço/banco/pix) por PII minimization.
    const admin = createSupabaseAdminClient();
    const columns =
      auth.role === "admin"
        ? "id, nome, email, telefone, role, status, created_at, cpf, rg, cnh, endereco"
        : "id, nome, email, telefone, role, status, created_at";
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select(columns)
      .eq("id", id)
      .maybeSingle();

    if (profileErr) {
      // Erro real do Supabase — não devolve 200 com payload vazio
      return NextResponse.json(
        { error: "Erro ao consultar perfil" },
        { status: 503 }
      );
    }
    if (!profile) {
      // 404 uniforme: evita enumeração de UUIDs via status code
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Mongo collections: tudo o que tiver clienteId = id
    // Vendedor só vê os próprios documentos (caso o cliente também
    // tenha sido atendido por outros vendedores).
    const vendaScope =
      auth.role === "vendedor"
        ? { clienteId: id, vendedorId: auth.userId }
        : { clienteId: id };
    const alugScope =
      auth.role === "vendedor"
        ? { clienteId: id, vendedorId: auth.userId }
        : { clienteId: id };

    // allSettled: se uma query falhar (timeout, índice ausente), as outras
    // ainda retornam. Antes era Promise.all → uma falha derrubava o page todo.
    const settled = await Promise.allSettled([
      Interesse.find({ clienteId: id })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
        .maxTimeMS(5000),
      Venda.find(vendaScope).sort({ data: -1 }).limit(200).lean().maxTimeMS(5000),
      Aluguel.find(alugScope).sort({ dataInicio: -1 }).limit(200).lean().maxTimeMS(5000),
      (async () => {
        const p = profile as { email?: string; telefone?: string };
        const ors: Array<Record<string, string>> = [];
        if (p.email) ors.push({ email: p.email });
        if (p.telefone) ors.push({ telefone: p.telefone });
        if (!ors.length) return [];
        const contatoFilter: Record<string, unknown> = { $or: ors };
        if (auth.role === "vendedor") {
          contatoFilter.vendedorResponsavel = auth.userId;
        }
        return Contato.find(contatoFilter)
          .sort({ createdAt: -1 })
          .limit(50)
          .lean()
          .maxTimeMS(5000);
      })(),
    ]);
    const interesses = settled[0].status === "fulfilled" ? settled[0].value : [];
    const vendas = settled[1].status === "fulfilled" ? settled[1].value : [];
    const alugueis = settled[2].status === "fulfilled" ? settled[2].value : [];
    const contatos = settled[3].status === "fulfilled" ? settled[3].value : [];

    const totalGasto = vendas.reduce((sum, v) => sum + (v.valorVendido || 0), 0);
    const alugueisAtivos = alugueis.filter(
      (a) => a.status === "ativo" || a.status === "atrasado"
    ).length;

    return NextResponse.json({
      profile,
      stats: {
        interesses: interesses.length,
        vendas: vendas.length,
        alugueis: alugueis.length,
        alugueisAtivos,
        totalGasto,
      },
      interesses,
      vendas,
      alugueis,
      contatos,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
