import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Contato } from "@/lib/models/contato";
import { requireRole } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET: lista contatos — só admin/vendedor (dados de leads são privados)
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const contatos = await Contato.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ contatos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST: cria contato — público (formulário "fale conosco" do site).
 * Validações básicas pra evitar lixo. Considerar rate-limit em produção.
 */
export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const data = await req.json();
    if (!data?.nome || !data?.telefone) {
      return NextResponse.json(
        { error: "Nome e telefone são obrigatórios" },
        { status: 400 }
      );
    }
    if (String(data.nome).length > 120 || String(data.telefone).length > 40) {
      return NextResponse.json({ error: "Campos muito longos" }, { status: 400 });
    }
    const contato = await Contato.create({
      nome: String(data.nome).slice(0, 120),
      telefone: String(data.telefone).slice(0, 40),
      email: data.email ? String(data.email).slice(0, 200) : undefined,
      origem: data.origem,
      interesse: data.interesse,
      motoInteresse: data.motoInteresse
        ? String(data.motoInteresse).slice(0, 200)
        : undefined,
      observacoes: data.observacoes
        ? String(data.observacoes).slice(0, 2000)
        : undefined,
      status: "novo",
    });
    return NextResponse.json({ contato }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar contato";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
