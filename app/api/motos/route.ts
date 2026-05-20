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

const PAGE_SIZE_DEFAULT = 12;

export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");
    const status = searchParams.get("status");
    const setor = searchParams.get("setor");
    const search = searchParams.get("q");
    // Filtros adicionais do catálogo (web + app iOS)
    const marca = searchParams.get("marca");
    const precoMin = searchParams.get("precoMin");
    const precoMax = searchParams.get("precoMax");
    const anoMin = searchParams.get("anoMin");
    const anoMax = searchParams.get("anoMax");
    const sortKey = searchParams.get("sort");
    const pageRaw = searchParams.get("page");
    // Por default retornamos só a foto-capa (1 foto). Páginas que precisam
    // de todas as fotos (estoque/[id]) passam ?full=1. Sem isso, listagens
    // de 50+ motos com 5+ fotos base64 cada inflavam o payload pra 50MB+
    // e travavam o catálogo / dashboard.
    const wantFull = searchParams.get("full") === "1";
    const limitRaw = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(Math.floor(limitRaw), 2000)
        : pageRaw ? PAGE_SIZE_DEFAULT : 500;

    const query: Record<string, unknown> = {};
    if (tipo) {
      // tipo "venda"/"aluguel" também incluem "ambos"
      if (tipo === "venda") query.tipo = { $in: ["venda", "ambos"] };
      else if (tipo === "aluguel") query.tipo = { $in: ["aluguel", "ambos"] };
      else query.tipo = tipo;
    }
    if (status) query.status = status;
    if (setor) query.setor = setor;
    if (search) {
      const termo = search.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { marca: { $regex: termo, $options: "i" } },
        { modelo: { $regex: termo, $options: "i" } },
        { placa: { $regex: termo, $options: "i" } },
      ];
    }
    if (marca) {
      query.marca = { $regex: `^${marca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
    }
    const precoFilter: Record<string, number> = {};
    if (precoMin) {
      const v = parseFloat(precoMin);
      if (Number.isFinite(v)) precoFilter.$gte = v;
    }
    if (precoMax) {
      const v = parseFloat(precoMax);
      if (Number.isFinite(v)) precoFilter.$lte = v;
    }
    if (Object.keys(precoFilter).length) query.valorAnunciado = precoFilter;

    const anoFilter: Record<string, number> = {};
    if (anoMin) {
      const v = parseInt(anoMin, 10);
      if (Number.isFinite(v)) anoFilter.$gte = v;
    }
    if (anoMax) {
      const v = parseInt(anoMax, 10);
      if (Number.isFinite(v)) anoFilter.$lte = v;
    }
    if (Object.keys(anoFilter).length) query.anoModelo = anoFilter;

    // Caller staff (admin/vendedor) vê tudo. Outros (cliente, anônimo,
    // afiliado) só vê dados públicos.
    const auth = await requireAuth(req);
    const isStaff =
      auth.ok && (auth.role === "admin" || auth.role === "vendedor");

    const projection: Record<string, unknown> = isStaff
      ? {}
      : { ...CAMPOS_PRIVADOS };
    if (!wantFull) projection.fotos = { $slice: 1 };

    let sort: Record<string, 1 | -1> = { destaque: -1, createdAt: -1 };
    switch (sortKey) {
      case "preco-asc": sort = { valorAnunciado: 1 }; break;
      case "preco-desc": sort = { valorAnunciado: -1 }; break;
      case "ano-desc": sort = { anoModelo: -1 }; break;
      case "km-asc": sort = { km: 1 }; break;
    }

    // Modo paginado: page=N → retorna { motos, total, marcas }
    if (pageRaw) {
      const page = Math.max(1, parseInt(pageRaw, 10) || 1);
      const skip = (page - 1) * limit;
      const [motos, total, marcas] = await Promise.all([
        Moto.find(
          query,
          Object.keys(projection).length ? projection : undefined
        )
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
          .maxTimeMS(15_000),
        Moto.countDocuments(query).maxTimeMS(15_000),
        Moto.distinct("marca", { status: "disponivel" }),
      ]);
      return NextResponse.json({
        motos,
        total,
        marcas: (marcas as string[]).filter(Boolean).sort(),
      });
    }

    const motos = await Moto.find(
      query,
      Object.keys(projection).length ? projection : undefined
    )
      .sort(sort)
      .limit(limit)
      .lean()
      .maxTimeMS(15_000);
    // Catálogo público (não-staff): pode CDN-cachear curtamente — venda nova
    // demora 30s pra refletir. Staff: tira o cache pra ver estoque atualizado
    // imediato (auth ainda checa no PATCH/POST).
    const cacheHeader = isStaff
      ? "private, no-store"
      : "public, s-maxage=30, stale-while-revalidate=120";
    return NextResponse.json(
      { motos },
      { headers: { "Cache-Control": cacheHeader } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(["admin", "vendedor"], req);
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

    // Check unicidade: 2 motos não podem ter a mesma placa/chassi/renavam.
    // Sem isso, staff descuidado duplica registro do mesmo veículo e
    // confunde estoque + vendas. Schema não tem unique index pra deixar
    // placa opcional (motos em transferência).
    const placa = parsed.data.placa?.trim().toUpperCase();
    const chassi = parsed.data.chassi?.trim().toUpperCase();
    const renavam = parsed.data.renavam?.trim();
    if (placa) {
      const existe = await Moto.exists({
        placa: { $regex: `^${placa}$`, $options: "i" },
      });
      if (existe) {
        return NextResponse.json(
          { error: `Placa ${placa} já cadastrada em outra moto` },
          { status: 409 }
        );
      }
    }
    if (chassi) {
      const existe = await Moto.exists({
        chassi: { $regex: `^${chassi}$`, $options: "i" },
      });
      if (existe) {
        return NextResponse.json(
          { error: `Chassi ${chassi} já cadastrado em outra moto` },
          { status: 409 }
        );
      }
    }
    if (renavam) {
      const existe = await Moto.exists({ renavam });
      if (existe) {
        return NextResponse.json(
          { error: `RENAVAM ${renavam} já cadastrado em outra moto` },
          { status: 409 }
        );
      }
    }

    // Pool compartilhado: motos não têm vendedor responsável específico.
    // Qualquer staff cuida de qualquer moto.

    // Normaliza placa/chassi pra UPPERCASE antes de salvar — garante
    // que busca case-insensitive futura e display ficam consistentes.
    const dataPraSalvar: Record<string, unknown> = { ...parsed.data };
    if (placa) dataPraSalvar.placa = placa;
    if (chassi) dataPraSalvar.chassi = chassi;
    if (renavam) dataPraSalvar.renavam = renavam;

    const moto = await Moto.create(dataPraSalvar);
    return NextResponse.json({ moto }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar moto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
