import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { connectMongo } from "@/lib/mongodb";
import { emitNotification } from "@/lib/notifications/emit";
import { requireAuth, requireRole } from "@/lib/auth/api-guards";

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
    // Aceita cookie SSR (web) ou Bearer JWT (mobile). Role vem do profile real,
    // não de user_metadata (que é cliente-controlled).
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    // Usa service role pra ler profiles. requireAuth() já validou o caller —
    // a RLS impedia esse cliente de ler o pool quando viemos via Bearer
    // (sem cookies de sessão).
    const supabase = createSupabaseAdminClient();

    const callerRole = auth.role;
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

    // Enriquece com last_sign_in_at do auth.users (Supabase guarda timestamp
    // do último login mas só na tabela auth, não em profiles). Listing é
    // capped a 200 — pra organização KEU isso cobre 100% sem paginar.
    // Falha silenciosa: se a listagem dá erro, profiles continuam funcionando
    // mas sem o campo ultimoAcesso.
    let lastSignInById: Map<string, string | null> = new Map();
    try {
      const { data: authList } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      lastSignInById = new Map(
        (authList?.users ?? []).map((u) => [
          u.id,
          u.last_sign_in_at ?? null,
        ])
      );
    } catch (e) {
      console.warn("[/api/users] auth.listUsers falhou:", e instanceof Error ? e.message : e);
    }

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
      const id = p.id as string;
      return {
        ...p,
        _id: id,
        ultimoAcesso: lastSignInById.get(id) ?? null,
      };
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
    // SECURITY: role precisa vir da tabela profiles (server-source-of-truth),
    // não de user_metadata — que é mutável pelo próprio usuário via
    // auth.updateUser({data:{role:"admin"}}) e abriria escalação de privilégio.
    const authz = await requireRole(["admin"], req);
    if (!authz.ok) return authz.response;

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
    // Bloqueia criação de admin via API regular — exige promoção manual
    // via /api/users/[id] PATCH com auditoria. Defende contra escalação
    // lateral caso uma conta admin seja comprometida.
    const ROLES_CRIAVEIS = ["cliente", "vendedor", "afiliado"] as const;
    const roleAlvo = data.role || "cliente";
    if (!ROLES_CRIAVEIS.includes(roleAlvo)) {
      return NextResponse.json(
        {
          error:
            "Role inválido nessa rota. Use /api/users/[id] PATCH pra promover a admin.",
        },
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
    // Documentos (RG/CNH frente+verso em base64) salvos no profile.documentos
    // (JSONB). Limita a 4 e ~8MB por imagem pra evitar payload absurdo.
    if (Array.isArray(data.documentos)) {
      const docsValidos = data.documentos
        .filter((d: unknown) => typeof d === "string" && d.length < 8_000_000)
        .slice(0, 4);
      if (docsValidos.length > 0) extras.documentos = docsValidos;
    }
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

    // ATENÇÃO: senhaTemporaria só é devolvida quando o admin não passou
    // senha customizada. No futuro substituir por envio via Supabase
    // password-reset email (out-of-band). Por ora retornamos pra admin
    // copiar e repassar manualmente, com flag `senhaTemporariaSensivel`
    // que sinaliza pro frontend mostrar warning de "anote agora".
    const response: Record<string, unknown> = {
      user: {
        _id: created.user.id,
        id: created.user.id,
        email: created.user.email,
        nome: data.nome,
        role: data.role || "cliente",
      },
    };
    if (!data.senha) {
      response.senhaTemporaria = senha;
      response.senhaTemporariaSensivel = true;
    }
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar usuário";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * Senha temporária criptograficamente forte (16 bytes → 22 chars base64url).
 * Math.random NÃO serve aqui — é previsível e quebra a segurança da conta.
 */
function gerarSenhaTemporaria(): string {
  return "Keu@" + randomBytes(16).toString("base64url").slice(0, 16);
}
