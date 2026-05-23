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

console.log("MONGODB_URI host:", process.env.MONGODB_URI?.match(/@([^/]+)/)?.[1]);
console.log("MONGODB DB:", process.env.MONGODB_URI?.match(/\/([^?]+)\?/)?.[1] ?? "default");

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
console.log("Mongo DB name:", db.databaseName);

const motos = db.collection("motos");
const alugueis = db.collection("alugueis");

const totalMotos = await motos.countDocuments();
const totalAlugueis = await alugueis.countDocuments();
const ativos = await alugueis.countDocuments({ status: "ativo" });
console.log(`📊 motos: ${totalMotos}, aluguéis total: ${totalAlugueis}, ativos: ${ativos}`);

console.log("\n📜 Todos os aluguéis ativos:");
const todos = await alugueis
  .find({ status: "ativo" })
  .project({ clienteNome: 1, motoModelo: 1, tipoPlano: 1, vendedorId: 1, clienteId: 1 })
  .toArray();
for (const a of todos) {
  console.log(`  - ${a.clienteNome} (${a.tipoPlano}) → ${a.motoModelo} | vendedorId=${a.vendedorId} | clienteId=${a.clienteId?.slice(0, 8)}...`);
}

await mongoose.disconnect();
process.exit(0);
