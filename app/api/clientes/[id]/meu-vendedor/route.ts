import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Interesse } from "@/lib/models/interesse";
import { Venda } from "@/lib/models/venda";
import { Aluguel } from "@/lib/models/aluguel";
import { Contato } from "@/lib/models/contato";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clientes/[id]/meu-vendedor
 *
 * Descobre o vendedor "atual" do cliente baseado em prioridade:
 * 1. Aluguel ativo mais recente
 * 2. Venda concluída mais recente
 * 3. Interesse em atendimento mais recente
 * 4. Contato com vendedorResponsavel
 *
 * Cliente vê só o próprio; staff vê de qualquer cliente.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    if (auth.role === "cliente" && auth.userId !== id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await connectMongo();

    // Busca em paralelo — só precisa do mais recente de cada
    const [aluguel, venda, interesse, contato] = await Promise.allSettled([
      Aluguel.findOne({
        clienteId: id,
        vendedorId: { $exists: true, $ne: null },
      })
        .sort({ dataInicio: -1 })
        .select("vendedorId vendedorNome status dataInicio")
        .lean()
        .maxTimeMS(3000),
      Venda.findOne({
        clienteId: id,
        vendedorId: { $exists: true, $ne: null },
      })
        .sort({ data: -1 })
        .select("vendedorId vendedorNome data")
        .lean()
        .maxTimeMS(3000),
      Interesse.findOne({
        clienteId: id,
        vendedorAtendeu: { $exists: true, $ne: null },
      })
        .sort({ atendidoEm: -1 })
        .select("vendedorAtendeu atendidoEm")
        .lean()
        .maxTimeMS(3000),
      Contato.findOne({
        clienteId: id,
        vendedorResponsavel: { $exists: true, $ne: null },
      })
        .sort({ createdAt: -1 })
        .select("vendedorResponsavel createdAt")
        .lean()
        .maxTimeMS(3000),
    ]);

    // Picks por prioridade
    let vendedorId: string | undefined;
    let origem: "aluguel" | "venda" | "interesse" | "contato" | undefined;
    let atribuidoEm: Date | undefined;

    if (aluguel.status === "fulfilled" && aluguel.value?.vendedorId) {
      vendedorId = aluguel.value.vendedorId;
      origem = "aluguel";
      atribuidoEm = aluguel.value.dataInicio as Date;
    } else if (venda.status === "fulfilled" && venda.value?.vendedorId) {
      vendedorId = venda.value.vendedorId;
      origem = "venda";
      atribuidoEm = venda.value.data as Date;
    } else if (
      interesse.status === "fulfilled" &&
      interesse.value?.vendedorAtendeu
    ) {
      vendedorId = interesse.value.vendedorAtendeu;
      origem = "interesse";
      atribuidoEm = interesse.value.atendidoEm as Date;
    } else if (
      contato.status === "fulfilled" &&
      contato.value?.vendedorResponsavel
    ) {
      vendedorId = contato.value.vendedorResponsavel;
      origem = "contato";
      atribuidoEm = contato.value.createdAt as Date;
    }

    if (!vendedorId) {
      return NextResponse.json({ vendedor: null });
    }

    // Busca dados públicos do vendedor — só nome, foto, telefone, email
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, nome, email, telefone, avatar_url, setor")
      .eq("id", vendedorId)
      .single();

    if (!profile) {
      return NextResponse.json({ vendedor: null });
    }

    return NextResponse.json({
      vendedor: {
        id: profile.id,
        nome: profile.nome,
        email: profile.email,
        telefone: profile.telefone,
        avatar: profile.avatar_url,
        setor: profile.setor,
        origem,
        atribuidoEm,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
