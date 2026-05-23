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

// Lista todas as collections do DB
const collections = await db.listCollections().toArray();
console.log("Collections:", collections.map((c) => c.name));

const alugueis = db.collection("alugueis");
const todos = await alugueis.find({}).project({ clienteNome: 1, status: 1 }).toArray();
console.log(`\nTotal aluguéis: ${todos.length}`);
for (const a of todos) {
  console.log(`  - ${a.clienteNome} (${a.status})`);
}

await mongoose.disconnect();
process.exit(0);
