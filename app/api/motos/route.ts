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
    const projection = isStaff ? undefined : CAMPOS_PRIVADOS;

    const motos = await Moto.find(query, projection)
      .sort({ createdAt: -1 })
      .lean();
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
    const moto = await Moto.create(parsed.data);
    return NextResponse.json({ moto }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar moto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
