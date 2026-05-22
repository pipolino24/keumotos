import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Contrato } from "@/lib/models/contrato";
import { requireAuth } from "@/lib/auth/api-guards";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
// React-pdf precisa de Node runtime (não Edge) — APIs do Node.js
export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

// Cache do logo em memória da function instance. Quente entre invocações
// na mesma Lambda — não baixa de novo se for o mesmo deployment.
let _logoCache: string | null = null;

/**
 * Carrega o logo da KEU LOCA MOTOS como data URL. Estratégias em ordem:
 *  1) Cache em memória da function instance
 *  2) Filesystem (dev local — public/logos/...)
 *  3) Fetch HTTP do próprio host (Vercel — public/ é servido pelo CDN
 *     mas NÃO está dentro do bundle das functions)
 *
 * Falha silenciosa em todas as estratégias — se nada funciona, retorna
 * undefined e o PDF sai com texto "KEU LOCA MOTOS" em vez de logo.
 */
async function loadLogo(origin: string): Promise<string | undefined> {
  if (_logoCache) return _logoCache;
  // Tentativa 1: filesystem (dev local)
  try {
    const [fs, path] = await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
    ]);
    const logoPath = path.join(
      process.cwd(),
      "public",
      "logos",
      "keu-loca-motos.webp"
    );
    const buf = await fs.readFile(logoPath);
    _logoCache = `data:image/webp;base64,${buf.toString("base64")}`;
    return _logoCache;
  } catch {
    /* segue pro fallback HTTP */
  }
  // Tentativa 2: fetch do próprio host (Vercel)
  try {
    const res = await fetch(`${origin}/logos/keu-loca-motos.webp`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    _logoCache = `data:image/webp;base64,${buf.toString("base64")}`;
    return _logoCache;
  } catch (e) {
    console.warn(
      "[contrato pdf] logo não carregado:",
      e instanceof Error ? e.message : e
    );
    return undefined;
  }
}

/**
 * GET /api/contratos/[id]/pdf
 *
 * Renderiza o contrato como PDF usando @react-pdf/renderer server-side.
 * Stream do PDF direto na resposta (não persiste em disco).
 *
 * Cliente pode baixar próprio contrato. Staff baixa qualquer um.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  // Rate limit: gerar PDF é CPU-intensivo (~200ms-1s no Vercel). 60/min/user
  // cobre uso humano normal mas trava bot tentando esgotar recursos.
  const rl = rateLimit({
    key: `contratos-pdf:${auth.userId}:${getClientIp(req)}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas requisições de PDF, aguarde 1min" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    await connectMongo();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }
    const contrato = await Contrato.findById(id).lean();
    if (!contrato) {
      return NextResponse.json(
        { error: "Contrato não encontrado" },
        { status: 404 }
      );
    }
    if (
      auth.role === "cliente" &&
      String(contrato.clienteId) !== String(auth.userId)
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Lazy import — só carrega quando o endpoint é chamado, não no warm-up
    const [{ renderToBuffer }, { ContratoPdf }, React] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/contrato/template"),
      import("react"),
    ]);

    // Carrega o logo em paralelo com a renderização — fs local OU fetch HTTP
    // do próprio host (Vercel). Cache em memória entre invocações da function.
    const logoDataUrl = await loadLogo(req.nextUrl.origin);

    const numero = String(contrato._id).slice(-6).toUpperCase();
    const element = React.createElement(ContratoPdf, {
      numero,
      contratante: contrato.contratante,
      avalista: contrato.avalista,
      moto: contrato.moto,
      plano: contrato.plano,
      observacoes: contrato.observacoes,
      dataContrato: contrato.dataContrato,
      logoDataUrl,
    });

    // renderToBuffer espera ReactElement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    const filename = `contrato-keu-${numero}.pdf`;
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gerar PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
