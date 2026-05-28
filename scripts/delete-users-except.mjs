/* eslint-disable no-console */
/**
 * Deleta TODOS os usuários do Supabase Auth + profiles, EXCETO:
 *
 * 1. Os 3 emails da equipe permanente (admin/staff):
 *    - albertogomessdfn@gmail.com
 *    - victordemolay95@gmail.com
 *    - josicleudoferreira7@gmail.com
 *
 * 2. Os 7 clientes do KEU LOCA MOTOS importados em 23/05/2026 (CPF):
 *    - ELIZEU, CICERO, PAULO, LUCIANO, ITALO, FRANCISCO, YURE
 *    Eles têm locações ativas — deletar deixaria aluguéis órfãos.
 *
 * Operação irreversível. Idempotente: rerodar é safe (não tem o que deletar).
 *
 * Uso: node scripts/delete-users-except.mjs
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

const EMAILS_KEEP = new Set([
  "albertogomessdfn@gmail.com",
  "victordemolay95@gmail.com",
  "josicleudoferreira7@gmail.com",
]);

const CPFS_KEEP = new Set([
  "116.577.193-40", // ELIZEU FERNANDES DE SOUZA
  "033.465.863-24", // CICERO JOSE CAVALCANTE VILAR
  "016.757.834-03", // PAULO HENRIQUE NOBRE CARDOSO
  "251.732.188-43", // LUCIANO ALVES DE SOUSA
  "143.679.754-36", // ITALO VITOR LIMA DOS SANTOS
  "074.440.933-00", // FRANCISCO FABRICIO MACEDO PINTO
  "087.831.463-69", // YURE ROBERTO CARLOS RIBEIRO DOS SANTOS
]);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("Faltam: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log("🔍 Listando usuários...\n");

// listUsers retorna até 1000 por página — KEU tem poucas dezenas então 1 página basta
const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listErr) {
  console.error("Erro listando users:", listErr);
  process.exit(1);
}

const users = list.users ?? [];
console.log(`📋 ${users.length} usuários no Supabase Auth\n`);

let mantidos = 0;
let deletados = 0;
let erros = 0;

for (const u of users) {
  const email = (u.email ?? "").toLowerCase();

  // Critério 1: email da equipe permanente
  if (EMAILS_KEEP.has(email)) {
    console.log(`  🔒 [equipe] mantendo ${email}`);
    mantidos++;
    continue;
  }

  // Critério 2: cliente do KEU LOCA MOTOS — busca por CPF no profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("cpf")
    .eq("id", u.id)
    .maybeSingle();
  if (profile?.cpf && CPFS_KEEP.has(profile.cpf)) {
    console.log(`  🔒 [KEU LOCA] mantendo ${email} (CPF ${profile.cpf})`);
    mantidos++;
    continue;
  }

  // Deleta auth user (cascade ON DELETE deve apagar profile também)
  const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
  if (delErr) {
    console.error(`  ❌ falha deletando ${email}: ${delErr.message}`);
    erros++;
  } else {
    console.log(`  🗑️  deletado ${email}`);
    deletados++;
  }
}

console.log(`\n📊 Resultado:`);
console.log(`   ${mantidos} mantidos · ${deletados} deletados · ${erros} erros`);

process.exit(0);
