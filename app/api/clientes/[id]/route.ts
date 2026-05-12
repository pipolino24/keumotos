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

    // Perfil no Supabase (se for usuário identificado)
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, nome, email, telefone, role, status, created_at")
      .eq("id", id)
      .maybeSingle();

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

    const [interesses, vendas, alugueis, contatos] = await Promise.all([
      Interesse.find({ clienteId: id })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Venda.find(vendaScope).sort({ data: -1 }).lean(),
      Aluguel.find(alugScope).sort({ dataInicio: -1 }).lean(),
      (async () => {
        // Constrói $or apenas com campos não-vazios — evita query com
        // { email: undefined } que casaria com docs sem o campo.
        const ors: Array<Record<string, string>> = [];
        if (profile?.email) ors.push({ email: profile.email });
        if (profile?.telefone) ors.push({ telefone: profile.telefone });
        if (!ors.length) return [];
        // Vendedor só vê contatos que ele é responsável; admin vê tudo.
        const contatoFilter: Record<string, unknown> = { $or: ors };
        if (auth.role === "vendedor") {
          contatoFilter.vendedorResponsavel = auth.userId;
        }
        return Contato.find(contatoFilter)
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
      })(),
    ]);

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
