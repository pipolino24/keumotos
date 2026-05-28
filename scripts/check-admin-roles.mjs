/* eslint-disable no-console */
/**
 * Confere role atual dos 3 emails permanentes + lista todos admins.
 * Pra rodar antes/depois de promover admins.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, "..", ".env.local");
for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq < 0) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!(k in process.env)) process.env[k] = v;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const EMAILS_PERMANENTES = [
  "albertogomessdfn@gmail.com",
  "victordemolay95@gmail.com",
  "josicleudoferreira7@gmail.com",
];

console.log("\n👥 Roles dos emails permanentes:\n");
for (const email of EMAILS_PERMANENTES) {
  const { data: prof } = await supabase
    .from("profiles")
    .select("id, nome, email, role, setor, permissoes")
    .eq("email", email)
    .maybeSingle();
  if (!prof) {
    console.log(`  ❌ ${email} — não encontrado`);
    continue;
  }
  const icon = prof.role === "admin" ? "👑" : "👤";
  console.log(
    `  ${icon} ${email.padEnd(35)} role=${prof.role.padEnd(9)} setor=${prof.setor ?? "?"}`
  );
}

console.log("\n👑 Todos admins do sistema:\n");
const { data: admins } = await supabase
  .from("profiles")
  .select("nome, email, setor")
  .eq("role", "admin")
  .order("email");
for (const a of admins ?? []) {
  console.log(`  • ${a.email.padEnd(35)} ${a.nome ?? ""} (setor: ${a.setor ?? "?"})`);
}
console.log(`\n  Total: ${admins?.length ?? 0} admin(s)\n`);

process.exit(0);
