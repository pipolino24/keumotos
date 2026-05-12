"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Client Components no browser.
 * Usa a publishable key (segura para exposição pública).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
