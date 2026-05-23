/* eslint-disable no-console */
/**
 * Importa as 14 motos da TABELA DE PREÇO + os 7 clientes/locações do KEU LOCA MOTOS
 * (PDFs do WhatsApp em 23/05/2026).
 *
 * Idempotente: identifica moto por PLACA e cliente por CPF — se já existir,
 * pula. Útil pra rerodar se quebrar no meio.
 *
 * Faltam fotos + algumas infos (alguns chassis/renavam) — outra pessoa edita
 * depois. Cilindrada/combustível/câmbio inferidos pelo modelo.
 *
 * Uso: node scripts/import-tabela-precos.mjs
 */

import fs from "node:fs";
import mongoose from "mongoose";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

if (!process.env.MONGODB_URI || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("Faltam env vars: MONGODB_URI, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY");
  process.exit(1);
}

// === DADOS DO PDF 1: KEU MULTIMARCAS (TABELA DE PREÇO) ===
// Cilindrada/combustível inferidos pelo modelo. Câmbio: todas manuais.
const MOTOS = [
  { marca: "YAMAHA", modelo: "FZ25 FAZER", anoFab: 2022, anoMod: 2022, km: 25253, placa: "SBG5G55", cor: "AZUL", preco: 21000, desconto: 20500, autorizado: 20000, fipe: 20611, status: "disponivel", cilindrada: 250, combustivel: "flex" },
  { marca: "HONDA", modelo: "NXR 160 BROZ ESDD", anoFab: 2023, anoMod: 2023, km: 28538, placa: "SBL5J18", cor: "VERMELHA", preco: 20500, desconto: 20000, autorizado: 19500, fipe: 20329, status: "disponivel", cilindrada: 160, combustivel: "flex" },
  { marca: "HONDA", modelo: "BIZ 125 FLEX", anoFab: 2022, anoMod: 2022, km: 43000, placa: "RZJ4B88", cor: "BRANCA", preco: 16500, desconto: 16200, autorizado: 16000, fipe: 15801, status: "disponivel", cilindrada: 125, combustivel: "flex" },
  { marca: "YAMAHA", modelo: "XTZ 125E", anoFab: 2014, anoMod: 2015, km: 99107, placa: "PNI3059", cor: "LARANJA", preco: 12500, desconto: 12000, autorizado: 11500, fipe: 12594, status: "disponivel", cilindrada: 125, combustivel: "gasolina" },
  { marca: "HONDA", modelo: "BIZ 110i", anoFab: 2018, anoMod: 2019, km: 1668, placa: "PNK0645", cor: "VERMELHA", preco: 12500, desconto: 12200, autorizado: 12000, fipe: 12496, status: "disponivel", cilindrada: 110, combustivel: "flex" },
  { marca: "HONDA", modelo: "BIZ 125", anoFab: 2013, anoMod: 2014, km: 65137, placa: "OSE3035", cor: "VERMELHA", preco: 12500, desconto: 12200, autorizado: 12000, fipe: 12450, status: "disponivel", cilindrada: 125, combustivel: "flex" },
  { marca: "HONDA", modelo: "POP 110I", anoFab: 2021, anoMod: 2021, km: 37828, placa: "RIJ7D90", cor: "BRANCA", preco: 11500, desconto: 11000, autorizado: 10500, fipe: 10921, status: "disponivel", cilindrada: 110, combustivel: "flex" },
  { marca: "HONDA", modelo: "POP 110i", anoFab: 2018, anoMod: 2018, km: 4417, placa: "POY0026", cor: "PRETA", preco: 10500, desconto: 10000, autorizado: 9500, fipe: 10124, status: "disponivel", cilindrada: 110, combustivel: "flex" },
  { marca: "HONDA", modelo: "FAN 125 ES", anoFab: 2012, anoMod: 2012, km: 8824, placa: "OIN0225", cor: "VERMELHA", preco: 10500, desconto: 10200, autorizado: 10000, fipe: 9183, status: "disponivel", cilindrada: 125, combustivel: "flex", partida: "eletrica" },
  { marca: "HONDA", modelo: "BIZ 125 MAIS", anoFab: 2009, anoMod: 2009, km: 80876, placa: "NQV7596", cor: "VERMELHA", preco: 9500, desconto: 9200, autorizado: 9000, fipe: 8700, status: "disponivel", cilindrada: 125, combustivel: "flex" },
  { marca: "HONDA", modelo: "FAN 125 KS", anoFab: 2012, anoMod: 2012, km: 23817, placa: "OIH4D04", cor: "ROXA", preco: 9200, desconto: 8700, autorizado: 8300, fipe: 9183, status: "disponivel", cilindrada: 125, combustivel: "flex", partida: "pedal" },
  // Em REVISÃO → status: "manutencao"
  { marca: "YAMAHA", modelo: "MT 03", anoFab: 2017, anoMod: 2018, km: 59045, placa: "PNH2A64", cor: "PRETA", preco: 21000, desconto: 20700, autorizado: 20500, fipe: 20800, status: "manutencao", cilindrada: 321, combustivel: "gasolina" },
  { marca: "HONDA", modelo: "BROS 150 ES", anoFab: 2010, anoMod: 2011, km: 64631, placa: "NUX5248", cor: "PRETA", preco: 11500, desconto: 11200, autorizado: 11000, fipe: 10893, status: "manutencao", cilindrada: 150, combustivel: "flex", partida: "eletrica" },
  { marca: "HONDA", modelo: "FAN 125 KS", anoFab: 2011, anoMod: 2011, km: 98032, placa: "OCK8012", cor: "VERMELHA", preco: 9500, desconto: 9200, autorizado: 9000, fipe: 8908, status: "manutencao", cilindrada: 125, combustivel: "flex", partida: "pedal" },
];

// === DADOS DO PDF 2: KEU LOCA MOTOS (locações ativas Plano Conquista) ===
const LOCACOES = [
  {
    nome: "ELIZEU FERNANDES DE SOUZA",
    telefone: "(88) 99263-4519",
    cpf: "116.577.193-40",
    endereco: "RUA PE. ANTONIO ALMEIDA, 1095, JARDIM GONZAGA",
    moto: { marca: "YAMAHA", modelo: "FACTOR YBR 125K", cor: "VERMELHA", anoFab: 2010, anoMod: 2011, placa: "NUT-1217", km: 8216, cilindrada: 125, combustivel: "flex" },
    plano: { tipo: "conquista", frequencia: "quinzenal", entrada: 500, parcelas: 80, valorParcela: 200, dias: "10 e 26", inicio: "2026-04-26", conclusao: "2029-08-26" },
  },
  {
    nome: "CICERO JOSE CAVALCANTE VILAR",
    telefone: "(88) 98122-4398",
    cpf: "033.465.863-24",
    endereco: "RUA EMIDIO DE LIRA, 314, FATIMA",
    moto: { marca: "YAMAHA", modelo: "FACTOR 150", cor: "PRETA", anoFab: 2017, anoMod: 2017, placa: "POX4E20", km: 61952, cilindrada: 150, combustivel: "flex" },
    plano: { tipo: "conquista", frequencia: "quinzenal", entrada: 1000, parcelas: 80, valorParcela: 200, dias: "15 e 30", inicio: "2026-04-30", conclusao: "2029-08-30" },
  },
  {
    nome: "PAULO HENRIQUE NOBRE CARDOSO",
    telefone: "(88) 99991-9275",
    cpf: "016.757.834-03",
    endereco: "AV. UNIVERSITARIO, 122, JOSE GERALDO DA CRUZ",
    moto: { marca: "YAMAHA", modelo: "FACTOR 150", cor: "PRETA", anoFab: 2019, anoMod: 2020, placa: "POC8505", km: 55708, cilindrada: 150, combustivel: "flex" },
    plano: { tipo: "conquista", frequencia: "quinzenal", entrada: 1000, parcelas: 80, valorParcela: 200, dias: "03 e 18", inicio: "2026-05-03", conclusao: "2029-09-03" },
  },
  {
    nome: "LUCIANO ALVES DE SOUSA",
    telefone: "(88) 98134-4333",
    cpf: "251.732.188-43",
    endereco: "RUA JOAQUIM DA ROCHA, 1156, JOAO CABRAL",
    moto: { marca: "YAMAHA", modelo: "FAZER 150", cor: "AMARELO", anoFab: 2015, anoMod: 2016, placa: "PNQ0C07", km: 40731, cilindrada: 150, combustivel: "flex" },
    plano: { tipo: "conquista", frequencia: "quinzenal", entrada: 1000, parcelas: 80, valorParcela: 200, dias: "21 e 06", inicio: "2026-04-21", conclusao: "2029-08-21" },
  },
  {
    nome: "ITALO VITOR LIMA DOS SANTOS",
    telefone: "(83) 99408-3436",
    cpf: "143.679.754-36",
    endereco: "RUA DR. VICENTE LEITE, 189, SÃO FRANCISCO, CAJAZEIRAS - PB",
    moto: { marca: "HONDA", modelo: "CG 150 START", cor: "VERMELHO", anoFab: 2015, anoMod: 2015, placa: "PNB1528", km: 51400, cilindrada: 150, combustivel: "flex" },
    plano: { tipo: "conquista", frequencia: "quinzenal", entrada: 1500, parcelas: 60, valorParcela: 200, dias: "15 e 30", inicio: "2026-05-15", conclusao: null },
  },
  {
    nome: "FRANCISCO FABRICIO MACEDO PINTO",
    telefone: "(88) 99606-1046",
    cpf: "074.440.933-00",
    endereco: "RUA JOSÉ TOMAS FERREIRA, 24A, FREI DAMIÃO, JUAZEIRO DO NORTE - CE",
    moto: { marca: "HONDA", modelo: "CG 125 FAN ES", cor: "VERMELHA", anoFab: 2013, anoMod: 2013, placa: "OSU5D42", km: 79628, cilindrada: 125, combustivel: "flex", partida: "eletrica" },
    plano: { tipo: "conquista", frequencia: "quinzenal", entrada: 1000, parcelas: 52, valorParcela: 200, dias: "10 e 25", inicio: "2026-06-10", conclusao: null },
  },
  {
    nome: "YURE ROBERTO CARLOS RIBEIRO DOS SANTOS",
    telefone: "(99) 98503-4479",
    cpf: "087.831.463-69",
    endereco: "RUA JACINTO ROCHA, 102, SANTA TEREZA, JUAZEIRO DO NORTE - CE",
    moto: { marca: "HONDA", modelo: "FAN 150 FLEX", cor: "CINZA", anoFab: 2011, anoMod: 2012, placa: "ODH4E75", km: 153, chassi: "9c2kc1670cr493408", cilindrada: 150, combustivel: "flex" },
    plano: { tipo: "conquista", frequencia: "quinzenal", entrada: 1500, parcelas: 72, valorParcela: 200, dias: "05 e 20", inicio: "2026-06-05", conclusao: null },
  },
];

// === Helper: gera array de parcelasLocacao distribuídas no tempo ===
function gerarParcelas(dataInicio, numParcelas, cicloDias, valorParcela) {
  const parcelas = [];
  for (let i = 1; i <= numParcelas; i++) {
    const venc = new Date(dataInicio.getTime());
    venc.setDate(venc.getDate() + cicloDias * i);
    parcelas.push({
      numero: i,
      vencimento: venc,
      valor: valorParcela,
      status: "pendente",
      registradoEm: new Date(),
    });
  }
  return parcelas;
}

// === MAIN ===
async function main() {
  console.log("🔌 Conectando no Mongo + Supabase...\n");
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const motos = db.collection("motos");
  const alugueis = db.collection("alugueis");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ===== ETAPA 1: Cadastrar motos da TABELA DE PREÇO =====
  console.log("📦 Cadastrando 14 motos da TABELA DE PREÇO...\n");
  const motoIdPorPlaca = new Map();

  for (const m of MOTOS) {
    const placaUpper = m.placa.toUpperCase();
    const existe = await motos.findOne({ placa: placaUpper });
    if (existe) {
      console.log(`  ⚠️  ${m.marca} ${m.modelo} (${placaUpper}) já existe — pulando`);
      motoIdPorPlaca.set(placaUpper, existe._id);
      continue;
    }

    const doc = {
      marca: m.marca,
      modelo: m.modelo,
      anoFabricacao: m.anoFab,
      anoModelo: m.anoMod,
      cor: m.cor,
      placa: placaUpper,
      km: m.km,
      cilindrada: m.cilindrada,
      combustivel: m.combustivel,
      cambio: "manual",
      partida: m.partida || "eletrica",
      valorFipe: m.fipe,
      valorCompra: m.autorizado, // valor autorizado = valor mínimo de compra
      valorAnunciado: m.preco,
      valorMinimo: m.autorizado,
      tipo: "ambos", // venda + locação
      status: m.status,
      origem: "comprada",
      setor: "multimarcas",
      dataEntrada: new Date(),
      fotos: [],
      documentos: [],
      destaque: false,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const r = await motos.insertOne(doc);
    motoIdPorPlaca.set(placaUpper, r.insertedId);
    console.log(`  ✅  ${m.marca} ${m.modelo} (${placaUpper}) ${m.status === "manutencao" ? "[REVISÃO]" : ""} — R$ ${m.preco.toLocaleString("pt-BR")}`);
  }

  // ===== ETAPA 2: Cadastrar clientes do KEU LOCA MOTOS no Supabase =====
  console.log("\n👤 Cadastrando 7 clientes do KEU LOCA MOTOS...\n");
  const clienteIdPorCpf = new Map();
  const SENHA_TEMPORARIA = "Keu@2026";

  for (const l of LOCACOES) {
    // Email sintético baseado no nome — cliente pode trocar depois
    const emailSlug = l.nome
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim()
      .replace(/\s+/g, ".")
      .slice(0, 40);
    const email = `${emailSlug}@cliente.keumotos.com`;

    // Check se CPF já existe em profiles (idempotência)
    const { data: existeProfile } = await supabase
      .from("profiles")
      .select("id, nome, cpf")
      .eq("cpf", l.cpf)
      .maybeSingle();
    if (existeProfile) {
      console.log(`  ⚠️  ${l.nome} (CPF ${l.cpf}) já existe — pulando`);
      clienteIdPorCpf.set(l.cpf, existeProfile.id);
      continue;
    }

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: SENHA_TEMPORARIA,
      email_confirm: true,
      user_metadata: { nome: l.nome, role: "cliente", setor: "multimarcas" },
    });

    let userId = null;
    if (createErr) {
      if (createErr.message?.includes("already") || createErr.code === "email_exists") {
        // Email já existe — busca por email
        const { data: list } = await supabase.auth.admin.listUsers();
        const u = list?.users?.find((x) => x.email === email);
        if (u) userId = u.id;
        else throw createErr;
      } else throw createErr;
    } else {
      userId = created.user?.id;
    }
    if (!userId) {
      console.error(`  ❌  Falha criar ${l.nome}`);
      continue;
    }

    // Atualiza profile com dados pessoais do contrato
    await supabase
      .from("profiles")
      .update({
        nome: l.nome,
        telefone: l.telefone,
        cpf: l.cpf,
        endereco: { texto: l.endereco },
        // sexo/nascimento/naturalidade/rg/cnh/profissao ficam vazios — admin edita depois
      })
      .eq("id", userId);

    clienteIdPorCpf.set(l.cpf, userId);
    console.log(`  ✅  ${l.nome} (CPF ${l.cpf})`);
  }

  // ===== ETAPA 3: Cadastrar motos das locações (não estavam na tabela de preço) =====
  console.log("\n🏍️  Cadastrando motos das locações...\n");
  for (const l of LOCACOES) {
    const placaUpper = l.moto.placa.toUpperCase();
    if (motoIdPorPlaca.has(placaUpper)) continue;
    const existe = await motos.findOne({ placa: placaUpper });
    if (existe) {
      motoIdPorPlaca.set(placaUpper, existe._id);
      console.log(`  ⚠️  ${l.moto.marca} ${l.moto.modelo} (${placaUpper}) já existe`);
      continue;
    }
    const doc = {
      marca: l.moto.marca,
      modelo: l.moto.modelo,
      anoFabricacao: l.moto.anoFab,
      anoModelo: l.moto.anoMod,
      cor: l.moto.cor,
      placa: placaUpper,
      chassi: l.moto.chassi ? l.moto.chassi.toUpperCase() : undefined,
      km: l.moto.km,
      cilindrada: l.moto.cilindrada,
      combustivel: l.moto.combustivel,
      cambio: "manual",
      partida: l.moto.partida || "eletrica",
      // Sem FIPE/preço — outra pessoa edita depois. Coloca valores placeholders
      // (0 quebraria validação `min: 0`, então 1 é o mínimo seguro).
      valorFipe: 1,
      valorCompra: 1,
      valorAnunciado: 1,
      valorMinimo: 1,
      tipo: "aluguel",
      status: "alugada", // moto já está com cliente
      origem: "comprada",
      setor: "loca",
      dataEntrada: new Date(l.plano.inicio),
      fotos: [],
      documentos: [],
      destaque: false,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const r = await motos.insertOne(doc);
    motoIdPorPlaca.set(placaUpper, r.insertedId);
    console.log(`  ✅  ${l.moto.marca} ${l.moto.modelo} (${placaUpper}) → ${l.nome}`);
  }

  // ===== ETAPA 4: Cadastrar aluguéis Plano Conquista =====
  console.log("\n📜 Cadastrando 7 aluguéis Plano Conquista...\n");
  for (const l of LOCACOES) {
    const placaUpper = l.moto.placa.toUpperCase();
    const motoId = motoIdPorPlaca.get(placaUpper);
    const clienteId = clienteIdPorCpf.get(l.cpf);
    if (!motoId || !clienteId) {
      console.error(`  ❌  ${l.nome}: motoId=${motoId} clienteId=${clienteId} — skip`);
      continue;
    }

    // Idempotência: se já tem aluguel ativo dessa moto pra esse cliente, pula
    const jaExiste = await alugueis.findOne({
      motoId,
      clienteId,
      status: { $in: ["ativo", "atrasado"] },
    });
    if (jaExiste) {
      console.log(`  ⚠️  ${l.nome} já tem aluguel ativo dessa moto — pulando`);
      continue;
    }

    const dataInicio = new Date(l.plano.inicio + "T00:00:00");
    const dataFim = l.plano.conclusao
      ? new Date(l.plano.conclusao + "T00:00:00")
      : new Date(dataInicio.getTime() + l.plano.parcelas * 15 * 24 * 60 * 60 * 1000); // estima fim
    const cicloDias = 15; // quinzenal
    const parcelasLocacao = gerarParcelas(dataInicio, l.plano.parcelas, cicloDias, l.plano.valorParcela);
    const valorTotal = l.plano.entrada + l.plano.parcelas * l.plano.valorParcela;
    const diasContratados = Math.max(
      1,
      Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (24 * 60 * 60 * 1000))
    );

    const doc = {
      motoId,
      motoModelo: `${l.moto.marca} ${l.moto.modelo} ${l.moto.anoMod}`,
      motoMarca: l.moto.marca,
      motoAno: l.moto.anoMod,
      clienteId,
      clienteNome: l.nome,
      clienteTelefone: l.telefone,
      clienteCpf: l.cpf,
      dataInicio,
      dataFim,
      // Plano Conquista (legado mas suportado): entrada + parcelas + opção de quitação
      tipoPlano: "conquista",
      valorEntrada: l.plano.entrada,
      dataEntrada: dataInicio,
      valorParcela: l.plano.valorParcela,
      numeroParcelas: l.plano.parcelas,
      parcelasPagas: 0,
      frequenciaParcela: "quinzenal",
      cicloDias,
      proximaParcelaEm: parcelasLocacao[0]?.vencimento,
      parcelasLocacao,
      multaPorAtrasoPercent: 10,
      jurosDiaPercent: 2,
      diasContratados,
      valorTotal,
      caucao: 0,
      km_inicial: l.moto.km,
      fotosInicio: [],
      fotosFim: [],
      avarias: [],
      custoTotalAvarias: 0,
      multaAtraso: 0,
      observacoes: `Importado da planilha KEU LOCA MOTOS em ${new Date().toLocaleDateString("pt-BR")}. Dias de vencimento: ${l.plano.dias}.`,
      status: "ativo",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await alugueis.insertOne(doc);
    console.log(
      `  ✅  ${l.nome} → ${l.moto.marca} ${l.moto.modelo} · ${l.plano.parcelas}×R$${l.plano.valorParcela} ${l.plano.frequencia}`
    );
  }

  console.log("\n🎉 Import concluído!\n");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
