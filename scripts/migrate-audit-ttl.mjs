import fs from "node:fs";
import mongoose from "mongoose";
const envFile = "./.env.local";
for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
  const t = line.trim(); if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("="); if (eq < 0) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!(k in process.env)) process.env[k] = v;
}
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const col = db.collection("auditlogs");

console.log("=== Índices antes ===");
const idxBefore = await col.indexes();
for (const i of idxBefore) console.log(`  ${i.name}: ${JSON.stringify(i.key)}${i.expireAfterSeconds !== undefined ? ` · TTL=${i.expireAfterSeconds}s` : ""}`);

// Cria o TTL — 365 dias = 31_536_000 segundos
const TTL = 365 * 24 * 60 * 60;
try {
  await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: TTL, name: "ttl_365d" });
  console.log(`\n✅ Índice TTL criado: createdAt + 365 dias = ${TTL}s`);
} catch (e) {
  console.error(`\n❌ Falha: ${e.message}`);
}

console.log("\n=== Índices depois ===");
const idxAfter = await col.indexes();
for (const i of idxAfter) console.log(`  ${i.name}: ${JSON.stringify(i.key)}${i.expireAfterSeconds !== undefined ? ` · TTL=${i.expireAfterSeconds}s (${Math.round(i.expireAfterSeconds/86400)}d)` : ""}`);

await mongoose.disconnect();
process.exit(0);
