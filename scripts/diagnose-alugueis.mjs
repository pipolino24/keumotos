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
const alugueis = db.collection("alugueis");

// Sample do antigo (do victor) vs novo (do Elizeu)
const antigo = await alugueis.findOne({ clienteNome: { $regex: /victor/i } });
const novo = await alugueis.findOne({ clienteNome: { $regex: /ELIZEU/i } });

console.log("\n=== ANTIGO (victor) keys ===");
console.log(Object.keys(antigo).sort());

console.log("\n=== NOVO (Elizeu) keys ===");
console.log(Object.keys(novo).sort());

const antigoKeys = new Set(Object.keys(antigo));
const novoKeys = new Set(Object.keys(novo));
const apenasAntigo = [...antigoKeys].filter((k) => !novoKeys.has(k));
const apenasNovo = [...novoKeys].filter((k) => !antigoKeys.has(k));
console.log("\nApenas no antigo:", apenasAntigo);
console.log("Apenas no novo:", apenasNovo);

console.log("\n=== Tipos relevantes ===");
console.log("antigo.motoId type:", typeof antigo.motoId, antigo.motoId?.constructor?.name);
console.log("novo.motoId type:", typeof novo.motoId, novo.motoId?.constructor?.name);
console.log("antigo.dataInicio:", antigo.dataInicio, typeof antigo.dataInicio);
console.log("novo.dataInicio:", novo.dataInicio, typeof novo.dataInicio);
console.log("antigo.diasContratados:", antigo.diasContratados);
console.log("novo.diasContratados:", novo.diasContratados);
console.log("antigo.valorTotal:", antigo.valorTotal);
console.log("novo.valorTotal:", novo.valorTotal);
console.log("antigo.km_inicial:", antigo.km_inicial);
console.log("novo.km_inicial:", novo.km_inicial);

await mongoose.disconnect();
process.exit(0);
