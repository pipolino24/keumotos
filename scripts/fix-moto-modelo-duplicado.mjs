/* eslint-disable no-console */
/**
 * Bug: importei motoModelo="${marca} ${modelo} ${ano}" mas o display do
 * dashboard concatena `motoMarca + ' ' + motoModelo` → vira "HONDA HONDA
 * CG 125 FAN ES 2013". Corrige removendo a marca prefixada quando ela
 * já está em motoMarca.
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
const alugueis = db.collection("aluguels");

const todos = await alugueis.find({}).toArray();
let fixados = 0;
for (const a of todos) {
  if (!a.motoMarca || !a.motoModelo) continue;
  const marcaUpper = a.motoMarca.toUpperCase();
  if (a.motoModelo.toUpperCase().startsWith(marcaUpper + " ")) {
    const novoModelo = a.motoModelo.slice(marcaUpper.length + 1);
    await alugueis.updateOne({ _id: a._id }, { $set: { motoModelo: novoModelo } });
    console.log(`  ✅  ${a.clienteNome}: "${a.motoModelo}" → "${novoModelo}"`);
    fixados++;
  }
}
console.log(`\n${fixados} aluguéis fixados.`);

await mongoose.disconnect();
process.exit(0);
