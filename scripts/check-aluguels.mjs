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
const docs = await mongoose.connection.db.collection("aluguels").find({}).toArray();
console.log(`Total: ${docs.length}\n`);
let totalCarteira = 0, totalAtivo = 0, totalConcluido = 0;
for (const a of docs) {
  totalCarteira += a.valorTotal ?? 0;
  if (a.status === "ativo" || a.status === "atrasado") totalAtivo += a.valorTotal ?? 0;
  if (a.status === "concluido") totalConcluido += a.valorTotal ?? 0;
  console.log(`  ${a.status} · R$ ${(a.valorTotal ?? 0).toLocaleString("pt-BR")} · ${a.clienteNome} · ${a.motoMarca ?? ""} ${a.motoModelo ?? "?"} · início=${a.dataInicio?.toISOString?.()?.slice(0,10) ?? "?"}`);
}
console.log(`\nCarteira total: R$ ${totalCarteira.toLocaleString("pt-BR")}`);
console.log(`Ativos: R$ ${totalAtivo.toLocaleString("pt-BR")}`);
console.log(`Concluído: R$ ${totalConcluido.toLocaleString("pt-BR")}`);
await mongoose.disconnect(); process.exit(0);
