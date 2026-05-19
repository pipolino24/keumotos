import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentProfile } from "@/lib/auth/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

// GET /api/me — usado pelo app iOS (Bearer) e pelo site (cookie).
// Para Bearer (mobile): valida o JWT com anon client; depois lê o profile com
// service role (bypass RLS — leitura segura, pois a query é sempre
// `WHERE id = <jwt.sub>`, ou seja, o user só vê o próprio profile).
// Para cookie (web): usa lib/auth/server.getCurrentProfile() já com SSR.
export async function GET(req: NextRequest) {
  try {
    let profile: Profile | null = null;
    let via = "cookie";

    const authHeader = req.headers.get("authorization") ?? "";
    const bearer = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (bearer) {
      via = "bearer";
      const anon = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await anon.auth.getUser(bearer);
      if (error || !data.user) {
        console.warn(`[/api/me] bearer inválido: ${error?.message ?? "no user"}`);
      } else {
        const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: prof, error: profErr } = await admin
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        if (profErr) {
          console.warn(`[/api/me] profile lookup falhou pra ${data.user.id}: ${profErr.message}`);
        }
        profile = (prof as Profile) ?? {
          id: data.user.id,
          nome: data.user.user_metadata?.full_name
            || data.user.email?.split("@")[0]
            || "Usuário",
          email: data.user.email ?? "",
          role: "cliente",
        } as Profile;
      }
    }

    if (!profile) {
      profile = await getCurrentProfile();
    }

    if (!profile) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    console.log(`[/api/me] OK → role=${profile.role} email=${profile.email} via=${via}`);
    return NextResponse.json({
      id: profile.id,
      nome: profile.nome,
      email: profile.email,
      role: profile.role,
      telefone: profile.telefone ?? null,
      avatarUrl: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    console.error(`[/api/me] erro: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
