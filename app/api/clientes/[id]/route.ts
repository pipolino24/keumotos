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
 * interesses + contatos relacionados. Staff only.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { id } = await params;

    // Perfil no Supabase (se for usuário identificado)
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, nome, email, telefone, role, status, created_at")
      .eq("id", id)
      .maybeSingle();

    // Mongo collections: tudo o que tiver clienteId = id
    const [interesses, vendas, alugueis, contatos] = await Promise.all([
      Interesse.find({ clienteId: id })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Venda.find({ clienteId: id }).sort({ data: -1 }).lean(),
      Aluguel.find({ clienteId: id }).sort({ dataInicio: -1 }).lean(),
      Contato.find({
        $or: [
          { email: profile?.email },
          { telefone: profile?.telefone },
        ].filter(Boolean) as object[],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
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
