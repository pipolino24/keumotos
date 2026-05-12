import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://cnijuvfxrbmetnvyhbcw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_vOZM7UAbovrf1Pf_lZGIDg_tu-lTbrQ";

/**
 * Atualiza a sessão Supabase em cada request e devolve o NextResponse
 * + o usuário autenticado (ou null). Usado pelo proxy.ts da raiz.
 *
 * Importante: o response devolvido aqui PRECISA ser usado pelo proxy
 * (modificado ou retornado) — caso contrário os cookies de refresh
 * não chegam ao browser.
 */
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: getUser() é a chamada que valida o token e renova se preciso.
  // Não substituir por getSession() — getSession lê do cookie sem validar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
