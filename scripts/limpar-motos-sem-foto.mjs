/* eslint-disable no-console */
/**
 * Analisa o estoque e deleta motos sem foto, EXCETO as que estão com
 * aluguel ativo (deletar quebraria a locação — perde a referência).
 *
 * Regra:
 *   - Tem foto    → MANTER (com 1+ item em fotos[])
 *   - Sem foto    → ver se tem aluguel ativo
 *       - Com aluguel ativo  → MANTER + AVISO (precisa de foto pra contrato)
 *       - Sem aluguel ativo  → DELETAR
 *
 * Uso: node scripts/limpar-motos-sem-foto.mjs
 * Para preview sem deletar: node scripts/limpar-motos-sem-foto.mjs --dry
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

const DRY_RUN = process.argv.includes("--dry");

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const motos = db.collection("motos");
const alugueis = db.collection("aluguels");

const todas = await motos.find({}).toArray();
console.log(`\n📦 ${todas.length} motos no estoque\n`);

const comFoto = [];
const semFotoComAluguel = [];
const semFotoSemAluguel = [];

for (const m of todas) {
  const temFoto = Array.isArray(m.fotos) && m.fotos.length > 0;
  if (temFoto) {
    comFoto.push(m);
    continue;
  }
  // Sem foto — verifica aluguel ativo
  const alug = await alugueis.findOne({
    motoId: m._id,
    status: { $in: ["ativo", "atrasado"] },
  });
  if (alug) {
    semFotoComAluguel.push({ ...m, _alug: alug });
  } else {
    semFotoSemAluguel.push(m);
  }
}

console.log("✅ COM FOTO (manter):");
for (const m of comFoto) {
  console.log(`  📷 ${m.marca} ${m.modelo} (${m.placa ?? "?"}) — ${m.fotos.length} foto(s)`);
}
if (comFoto.length === 0) console.log("  (nenhuma)");

console.log("\n⚠️  SEM FOTO mas com ALUGUEL ATIVO (manter por segurança):");
for (const m of semFotoComAluguel) {
  console.log(`  🔒 ${m.marca} ${m.modelo} (${m.placa ?? "?"}) → ${m._alug.clienteNome}`);
}
if (semFotoComAluguel.length === 0) console.log("  (nenhuma)");

console.log(`\n🗑️  SEM FOTO E SEM ALUGUEL ATIVO ${DRY_RUN ? "(seriam deletadas)" : "(deletando)"}:`);
const idsDelete = [];
for (const m of semFotoSemAluguel) {
  console.log(`  ❌ ${m.marca} ${m.modelo} (${m.placa ?? "?"}) · status=${m.status}`);
  idsDelete.push(m._id);
}
if (semFotoSemAluguel.length === 0) console.log("  (nenhuma)");

if (!DRY_RUN && idsDelete.length > 0) {
  const result = await motos.deleteMany({ _id: { $in: idsDelete } });
  console.log(`\n🧹 ${result.deletedCount} motos deletadas`);
}

console.log(`\n📊 Resumo:`);
console.log(`   ✅  ${comFoto.length} com foto (mantidas)`);
console.log(`   🔒  ${semFotoComAluguel.length} sem foto mas em locação (mantidas)`);
console.log(`   ${DRY_RUN ? "🔍" : "🗑️ "}  ${semFotoSemAluguel.length} sem foto e sem locação ${DRY_RUN ? "(seriam deletadas)" : "(deletadas)"}`);
console.log(`   = ${todas.length - (DRY_RUN ? 0 : semFotoSemAluguel.length)} motos restantes`);

await mongoose.disconnect();
process.exit(0);
