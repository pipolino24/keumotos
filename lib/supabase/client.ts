"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Client Components no browser.
 *
 * A publishable key é pública por design (vai no bundle JS do cliente
 * sempre). O fallback hardcoded existe pra plataformas como Trapiche
 * que só injetam env vars em runtime — sem fallback, `next build`
 * produz um bundle sem as URLs porque NEXT_PUBLIC_* só é inlined em
 * build time.
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://cnijuvfxrbmetnvyhbcw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_vOZM7UAbovrf1Pf_lZGIDg_tu-lTbrQ";

export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
