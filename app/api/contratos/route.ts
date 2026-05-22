import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Contrato } from "@/lib/models/contrato";
import { contratoCreateSchema } from "@/lib/schemas";
import { requireRole, requireAuth } from "@/lib/auth/api-guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/contratos
 *
 * Lista contratos. Filtros:
 *   ?clienteId=uuid  → filtra por cliente específico
 *   ?aluguelId=oid   → filtra por aluguel
 *   ?status=ativo|rescindido|concluido
 *
 * Cliente vê só os próprios. Staff vê todos.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const clienteIdParam = searchParams.get("clienteId");
    const aluguelIdParam = searchParams.get("aluguelId");
    const statusParam = searchParams.get("status");

    const query: Record<string, unknown> = {};
    // Cliente: só vê próprios contratos
    if (auth.role === "cliente") {
      query.clienteId = auth.userId;
    } else if (clienteIdParam) {
      query.clienteId = clienteIdParam;
    }
    if (aluguelIdParam) query.aluguelId = aluguelIdParam;
    if (statusParam) query.status = statusParam;

    const contratos = await Contrato.find(query)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()
      .maxTimeMS(15_000);

    return NextResponse.json({ contratos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/contratos
 *
 * Gera um contrato a partir de:
 *   - clienteId (busca profile pra preencher contratante)
 *   - motoId (busca moto pra preencher veículo)
 *   - Campos extras: cnh, sexo, nascimento, natural, profissao, rg, avalista
 *
 * Snapshot preservado em Mongo — contrato continua válido mesmo se moto for
 * vendida ou profile editado depois.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;

  try {
    await connectMongo();
    const raw = await req.json();
    const parsed = contratoCreateSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validação: ${issues}` },
        { status: 400 }
      );
    }

    // Busca nome do staff que está gerando o contrato (audit trail)
    let geradoPorNome = auth.email;
    try {
      const admin = createSupabaseAdminClient();
      const { data: prof } = await admin
        .from("profiles")
        .select("nome")
        .eq("id", auth.userId)
        .single();
      if (prof?.nome) geradoPorNome = prof.nome as string;
    } catch {
      /* fallback pro email */
    }

    const doc = await Contrato.create({
      ...parsed.data,
      dataContrato: parsed.data.dataContrato
        ? new Date(parsed.data.dataContrato)
        : new Date(),
      geradoPor: auth.userId,
      geradoPorNome,
    });

    return NextResponse.json(
      { contrato: doc.toObject() },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar contrato";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
