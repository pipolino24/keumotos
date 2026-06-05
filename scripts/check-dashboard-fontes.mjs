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

const ints = await db.collection("interesses").find({}).toArray();
console.log(`=== INTERESSES (${ints.length}) ===`);
for (const i of ints) {
  console.log(`  ${i.resultado ?? "?"} · cliente=${i.clienteNome ?? "?"} · moto=${i.motoModelo ?? i.motoId ?? "?"} · vendedor=${i.vendedorAtendeu ?? "(sem)"} · createdAt=${i.createdAt?.toISOString?.()?.slice(0, 10) ?? "?"}`);
}

const vendas = await db.collection("vendas").find({}).toArray();
console.log(`\n=== VENDAS (${vendas.length}) ===`);
for (const v of vendas) {
  console.log(`  ${v.status ?? "?"} · ${v.clienteNome ?? "?"} · ${v.motoModelo ?? "?"} · R$${(v.valorVendido ?? 0).toLocaleString("pt-BR")} · ${v.data?.toISOString?.()?.slice(0, 10) ?? "?"}`);
}

await mongoose.disconnect();
process.exit(0);
