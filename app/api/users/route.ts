import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/users
 * Lista perfis (com filtros opcionais role, status, q).
 * Apenas admin pode listar todos. Outros veem apenas o próprio perfil.
 *
 * Mantemos o formato `{ users: [...] }` para compatibilidade com componentes
 * que ainda esperam esse shape. Cada item é um Profile.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (role) query = query.eq("role", role);
    if (status) query = query.eq("status", status);
    if (q) query = query.or(`nome.ilike.%${q}%,email.ilike.%${q}%,cpf.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    // Mapeia para compat com componentes antigos (_id = id)
    const users = (data ?? []).map((p) => ({ ...p, _id: p.id }));
    return NextResponse.json({ users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Cria um novo usuário no Supabase Auth + trigger cria o profile.
 * Usa service_role (admin) — exige caller autenticado como admin.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();

    if (!caller) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const callerRole = (caller.user_metadata?.role as string) || "cliente";
    if (callerRole !== "admin") {
      return NextResponse.json({ error: "Apenas admin pode criar usuários" }, { status: 403 });
    }

    const data = await req.json();
    if (!data.email || !data.nome) {
      return NextResponse.json(
        { error: "Email e nome são obrigatórios" },
        { status: 400 }
      );
    }
    const senha = data.senha || gerarSenhaTemporaria();
    if (senha.length < 8) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome: data.nome,
        role: data.role || "cliente",
        setor: data.setor || "multimarcas",
      },
    });
    if (error) throw error;
    if (!created.user) throw new Error("Falha ao criar usuário");

    // Atualiza campos extras na profiles (telefone, cpf, etc.) — o trigger
    // já criou o registro base com nome/email/role.
    const extras: Record<string, unknown> = {};
    if (data.telefone) extras.telefone = data.telefone;
    if (data.cpf) extras.cpf = data.cpf;
    if (data.rg) extras.rg = data.rg;
    if (data.cnh) extras.cnh = data.cnh;
    if (data.endereco) extras.endereco = data.endereco;
    if (data.pix) extras.pix = data.pix;
    if (Object.keys(extras).length > 0) {
      await admin.from("profiles").update(extras).eq("id", created.user.id);
    }

    return NextResponse.json(
      {
        user: {
          _id: created.user.id,
          id: created.user.id,
          email: created.user.email,
          nome: data.nome,
          role: data.role || "cliente",
        },
        senhaTemporaria: data.senha ? undefined : senha,
      },
      { status: 201 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar usuário";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function gerarSenhaTemporaria(): string {
  return (
    "Keu@" +
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(10).slice(2, 4)
  );
}
