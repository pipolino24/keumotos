import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  return { ok: true as const, callerRole: role };
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

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
