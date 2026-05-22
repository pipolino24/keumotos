import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import { Contrato } from "@/lib/models/contrato";
import { requireAuth } from "@/lib/auth/api-guards";

export const dynamic = "force-dynamic";
// React-pdf precisa de Node runtime (não Edge) — APIs do Node.js
export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
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

    const numero = String(contrato._id).slice(-6).toUpperCase();
    const element = React.createElement(ContratoPdf, {
      numero,
      contratante: contrato.contratante,
      avalista: contrato.avalista,
      moto: contrato.moto,
      plano: contrato.plano,
      observacoes: contrato.observacoes,
      dataContrato: contrato.dataContrato,
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
