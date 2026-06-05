/* eslint-disable no-console */
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
const cols = await db.listCollections().toArray();
console.log("\n=== TODAS COLLECTIONS ===");
for (const c of cols) {
  const count = await db.collection(c.name).countDocuments();
  console.log(`  ${c.name} · ${count} docs`);
}

// Procura por qualquer coisa tipo aluguel
const candidates = ["aluguel", "aluguels", "alugueis", "rentals", "locacoes", "locacao"];
console.log("\n=== Procurando aluguel em nomes alternativos ===");
for (const n of candidates) {
  const exists = cols.find((c) => c.name === n);
  if (exists) {
    const docs = await db.collection(n).find({}).limit(3).toArray();
    console.log(`\n  ✅ ${n} — ${docs.length} docs (mostrando 3):`);
    for (const d of docs) {
      console.log(`     ${JSON.stringify({ _id: d._id, status: d.status, valorTotal: d.valorTotal, clienteNome: d.clienteNome })}`);
    }
  }
}

await mongoose.disconnect();
process.exit(0);
