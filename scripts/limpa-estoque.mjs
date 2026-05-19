/* eslint-disable no-console */
/**
 * Script one-off: zera o estoque de motos pra cadastro real.
 *
 *  1) cancela vendas concluídas (status -> cancelada) que apontam pra qualquer moto
 *  2) cancela aluguéis ativos/atrasados (status -> cancelado) que apontam pra qualquer moto
 *  3) deleta TODAS as motos
 *
 * Uso: node scripts/limpa-estoque.mjs
 *
 * Lê MONGODB_URI do .env.local. Imprime o resumo do que tocou.
 */

import fs from "node:fs";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dotenv não tá nas deps, parser manual: KEY=VALUE por linha, ignora comments e blanks
const envFile = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI ausente em .env.local");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
if (!db) {
  console.error("Falha conectando ao MongoDB");
  process.exit(1);
}

const motos = db.collection("motos");
const vendas = db.collection("vendas");
const alugueis = db.collection("alugueis");

const motosAntes = await motos.find({}).project({ marca: 1, modelo: 1, status: 1 }).toArray();
console.log(`\n📋 Antes de limpar: ${motosAntes.length} motos`);
for (const m of motosAntes) {
  console.log(`   - ${m.marca} ${m.modelo} (${m.status})`);
}

// 1) cancela vendas concluídas
const vendasResult = await vendas.updateMany(
  { status: "concluida" },
  {
    $set: {
      status: "cancelada",
      observacoes: "[Cancelada pelo script de limpeza de estoque — 2026-05-19]",
    },
  }
);
console.log(`\n🛑 Vendas canceladas: ${vendasResult.modifiedCount}`);

// 2) cancela aluguéis ativos/atrasados
const alugueisResult = await alugueis.updateMany(
  { status: { $in: ["ativo", "atrasado"] } },
  {
    $set: {
      status: "cancelado",
      observacoes: "[Cancelado pelo script de limpeza de estoque — 2026-05-19]",
    },
  }
);
console.log(`🛑 Aluguéis cancelados: ${alugueisResult.modifiedCount}`);

// 3) deleta TODAS as motos
const motosResult = await motos.deleteMany({});
console.log(`🗑️  Motos deletadas: ${motosResult.deletedCount}`);

const motosDepois = await motos.countDocuments({});
console.log(`\n✅ Estoque depois: ${motosDepois} motos\n`);

await mongoose.disconnect();
