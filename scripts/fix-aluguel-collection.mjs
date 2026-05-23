/* eslint-disable no-console */
/**
 * Bug: Mongoose pluraliza "Aluguel" → "aluguels" (pluralização inglesa default).
 * Meu script de import escreveu na collection "alugueis" (com 'eis') — não bate.
 *
 * Fix: move os 7 docs de "alugueis" pra "aluguels" e dropa "alugueis".
 * Idempotente: se "alugueis" já não existe, no-op.
 */
import fs from "node:fs";
import mongoose from "mongoose";
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

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const colNames = (await db.listCollections().toArray()).map((c) => c.name);
if (!colNames.includes("alugueis")) {
  console.log("Collection 'alugueis' não existe — nada a fazer.");
  await mongoose.disconnect();
  process.exit(0);
}

const origem = db.collection("alugueis");
const destino = db.collection("aluguels");

const docs = await origem.find({}).toArray();
console.log(`📦 Movendo ${docs.length} aluguéis de 'alugueis' → 'aluguels'...`);

let movidos = 0;
let pulados = 0;
for (const d of docs) {
  const jaExiste = await destino.findOne({ _id: d._id });
  if (jaExiste) {
    console.log(`  ⚠️  ${d.clienteNome} já em 'aluguels' — pulando`);
    pulados++;
    continue;
  }
  await destino.insertOne(d);
  console.log(`  ✅  ${d.clienteNome}`);
  movidos++;
}

if (movidos === docs.length || pulados + movidos === docs.length) {
  await origem.drop();
  console.log(`\n🗑️  Collection 'alugueis' dropada (era órfã).`);
}

const total = await destino.countDocuments();
const ativos = await destino.countDocuments({ status: "ativo" });
console.log(`\n📊 'aluguels' agora: total=${total}, ativos=${ativos}`);

await mongoose.disconnect();
process.exit(0);
