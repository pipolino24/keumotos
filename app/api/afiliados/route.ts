import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Afiliado } from "@/lib/models/afiliado";
import { User } from "@/lib/models/user";
import { gerarCodigoAfiliadoUnico } from "@/lib/utils-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const aprovado = searchParams.get("aprovado");
    const search = searchParams.get("q");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (aprovado !== null) query.aprovado = aprovado === "true";
    if (search) {
      query.$or = [
        { nome: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { codigo: { $regex: search, $options: "i" } },
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

    // Criar ou reaproveitar User
    let user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      const senhaTmp = data.senha || `keu_${Math.random().toString(36).slice(2, 8)}`;
      const senhaHash = await hashSenha(senhaTmp);
      user = await User.create({
        nome: data.nome,
        email: data.email.toLowerCase(),
        senhaHash,
        telefone: data.telefone,
        role: "afiliado",
        status: data.aprovado ? "ativo" : "pendente",
        cidade: data.cidade,
        estado: data.estado,
      });
    } else {
      // Promove user existente para afiliado se ainda não for
      if (user.role !== "afiliado" && user.role !== "admin") {
        user.role = "afiliado";
        await user.save();
      }
    }

    // Verifica se já é afiliado
    const existente = await Afiliado.findOne({ userId: user._id });
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
      userId: user._id,
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

async function hashSenha(senha: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(senha + ":keumotos_salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
