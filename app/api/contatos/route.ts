import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Contato } from "@/lib/models/contato";
import { requireRole } from "@/lib/auth/api-guards";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { emitNotification } from "@/lib/notifications/emit";

export const dynamic = "force-dynamic";

const ORIGENS_VALIDAS = new Set([
  "site",
  "instagram",
  "whatsapp",
  "presencial",
  "indicacao",
]);
const INTERESSES_VALIDOS = new Set([
  "compra",
  "venda",
  "troca",
  "aluguel",
  "pecas",
  "outro",
]);

/**
 * GET: lista contatos.
 *  - Staff (admin/vendedor) veem TODOS os contatos. KEU opera com pool
 *    compartilhado de leads — sem partição por vendedor responsável.
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const contatos = await Contato.find(query)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()
      .maxTimeMS(15_000);
    return NextResponse.json({ contatos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST: cria contato — público (formulário "fale conosco" do site).
 * Rate-limited a 8 envios por IP a cada 15 min pra dificultar spam.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit({
    key: `contatos-post:${ip}`,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente de novo em alguns minutos." },
      { status: 429 }
    );
  }
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
    if (data.email && String(data.email).length > 200) {
      return NextResponse.json({ error: "Email muito longo" }, { status: 400 });
    }
    // Origem e interesse: se fornecidos, devem ser válidos. Defaults só
    // quando o campo é completamente omitido (compatibilidade com clientes
    // antigos que não enviam o campo).
    if (data.origem !== undefined && !ORIGENS_VALIDAS.has(data.origem)) {
      return NextResponse.json(
        { error: "origem inválida" },
        { status: 400 }
      );
    }
    if (
      data.interesse !== undefined &&
      !INTERESSES_VALIDOS.has(data.interesse)
    ) {
      return NextResponse.json(
        { error: "interesse inválido" },
        { status: 400 }
      );
    }
    const origem = data.origem ?? "site";
    const interesse = data.interesse ?? "outro";

    const contato = await Contato.create({
      nome: String(data.nome).slice(0, 120),
      telefone: String(data.telefone).slice(0, 40),
      email: data.email
        ? String(data.email).slice(0, 200).toLowerCase()
        : undefined,
      origem,
      interesse,
      motoInteresse: data.motoInteresse
        ? String(data.motoInteresse).slice(0, 200)
        : undefined,
      observacoes: data.observacoes
        ? String(data.observacoes).slice(0, 2000)
        : undefined,
      status: "novo",
    });

    // Notifica admins/vendedores que tem lead novo (sem clienteId, vai pra
    // todos os vendedores). emitNotification falha silenciosa, não rompe.
    await emitNotification({
      tipo: "lead",
      titulo: `Novo lead: ${contato.nome}`,
      descricao: contato.motoInteresse
        ? `Interessado em ${contato.motoInteresse}`
        : `Telefone: ${contato.telefone}`,
      clienteNome: contato.nome,
      origemTipo: "contato",
      origemId: contato._id.toString(),
      link: `/dashboard/contatos`,
      prioridade: "alta",
    });

    return NextResponse.json({ contato }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar contato";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
