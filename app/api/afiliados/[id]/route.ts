import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Afiliado } from "@/lib/models/afiliado";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectMongo();
    const { id } = await params;
    const afiliado = await Afiliado.findById(id).lean();
    if (!afiliado) {
      return NextResponse.json(
        { error: "Afiliado não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ afiliado });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await connectMongo();
    const { id } = await params;
    const data = await req.json();

    // Whitelist de campos editáveis
    const update: Record<string, unknown> = {};
    const allowedFields = [
      "nome",
      "telefone",
      "avatar",
      "bio",
      "instagram",
      "whatsapp",
      "cidade",
      "estado",
      "tipoComissao",
      "comissaoPercentual",
      "comissaoFixa",
      "valorMinimoVenda",
      "comissaoMaxima",
      "pixTipo",
      "pixChave",
      "banco",
      "agencia",
      "conta",
      "contaTipo",
      "cpfTitular",
      "status",
      "aprovado",
      "observacoes",
    ];
    for (const field of allowedFields) {
      if (data[field] !== undefined) update[field] = data[field];
    }

    // Coercões numéricas
    if (update.comissaoPercentual !== undefined) {
      update.comissaoPercentual = Number(update.comissaoPercentual) || 0;
    }
    if (update.comissaoFixa !== undefined) {
      update.comissaoFixa = Number(update.comissaoFixa) || 0;
    }
    if (update.valorMinimoVenda !== undefined) {
      update.valorMinimoVenda = update.valorMinimoVenda
        ? Number(update.valorMinimoVenda)
        : undefined;
    }
    if (update.comissaoMaxima !== undefined) {
      update.comissaoMaxima = update.comissaoMaxima
        ? Number(update.comissaoMaxima)
        : undefined;
    }

    // Se está sendo aprovado agora
    if (update.aprovado === true) {
      const current = await Afiliado.findById(id);
      if (current && !current.aprovado) {
        update.aprovadoEm = new Date();
      }
    }

    const afiliado = await Afiliado.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!afiliado) {
      return NextResponse.json(
        { error: "Afiliado não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ afiliado });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao atualizar afiliado";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await connectMongo();
    const { id } = await params;
    const afiliado = await Afiliado.findByIdAndDelete(id).lean();
    if (!afiliado) {
      return NextResponse.json(
        { error: "Afiliado não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao remover afiliado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
