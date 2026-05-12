/**
 * Cria os usuários iniciais da KEU no Supabase Auth + profiles.
 * Usa SUPABASE_SECRET_KEY (service_role) — roda só localmente.
 *
 * Senha temporária pra todos: Keu@2026 (cada um troca no primeiro login)
 *
 * Como rodar (a partir da raiz do projeto):
 *   npx tsx scripts/seed-users.ts
 *
 * Idempotente: se um e-mail já existe, atualiza só o profile.
 */

import { createClient } from "@supabase/supabase-js";

const SENHA_TEMPORARIA = "Keu@2026";

const USUARIOS = [
  {
    email: "keu.admin@keumotos.com.br",
    nome: "Antônio Carlos Silva",
    role: "admin" as const,
    setor: "multimarcas" as const,
    telefone: "(88) 99850-5859",
  },
  {
    email: "marcos@keumotos.com.br",
    nome: "Marcos Vinícius Lima",
    role: "vendedor" as const,
    setor: "multimarcas" as const,
    telefone: "(88) 99814-3757",
  },
  {
    email: "joao.silva@keumotos.com.br",
    nome: "João Silva",
    role: "afiliado" as const,
    setor: "multimarcas" as const,
    telefone: "(88) 99777-6666",
  },
  {
    email: "joaopedro@gmail.com",
    nome: "João Pedro Santos",
    role: "cliente" as const,
    setor: "multimarcas" as const,
    telefone: "(88) 99888-7777",
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (lê .env.local automaticamente com tsx --env-file)"
    );
  }

  const supabase = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("🌱 Criando/atualizando usuários no Supabase...\n");

  for (const u of USUARIOS) {
    process.stdout.write(`• ${u.email} (${u.role}) ... `);

    // Tenta criar; se já existe, busca o id e atualiza
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: SENHA_TEMPORARIA,
      email_confirm: true,
      user_metadata: {
        nome: u.nome,
        role: u.role,
        setor: u.setor,
      },
    });

    let userId: string | null = null;

    if (createErr) {
      if (createErr.message.toLowerCase().includes("already")) {
        // Já existe — busca o id via listUsers
        const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
        const existing = list?.users?.find((x) => x.email === u.email);
        if (!existing) {
          console.log("FALHOU (não achei na lista)");
          continue;
        }
        userId = existing.id;
        // Atualiza metadata + role
        await supabase.auth.admin.updateUserById(userId, {
          password: SENHA_TEMPORARIA,
          user_metadata: { nome: u.nome, role: u.role, setor: u.setor },
        });
      } else {
        console.log(`FALHOU: ${createErr.message}`);
        continue;
      }
    } else if (created.user) {
      userId = created.user.id;
    }

    if (!userId) {
      console.log("FALHOU (sem id)");
      continue;
    }

    // Garante profile (o trigger cria automaticamente, mas vamos enriquecer)
    const { error: profErr } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        nome: u.nome,
        email: u.email,
        telefone: u.telefone,
        role: u.role,
        setor: u.setor,
        status: "ativo",
      });

    if (profErr) {
      console.log(`profile FALHOU: ${profErr.message}`);
    } else {
      console.log("OK");
    }
  }

  console.log(`\n✅ Pronto. Senha temporária pra todos: ${SENHA_TEMPORARIA}`);
  console.log("   (cada usuário deve trocar a senha em /perfil ao logar)");
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
