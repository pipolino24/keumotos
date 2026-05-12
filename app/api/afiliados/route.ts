import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Afiliado } from "@/lib/models/afiliado";
import { gerarCodigoAfiliadoUnico } from "@/lib/utils-server";
import { requireAdmin } from "@/lib/auth/api-guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const aprovado = searchParams.get("aprovado");
    const search = searchParams.get("q");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (aprovado !== null) query.aprovado = aprovado === "true";
    if (search && search.length > 0) {
      // Limita tamanho e escapa metacaracteres de regex (evita ReDoS)
      const termo = search.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { nome: { $regex: termo, $options: "i" } },
        { email: { $regex: termo, $options: "i" } },
        { codigo: { $regex: termo, $options: "i" } },
      ];
    }

    const afiliados = await Afiliado.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ afiliados });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const data = await req.json();

    // Validações básicas
    if (!data.nome?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }
    if (!data.email?.trim()) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Cria ou reaproveita user no Supabase Auth
    const admin = createSupabaseAdminClient();
    // Senha temporária criptograficamente segura (crypto.randomBytes)
    // — Math.random é previsível e não pode ser usado pra credentials.
    const { randomBytes } = await import("node:crypto");
    const senhaTmp =
      data.senha || `Keu@${randomBytes(12).toString("base64url").slice(0, 14)}`;
    let userId: string;
    const created = await admin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: senhaTmp,
      email_confirm: true,
      user_metadata: {
        nome: data.nome,
        role: "afiliado",
        setor: "multimarcas",
      },
    });
    if (created.error) {
      if (created.error.message.toLowerCase().includes("already")) {
        const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
        const existing = list?.users?.find(
          (u) => u.email === data.email.toLowerCase()
        );
        if (!existing) {
          return NextResponse.json(
            { error: "Não foi possível localizar usuário existente" },
            { status: 500 }
          );
        }
        userId = existing.id;
        // Promove pro role "afiliado" se ainda não for admin
        const existingRole = (existing.user_metadata?.role as string) || "cliente";
        if (existingRole !== "afiliado" && existingRole !== "admin") {
          await admin.auth.admin.updateUserById(userId, {
            user_metadata: { ...existing.user_metadata, role: "afiliado" },
          });
          await admin.from("profiles").update({ role: "afiliado" }).eq("id", userId);
        }
      } else {
        return NextResponse.json(
          { error: created.error.message },
          { status: 400 }
        );
      }
    } else if (created.data.user) {
      userId = created.data.user.id;
    } else {
      return NextResponse.json(
        { error: "Falha ao criar usuário" },
        { status: 500 }
      );
    }

    // Verifica se já é afiliado
    const existente = await Afiliado.findOne({ userId });
    if (existente) {
      return NextResponse.json(
        { error: "Usuário já é afiliado", afiliado: existente },
        { status: 409 }
      );
    }

    // Gera código único
    const codigo = await gerarCodigoAfiliadoUnico(data.nome, async (slug) => {
      const found = await Afiliado.findOne({ codigo: slug });
      return !!found;
    });

    const afiliado = await Afiliado.create({
      userId,
      codigo,
      nome: data.nome,
      email: data.email.toLowerCase(),
      telefone: data.telefone,
      avatar: data.avatar,
      bio: data.bio,
      instagram: data.instagram,
      whatsapp: data.whatsapp,
      cidade: data.cidade,
      estado: data.estado,
      tipoComissao: data.tipoComissao ?? "percentual",
      comissaoPercentual: Number(data.comissaoPercentual) || 0,
      comissaoFixa: Number(data.comissaoFixa) || 0,
      valorMinimoVenda: data.valorMinimoVenda
        ? Number(data.valorMinimoVenda)
        : undefined,
      comissaoMaxima: data.comissaoMaxima
        ? Number(data.comissaoMaxima)
        : undefined,
      pixTipo: data.pixTipo,
      pixChave: data.pixChave,
      banco: data.banco,
      agencia: data.agencia,
      conta: data.conta,
      contaTipo: data.contaTipo,
      cpfTitular: data.cpfTitular,
      aprovado: data.aprovado ?? false,
      status: data.status ?? "ativo",
      observacoes: data.observacoes,
    });

    return NextResponse.json({ afiliado }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar afiliado";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

