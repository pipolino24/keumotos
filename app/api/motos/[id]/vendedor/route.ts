import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
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
