import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/lib/models/user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query, { senhaHash: 0 })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    const data = await req.json();

    if (!data.senha || data.senha.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    const { senha, ...rest } = data;
    const senhaHash = await hashSenha(senha);

    const user = await User.create({ ...rest, senhaHash });
    const safeUser = user.toObject();
    delete (safeUser as Partial<typeof safeUser>).senhaHash;

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar usuário";
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
