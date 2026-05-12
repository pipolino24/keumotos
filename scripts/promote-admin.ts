/* eslint-disable no-console */
/**
 * Promote a user to admin role.
 *
 * Usage:
 *   npx tsx scripts/promote-admin.ts <email>
 *
 * Atualiza:
 * - profiles.role = "admin" (Supabase tabela)
 * - auth.users.user_metadata.role = "admin" (Supabase auth)
 *
 * O proxy/middleware lê user_metadata pra autorização — ambos precisam
 * ficar em sync. RLS é ignorado porque usamos service role key.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

/**
 * Lê .env.local manualmente — evita dependência de dotenv pra script
 * one-off. Procura no worktree primeiro, fallback pro repo principal.
 */
function loadEnv() {
  const candidates = [
    resolve(__dirname, "../.env.local"),
    "/Users/victoroliveira/keumotos/.env.local",
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      let value = m[2];
      // Strip aspas opcionais
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
    return;
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY no .env.local"
  );
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("Uso: npx tsx scripts/promote-admin.ts <email>");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Encontra user via listUsers (não tem getUserByEmail direto)
  let userId: string | undefined;
  let userMetadata: Record<string, unknown> | undefined;
  let page = 1;
  while (!userId) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(`listUsers: ${error.message}`);
    if (!data.users.length) break;
    const match = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
    );
    if (match) {
      userId = match.id;
      userMetadata = match.user_metadata;
      break;
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  if (!userId) {
    console.error(`Usuário com email "${email}" não encontrado.`);
    process.exit(2);
  }
  console.log(`Encontrado: ${email} → id ${userId}`);
  console.log(`Role atual no user_metadata: ${userMetadata?.role ?? "(none)"}`);

  // 2. Atualiza profiles.role
  const { error: profErr } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);
  if (profErr) {
    console.error(`Erro atualizando profiles: ${profErr.message}`);
    process.exit(3);
  }
  console.log("profiles.role = admin ✓");

  // 3. Atualiza user_metadata.role pro middleware/proxy ler
  const { error: metaErr } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...(userMetadata ?? {}), role: "admin" },
  });
  if (metaErr) {
    console.error(`Erro atualizando user_metadata: ${metaErr.message}`);
    process.exit(4);
  }
  console.log("user_metadata.role = admin ✓");

  console.log("\nPronto. O usuário precisa fazer logout/login para o token");
  console.log("refletir o novo role (cookies têm o role embutido).");
}

main().catch((err) => {
  console.error("Falha:", err.message ?? err);
  process.exit(99);
});
