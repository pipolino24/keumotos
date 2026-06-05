/* eslint-disable no-console */
/**
 * Inspeciona os dados do Mongo que feed o dashboard /administracao
 * pra responder: os números (R$ 108.500, R$ 41.000) são teste ou reais?
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

console.log("\n=== VENDAS ===");
const vendas = await db.collection("vendas").find({}).toArray();
console.log(`Total: ${vendas.length}`);
let totalVendasConcluidas = 0;
for (const v of vendas) {
  console.log(`  ${v.status} · R$ ${v.valorVendido?.toLocaleString("pt-BR")} · ${v.clienteNome} · ${v.motoModelo ?? "?"} · ${v.data?.toISOString?.()?.slice(0, 10) ?? v.data}`);
  if (v.status === "concluida") totalVendasConcluidas += v.valorVendido ?? 0;
}
console.log(`Vendas concluídas total: R$ ${totalVendasConcluidas.toLocaleString("pt-BR")}`);

console.log("\n=== ALUGUÉIS ===");
const alugueis = await db.collection("alugueis").find({}).toArray();
console.log(`Total: ${alugueis.length}`);
let totalAluguel = 0;
for (const a of alugueis) {
  const valor = a.valorTotal ?? 0;
  totalAluguel += valor;
  console.log(`  ${a.status} · R$ ${valor.toLocaleString("pt-BR")} · ${a.clienteNome} · ${a.motoModelo ?? "?"}`);
}
console.log(`Aluguéis valor total: R$ ${totalAluguel.toLocaleString("pt-BR")}`);

console.log("\n=== MOTOS (status, valor) ===");
const motos = await db.collection("motos").find({}).project({ marca: 1, modelo: 1, placa: 1, status: 1, origem: 1, valorAnunciado: 1, valorCompra: 1, valorFipe: 1 }).toArray();
console.log(`Total: ${motos.length}`);
let investido = 0;
let potencial = 0;
for (const m of motos) {
  investido += m.valorCompra ?? 0;
  if (m.status !== "vendida") potencial += m.valorAnunciado ?? 0;
  console.log(`  ${m.status} · ${m.origem ?? "?"} · ${m.placa ?? "?"} · ${m.marca} ${m.modelo} · compra=R$${(m.valorCompra ?? 0).toLocaleString("pt-BR")} · anunciado=R$${(m.valorAnunciado ?? 0).toLocaleString("pt-BR")} · FIPE=R$${(m.valorFipe ?? 0).toLocaleString("pt-BR")}`);
}
console.log(`Total investido (valorCompra): R$ ${investido.toLocaleString("pt-BR")}`);
console.log(`Receita potencial (anunciado de não-vendida): R$ ${potencial.toLocaleString("pt-BR")}`);

console.log("\n=== AGREGADO ===");
console.log(`Faturamento total esperado = vendas concluídas + valor total aluguéis = R$ ${(totalVendasConcluidas + totalAluguel).toLocaleString("pt-BR")}`);

await mongoose.disconnect();
process.exit(0);
