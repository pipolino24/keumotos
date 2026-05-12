import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emitAuditLog } from "@/lib/audit/emit";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

async function ensureCallerOrAdmin(targetId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  const role = (user.user_metadata?.role as string) || "cliente";
  if (user.id !== targetId && role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Sem permissão para acessar este perfil" },
        { status: 403 }
      ),
    };
  }
  return {
    ok: true as const,
    callerId: user.id,
    callerRole: role,
    callerNome: (user.user_metadata?.nome as string) || user.email || "?",
  };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await ensureCallerOrAdmin(id);
  if (!auth.ok) return auth.response;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }
  return NextResponse.json({ user: { ...data, _id: data.id } });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await ensureCallerOrAdmin(id);
  if (!auth.ok) return auth.response;

  const data = await req.json();
  const update: Record<string, unknown> = {};

  if (data.nome !== undefined) update.nome = String(data.nome).trim();
  if (data.telefone !== undefined) update.telefone = data.telefone || null;
  if (data.cpf !== undefined) update.cpf = data.cpf || null;
  if (data.rg !== undefined) update.rg = data.rg || null;
  if (data.cnh !== undefined) update.cnh = data.cnh || null;
  if (data.cnh_validade !== undefined) update.cnh_validade = data.cnh_validade || null;
  if (data.endereco !== undefined) update.endereco = data.endereco;
  if (data.pix !== undefined) update.pix = data.pix || null;
  if (data.banco !== undefined) update.banco = data.banco;
  if (data.avatar_url !== undefined) update.avatar_url = data.avatar_url || null;

  // Apenas admin pode mexer em role, setor, status, permissoes
  if (auth.callerRole === "admin") {
    if (data.role !== undefined) {
      const rolesValidos = ["admin", "vendedor", "afiliado", "cliente"];
      if (!rolesValidos.includes(data.role)) {
        return NextResponse.json(
          { error: "Role inválido" },
          { status: 400 }
        );
      }
      // Bloqueia self-demotion: se admin tenta tirar próprio role de admin,
      // verifica que existe outro admin no sistema (anti-lockout).
      const supabaseSrv = await createSupabaseServerClient();
      const { data: callerUser } = await supabaseSrv.auth.getUser();
      if (
        callerUser.user &&
        callerUser.user.id === id &&
        data.role !== "admin"
      ) {
        const adminCheck = createSupabaseAdminClient();
        const { count } = await adminCheck
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        if (!count || count <= 1) {
          return NextResponse.json(
            {
              error:
                "Você é o último admin — promova outro usuário antes de mudar seu role",
            },
            { status: 409 }
          );
        }
      }
      update.role = data.role;
    }
    if (data.setor !== undefined) {
      const setoresValidos = ["multimarcas", "loca", "pecas"];
      if (!setoresValidos.includes(data.setor)) {
        return NextResponse.json(
          { error: "Setor inválido" },
          { status: 400 }
        );
      }
      update.setor = data.setor;
    }
    if (data.status !== undefined) {
      const statusValidos = ["ativo", "inativo", "bloqueado"];
      if (!statusValidos.includes(data.status)) {
        return NextResponse.json(
          { error: "Status inválido" },
          { status: 400 }
        );
      }
      update.status = data.status;
    }
    if (Array.isArray(data.permissoes))
      update.permissoes = data.permissoes.filter(
        (p: unknown) => typeof p === "string"
      );
  }

  const admin = createSupabaseAdminClient();
  const { data: updated, error } = await admin
    .from("profiles")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Se admin mudou o role, atualiza user_metadata pra o proxy/middleware ler
  if (auth.callerRole === "admin" && data.role !== undefined) {
    await admin.auth.admin.updateUserById(id, {
      user_metadata: { role: data.role },
    });
    // Audit trail — mudança de role é evento sensível
    emitAuditLog({
      acao: "user.role_change",
      ator: auth.callerId,
      atorNome: auth.callerNome,
      atorRole: "admin",
      alvoTipo: "user",
      alvoId: id,
      alvoLabel: (updated.nome as string) || (updated.email as string) || id,
      estadoNovo: { role: data.role },
    });
  }
  // Auditoria de status_change separada — admin desabilitando/bloqueando
  if (auth.callerRole === "admin" && data.status !== undefined) {
    emitAuditLog({
      acao: "user.status_change",
      ator: auth.callerId,
      atorNome: auth.callerNome,
      atorRole: "admin",
      alvoTipo: "user",
      alvoId: id,
      alvoLabel: (updated.nome as string) || (updated.email as string) || id,
      estadoNovo: { status: data.status },
    });
  }

  return NextResponse.json({ user: { ...updated, _id: updated.id } });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await ensureCallerOrAdmin(id);
  if (!auth.ok) return auth.response;
  if (auth.callerRole !== "admin") {
    return NextResponse.json(
      { error: "Apenas admin pode deletar" },
      { status: 403 }
    );
  }

  // Bloqueia delete se cliente ainda tem aluguel ativo OU venda concluída
  // (dados financeiros vinculados — não pode sumir). Soft-delete via Supabase
  // marca-deleted manual seria melhor, mas por ora só refusamos.
  try {
    const { connectMongo } = await import("@/lib/mongodb");
    await connectMongo();
    const [{ Aluguel }, { Venda }] = await Promise.all([
      import("@/lib/models/aluguel"),
      import("@/lib/models/venda"),
    ]);
    const [temAlug, temVenda] = await Promise.all([
      Aluguel.exists({
        clienteId: id,
        status: { $in: ["ativo", "atrasado"] },
      }),
      Venda.exists({ clienteId: id, status: "concluida" }),
    ]);
    if (temAlug) {
      return NextResponse.json(
        {
          error:
            "Usuário tem aluguel ativo — encerre antes de deletar",
        },
        { status: 409 }
      );
    }
    if (temVenda) {
      return NextResponse.json(
        {
          error:
            "Usuário tem venda concluída registrada — não pode ser deletado",
        },
        { status: 409 }
      );
    }

    // Limpa notificações órfãs do usuário (segurança: notif de cliente
    // deletado não serve mais)
    const { Notification } = await import("@/lib/models/notification");
    await Notification.deleteMany({ destinatarioId: id }).catch(() => {});
  } catch (err) {
    console.error(
      "[users:delete] check fail:",
      err instanceof Error ? err.message : "unknown"
    );
  }

  // Captura snapshot do alvo ANTES do delete pra rastreabilidade
  let alvoLabel = id;
  let alvoRole: string | undefined;
  try {
    const admin = createSupabaseAdminClient();
    const { data: prev } = await admin
      .from("profiles")
      .select("nome,email,role")
      .eq("id", id)
      .single();
    if (prev) {
      alvoLabel = (prev.nome as string) || (prev.email as string) || id;
      alvoRole = prev.role as string | undefined;
    }
  } catch {
    // ignora — snapshot best-effort
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Audit trail — exclusão é evento crítico
  emitAuditLog({
    acao: "user.delete",
    ator: auth.callerId,
    atorNome: auth.callerNome,
    atorRole: "admin",
    alvoTipo: "user",
    alvoId: id,
    alvoLabel,
    estadoAnterior: alvoRole ? { role: alvoRole } : undefined,
  });
  return NextResponse.json({ ok: true });
}
