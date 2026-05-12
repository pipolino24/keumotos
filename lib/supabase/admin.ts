import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service_role — IGNORA RLS.
 * Use APENAS em código server-side (Route Handlers, Server Actions, scripts).
 * NUNCA importe em Client Components.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente"
    );
  }
  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
