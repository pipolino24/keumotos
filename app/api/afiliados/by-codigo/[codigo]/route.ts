import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Afiliado } from "@/lib/models/afiliado";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/afiliados/by-codigo/<codigo>
 * Endpoint PÚBLICO usado pela página /m/[codigo] (link de afiliado).
 * Retorna só campos seguros pra exibição — financeiros e PII sensíveis ficam
 * fora do payload. Aceita anônimo porque é onde o cliente cai vindo do link.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  // Rate limit pra não virar enumerador de afiliados
  const ip = getClientIp(req);
  const rl = rateLimit({
    key: `afiliado-by-codigo:${ip}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde 1 minuto." },
      { status: 429 }
    );
  }

  try {
    const { codigo } = await params;
    if (!codigo || codigo.length > 64) {
      return NextResponse.json({ error: "código inválido" }, { status: 400 });
    }
    await connectMongo();

    const afiliado = await Afiliado.findOne({
      codigo: codigo.toLowerCase(),
    })
      .select({
        codigo: 1,
        nome: 1,
        avatar: 1,
        bio: 1,
        // telefone/whatsapp são públicos no contexto de afiliado — ele
        // virou afiliado pra ser contatado por interessados. Email fica
        // de fora (canal interno).
        telefone: 1,
        whatsapp: 1,
        instagram: 1,
        cidade: 1,
        estado: 1,
        status: 1,
        aprovado: 1,
      })
      .lean()
      .maxTimeMS(5000);

    if (!afiliado) {
      return NextResponse.json(
        { error: "Afiliado não encontrado" },
        { status: 404 }
      );
    }

    // Bloqueado/pausado: retorna shape mas sem dados — front decide CTA
    if (afiliado.status !== "ativo" || !afiliado.aprovado) {
      return NextResponse.json({
        afiliado: {
          codigo: afiliado.codigo,
          status: afiliado.status,
          aprovado: afiliado.aprovado,
        },
      });
    }

    return NextResponse.json({ afiliado });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
