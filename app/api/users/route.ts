import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { connectMongo } from "@/lib/mongodb";
import { emitNotification } from "@/lib/notifications/emit";

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

    const callerRole = (user.user_metadata?.role as string) || "cliente";
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    // Cliente nunca pode listar terceiros. Vendedor pode ver lista
    // reduzida (sem CPF/RG/CNH/endereço/pix) — útil para autocomplete de
    // clientes em formulários. Admin tem acesso completo.
    if (callerRole === "cliente") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Limita tamanho do termo de busca para evitar payload pesado
    const qSeguro = q && q.length > 80 ? q.slice(0, 80) : q;
    // Escapa wildcards do PostgREST (.ilike) — % e _
    const qEsc = qSeguro?.replace(/[%_]/g, (m) => `\\${m}`);

    const isAdmin = callerRole === "admin";

    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (role) query = query.eq("role", role);
    if (status) query = query.eq("status", status);
    if (qEsc) {
      query = isAdmin
        ? query.or(`nome.ilike.%${qEsc}%,email.ilike.%${qEsc}%,cpf.ilike.%${qEsc}%`)
        : query.or(`nome.ilike.%${qEsc}%,email.ilike.%${qEsc}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Para não-admin, removemos campos sensíveis no servidor antes de
    // devolver o payload (defesa em profundidade — a RLS já restringe).
    const PII_FIELDS = [
      "cpf",
      "rg",
      "cnh",
      "endereco",
      "pix",
      "banco",
      "agencia",
      "conta",
    ] as const;

    const users = (data ?? []).map((p: Record<string, unknown>) => {
      if (!isAdmin) {
        for (const f of PII_FIELDS) delete p[f];
      }
      return { ...p, _id: p.id };
    });
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

    // Notifica admins sobre o novo cadastro (vendedor/cliente/afiliado todos
    // disparam — admin escolhe se cuidar). Falha silenciosa.
    const novoRole = data.role || "cliente";
    if (novoRole === "cliente" || novoRole === "vendedor" || novoRole === "afiliado") {
      try {
        await connectMongo();
        await emitNotification({
          tipo: "novo_cliente",
          titulo: `Novo ${novoRole} cadastrado: ${data.nome}`,
          descricao: data.telefone
            ? `${data.email} · ${data.telefone}`
            : data.email,
          clienteId: created.user.id,
          clienteNome: data.nome,
          origemTipo: "user",
          origemId: created.user.id,
          link: `/dashboard/usuarios/${created.user.id}`,
          prioridade: "normal",
          // sem vendedorIdEspecifico → vai pra todos admins + vendedores
        });
      } catch (notifErr) {
        console.error("[users] notification fail:", notifErr);
      }
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
