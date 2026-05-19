/* eslint-disable no-console */
/**
 * Script one-off: zera o histórico de valores/transações pra começar a
 * usar com dados reais. NÃO mexe em estoque/motos, users/profiles,
 * proprietarios nem afiliados (esses são cadastros).
 *
 * Limpa:
 *   - vendas (todas)
 *   - alugueis (todos)
 *   - interesses (views/leads/favoritos/simulações)
 *   - contatos (kanban de leads)
 *   - notifications (feed do dashboard)
 *   - audit-logs (histórico de auditoria)
 *
 * Uso:  node scripts/zera-historico.mjs
 */

import fs from "node:fs";
import mongoose from "mongoose";
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

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI ausente em .env.local");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
if (!db) {
  console.error("Falha conectando ao MongoDB");
  process.exit(1);
}

const COLECOES_PRA_ZERAR = [
  "vendas",
  "alugueis",
  "interesses",
  "contatos",
  "notifications",
  "auditlogs",
  "audit-logs",
];

// Contadores antes
const antes = {};
for (const nome of COLECOES_PRA_ZERAR) {
  try {
    antes[nome] = await db.collection(nome).countDocuments({});
  } catch {
    antes[nome] = 0;
  }
}

console.log("📋 Antes:");
for (const [nome, qtd] of Object.entries(antes)) {
  console.log(`   ${nome}: ${qtd}`);
}

console.log("\n🗑️  Limpando...");
const resultados = {};
for (const nome of COLECOES_PRA_ZERAR) {
  try {
    const r = await db.collection(nome).deleteMany({});
    resultados[nome] = r.deletedCount;
  } catch (e) {
    resultados[nome] = `erro: ${e.message}`;
  }
}

console.log("\n✅ Apagados:");
for (const [nome, qtd] of Object.entries(resultados)) {
  console.log(`   ${nome}: ${qtd}`);
}

// Verifica que estoque NÃO foi tocado
const motos = await db.collection("motos").countDocuments({});
const users = await db.collection("users").countDocuments({}).catch(() => "n/a");
const props = await db.collection("proprietarios").countDocuments({});
const afils = await db.collection("afiliados").countDocuments({});

console.log("\n📦 Preservados (cadastros):");
console.log(`   motos (estoque): ${motos}`);
console.log(`   proprietarios:   ${props}`);
console.log(`   afiliados:       ${afils}`);
if (users !== "n/a") console.log(`   users (Mongo):   ${users}`);

await mongoose.disconnect();
console.log("\n✨ Histórico zerado. Pode começar a registrar dados reais.\n");
