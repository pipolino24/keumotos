import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/motos/[id]/vendedor
 *
 * Endpoint público que retorna apenas dados de contato do vendedor
 * responsável pela moto. Nome + telefone (pra WhatsApp). Email NÃO sai,
 * vendedorId NÃO sai. Privado: vendedor "interno" (admin) é omitido —
 * só quem é "vendedor" aparece pra cliente.
 *
 * Rate limit: 120/min por IP — público mas dados de telefone podem ser
 * scraped em massa pra spam list. Limite generoso pra cliente browsing
 * múltiplas motos, mas trava scrapers automatizados.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const ip = getClientIp(req);
  const rl = rateLimit({
    key: `moto-vendedor:${ip}`,
    limit: 120,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { vendedor: null, error: "Muitas requisições" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ vendedor: null });
    }
    const moto = await Moto.findById(id).select("vendedorResponsavel").lean();
    if (!moto?.vendedorResponsavel) {
      return NextResponse.json({ vendedor: null });
    }

    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, nome, telefone, role")
      .eq("id", moto.vendedorResponsavel)
      .maybeSingle();

    if (!profile || (profile.role !== "vendedor" && profile.role !== "afiliado")) {
      return NextResponse.json({ vendedor: null });
    }

    return NextResponse.json({
      vendedor: {
        nome: profile.nome,
        telefone: profile.telefone ?? null,
      },
    });
  } catch {
    return NextResponse.json({ vendedor: null });
  }
}
