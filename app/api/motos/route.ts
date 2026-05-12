import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Moto } from "@/lib/models/moto";
import { motoCreateSchema } from "@/lib/schemas";
import { requireRole } from "@/lib/auth/api-guards";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";

// Campos internos que NÃO podem vazar pra callers públicos / cliente.
// valorCompra, valorMinimo, repasse e compra são preço de custo / acordo
// com proprietário — concorrentes não devem ver.
const CAMPOS_PRIVADOS = {
  valorCompra: 0,
  valorMinimo: 0,
  comissao: 0,
  compra: 0,
  repasse: 0,
  // vendedorResponsavel é staff ID — não vaza pra catálogo público
  vendedorResponsavel: 0,
};

export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");
    const status = searchParams.get("status");
    const setor = searchParams.get("setor");
    const search = searchParams.get("q");
    // Por default retornamos só a foto-capa (1 foto). Páginas que precisam
    // de todas as fotos (estoque/[id]) passam ?full=1. Sem isso, listagens
    // de 50+ motos com 5+ fotos base64 cada inflavam o payload pra 50MB+
    // e travavam o catálogo / dashboard.
    const wantFull = searchParams.get("full") === "1";
    // Limite default razoável; máximo de segurança 2000.
    const limitRaw = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), 2000)
        : 500;

    const query: Record<string, unknown> = {};
    if (tipo) query.tipo = tipo;
    if (status) query.status = status;
    if (setor) query.setor = setor;
    if (search) {
      // Escapa metacaracteres (anti-ReDoS) e limita comprimento
      const termo = search.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { marca: { $regex: termo, $options: "i" } },
        { modelo: { $regex: termo, $options: "i" } },
        { placa: { $regex: termo, $options: "i" } },
      ];
    }

    // Caller staff (admin/vendedor) vê tudo. Outros (cliente, anônimo,
    // afiliado) só vê dados públicos.
    const auth = await requireAuth();
    const isStaff =
      auth.ok && (auth.role === "admin" || auth.role === "vendedor");

    // Combina projection privada + slice de fotos
    const projection: Record<string, unknown> = isStaff
      ? {}
      : { ...CAMPOS_PRIVADOS };
    if (!wantFull) projection.fotos = { $slice: 1 };

    const motos = await Moto.find(
      query,
      Object.keys(projection).length ? projection : undefined
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .maxTimeMS(15_000);
    return NextResponse.json({ motos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"]);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const raw = await req.json();
    const parsed = motoCreateSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validação: ${issues}` },
        { status: 400 }
      );
    }

    // Vendedor não escolhe quem é o responsável — sempre vira ele mesmo.
    // Admin pode atribuir a qualquer staff (passou pelo schema).
    if (auth.role === "vendedor") {
      parsed.data.vendedorResponsavel = auth.userId;
    }

    const moto = await Moto.create(parsed.data);
    return NextResponse.json({ moto }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar moto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
