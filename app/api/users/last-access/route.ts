import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/last-access
 *
 * Retorna mapa { userId: last_sign_in_at } usando auth.admin.listUsers().
 * Endpoint SEPARADO de /api/users propositalmente: a listagem principal de
 * usuários (profiles) precisa responder rápido pra renderizar a tabela.
 * Esse aqui é o "enrichment" que o frontend chama em paralelo — se
 * demorar ou falhar, a tabela ainda renderiza sem a coluna preenchida.
 *
 * Apenas admin — last_sign_in_at é metadado sensível.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw error;
    const map: Record<string, string | null> = {};
    for (const u of data.users) {
      map[u.id] = u.last_sign_in_at ?? null;
    }
    return NextResponse.json({ lastAccess: map });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
