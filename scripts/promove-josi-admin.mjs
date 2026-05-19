/* eslint-disable no-console */
/**
 * Script one-off: cria/atualiza josicleudoferreira7@gmail.com como admin
 * com senha conhecida. Usuário pediu acesso direto pra testar — workaround
 * pro rate limit de email do Supabase free tier (2/h).
 *
 * Uso:  node scripts/promove-josi-admin.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SECRET) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");
  process.exit(1);
}

const EMAIL = "josicleudoferreira7@gmail.com";
const PASSWORD = "keumotos";
const NOME = "Josicleudo Ferreira Cruz";
const NEW_ROLE = "admin";

const headers = {
  apikey: SECRET,
  authorization: `Bearer ${SECRET}`,
  "content-type": "application/json",
};

// 1) Procura primeiro em profiles
let userId = null;
const profLookup = await fetch(
  `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(EMAIL)}&select=id,role`,
  { headers }
);
const profileRows = profLookup.ok ? await profLookup.json() : [];
if (profileRows.length) {
  userId = profileRows[0].id;
  console.log(`📋 Já existe em profiles (id=${userId}, role=${profileRows[0].role})`);
}

if (!userId) {
  // 2) Talvez exista em Auth mas o trigger de profile falhou — lista pra checar
  console.log("🔍 Não está em profiles, checando Auth Admin…");
  const authList = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
    headers,
  });
  if (authList.ok) {
    const { users = [] } = await authList.json();
    const match = users.find((u) => u.email === EMAIL);
    if (match) {
      userId = match.id;
      console.log(`📋 Já existe em Auth (id=${userId}) mas profile sumiu — vou recriar profile`);
    }
  }
}

if (userId) {
  // EXISTE — atualiza senha + role
  console.log("🔄 Atualizando senha + role…");
  const upd = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nome: NOME, role: NEW_ROLE, setor: "multimarcas" },
    }),
  });
  if (!upd.ok) {
    console.error("Erro update Auth:", upd.status, await upd.text());
    process.exit(1);
  }
  // upsert profile
  const profUp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: { ...headers, prefer: "return=representation" },
    body: JSON.stringify({ role: NEW_ROLE, nome: NOME, status: "ativo" }),
  });
  if (!profUp.ok) {
    // se profile não existe, tenta INSERT
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: { ...headers, prefer: "return=representation" },
      body: JSON.stringify({
        id: userId,
        email: EMAIL,
        nome: NOME,
        role: NEW_ROLE,
        setor: "multimarcas",
        status: "ativo",
      }),
    });
  }
} else {
  // NÃO EXISTE — cria novo
  console.log("➕ Criando user novo…");
  const create = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nome: NOME, role: NEW_ROLE, setor: "multimarcas" },
    }),
  });
  if (!create.ok) {
    console.error("Erro create:", create.status, await create.text());
    process.exit(1);
  }
  const created = await create.json();
  userId = created.id;
  console.log(`✨ Criado: ${userId}`);
  // Garante role na profiles (trigger pode default pra cliente)
  await new Promise((r) => setTimeout(r, 500));
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ role: NEW_ROLE, nome: NOME, status: "ativo" }),
  });
}

console.log("\n✅ Pronto!");
console.log(`   Nome:   ${NOME}`);
console.log(`   Email:  ${EMAIL}`);
console.log(`   Senha:  ${PASSWORD}`);
console.log(`   Role:   ${NEW_ROLE}`);
console.log(`   Login:  https://keumotos.com/login\n`);
