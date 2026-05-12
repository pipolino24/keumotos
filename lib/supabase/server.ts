import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components, Route Handlers e Server Actions.
 * Lê/escreve cookies da request via `next/headers`.
 *
 * Setters podem ser chamados de Server Components durante render — nesse caso
 * o set não tem efeito e silenciosamente falha. Isso é OK pois o proxy.ts
 * cuida da renovação do token.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chamada feita de um Server Component em render — ignora
          }
        },
      },
    }
  );
}
