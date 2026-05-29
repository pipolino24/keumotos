import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import {
  Emprestimo,
  proximoVencimento,
  recalcularStatus,
  type FrequenciaParcela,
  type IParcelaDoc,
} from "@/lib/models/emprestimo";
import { requireRole } from "@/lib/auth/api-guards";
import { emitAuditLog } from "@/lib/audit/emit";

export const dynamic = "force-dynamic";

const FREQ_VALIDAS = new Set([
  "semanal",
  "quinzenal",
  "mensal",
  "bimestral",
  "trimestral",
  "custom",
]);

/**
 * GET /api/emprestimos
 * Lista empréstimos. Apenas admin pode operar essa feature — não há rateio
 * por vendedor (decisão de produto: empréstimos são do caixa da casa).
 *
 * Query params:
 *   ?status=ativo|quitado|em_atraso|cancelado
 *   ?q=<termo>  (busca em clienteNome/cpf/telefone)
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(["admin"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();

    const filter: Record<string, unknown> = {};
    if (status && ["ativo", "quitado", "em_atraso", "cancelado"].includes(status)) {
      filter.status = status;
    }
    if (q) {
      // Escapa metacaracteres regex pra evitar ReDoS e operator injection
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 80);
      filter.$or = [
        { clienteNome: { $regex: safe, $options: "i" } },
        { clienteCpf: { $regex: safe, $options: "i" } },
        { clienteTelefone: { $regex: safe, $options: "i" } },
      ];
    }

    const items = await Emprestimo.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return NextResponse.json({ emprestimos: items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/emprestimos
 * Cria empréstimo + gera parcelas conforme cronograma.
 *
 * Body esperado:
 * {
 *   clienteId?, clienteNome, clienteTelefone?, clienteEmail?, clienteCpf?,
 *   valorEmprestado: number,
 *   valorTotal: number,
 *   dataEmprestimo?: ISO date (default hoje),
 *   dataPrimeiraParcela: ISO date,
 *   totalParcelas: number,
 *   frequencia: FrequenciaParcela,
 *   intervaloDias?: number  (só se frequencia="custom"),
 *   observacoes?: string
 * }
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(["admin"], req);
  if (!auth.ok) return auth.response;
  try {
    await connectMongo();
    const body = await req.json();

    // Validação básica
    const clienteNome = String(body.clienteNome ?? "").trim();
    if (!clienteNome) {
      return NextResponse.json(
        { error: "Nome do cliente é obrigatório" },
        { status: 400 }
      );
    }
    const valorEmprestado = Number(body.valorEmprestado);
    // Modalidade — "principal-juros" (default, amortiza) ou "so-juros"
    // (cliente paga só os juros mensais, principal continua devendo).
    const modalidade: "principal-juros" | "so-juros" =
      body.modalidade === "so-juros" ? "so-juros" : "principal-juros";
    if (!Number.isFinite(valorEmprestado) || valorEmprestado <= 0) {
      return NextResponse.json(
        { error: "Valor emprestado inválido" },
        { status: 400 }
      );
    }
    let valorTotal = Number(body.valorTotal);
    let jurosPorParcela: number | undefined;
    if (modalidade === "so-juros") {
      // No modo só-juros, o frontend manda `jurosPorParcela` (valor que
      // o cliente paga TODO mês). valorTotal = jurosPorParcela × N (não
      // inclui principal — principal continua devendo, é devolvido em
      // separado quando o cliente quiser quitar).
      jurosPorParcela = Number(body.jurosPorParcela);
      if (!Number.isFinite(jurosPorParcela!) || jurosPorParcela! <= 0) {
        return NextResponse.json(
          { error: "Juros por parcela inválido (modo só juros)" },
          { status: 400 }
        );
      }
      valorTotal = Math.round(jurosPorParcela! * Number(body.totalParcelas) * 100) / 100;
    } else if (!Number.isFinite(valorTotal) || valorTotal < valorEmprestado) {
      return NextResponse.json(
        { error: "Valor total deve ser >= valor emprestado" },
        { status: 400 }
      );
    }
    const totalParcelas = parseInt(String(body.totalParcelas), 10);
    if (!Number.isFinite(totalParcelas) || totalParcelas < 1 || totalParcelas > 120) {
      return NextResponse.json(
        { error: "Total de parcelas deve estar entre 1 e 120" },
        { status: 400 }
      );
    }
    const freq = String(body.frequencia) as FrequenciaParcela;
    if (!FREQ_VALIDAS.has(freq)) {
      return NextResponse.json({ error: "Frequência inválida" }, { status: 400 });
    }
    const intervaloDias =
      freq === "custom" ? parseInt(String(body.intervaloDias), 10) : undefined;
    if (freq === "custom" && (!Number.isFinite(intervaloDias!) || intervaloDias! < 1)) {
      return NextResponse.json(
        { error: "Intervalo em dias inválido pra frequência custom" },
        { status: 400 }
      );
    }
    const dataPrimeira = new Date(body.dataPrimeiraParcela);
    if (Number.isNaN(dataPrimeira.getTime())) {
      return NextResponse.json(
        { error: "Data da primeira parcela inválida" },
        { status: 400 }
      );
    }
    const dataEmprestimo = body.dataEmprestimo
      ? new Date(body.dataEmprestimo)
      : new Date();

    // Cálculos derivados
    // Modo só-juros: "juros" = total de juros que receberá ao longo das N
    // parcelas (não soma principal). Taxa = % por parcela do principal.
    // Modo principal-juros: juros = valorTotal - valorEmprestado (lucro);
    // taxa = juros / principal × 100 (taxa total da operação).
    const juros =
      modalidade === "so-juros"
        ? valorTotal // total de juros recebidos ao longo das parcelas
        : Math.round((valorTotal - valorEmprestado) * 100) / 100;
    const taxa =
      valorEmprestado > 0
        ? Math.round((juros / valorEmprestado) * 10000) / 100
        : 0;
    // Modo só-juros: cada parcela = jurosPorParcela fixo
    // Modo principal-juros: cada parcela = valorTotal / N (arredondando)
    const valorParcela =
      modalidade === "so-juros"
        ? jurosPorParcela!
        : Math.round((valorTotal / totalParcelas) * 100) / 100;

    // Gera array de parcelas
    const parcelas: IParcelaDoc[] = [];
    let venc = new Date(dataPrimeira);
    let acumulado = 0;
    for (let i = 1; i <= totalParcelas; i++) {
      // Modo principal-juros: última parcela absorve erro de arredondamento.
      // Modo só-juros: todas as parcelas valem exatamente jurosPorParcela.
      const v =
        modalidade === "so-juros"
          ? valorParcela
          : i === totalParcelas
            ? Math.round((valorTotal - acumulado) * 100) / 100
            : valorParcela;
      acumulado += v;
      parcelas.push({
        numero: i,
        vencimento: new Date(venc),
        valor: v,
        status: "pendente",
      });
      venc = proximoVencimento(venc, freq, intervaloDias);
    }

    const doc = await Emprestimo.create({
      clienteId: body.clienteId || undefined,
      clienteNome,
      clienteTelefone: body.clienteTelefone || undefined,
      clienteEmail: body.clienteEmail || undefined,
      clienteCpf: body.clienteCpf || undefined,
      valorEmprestado,
      valorTotal,
      juros,
      taxa,
      modalidade,
      jurosPorParcela,
      dataEmprestimo,
      dataPrimeiraParcela: dataPrimeira,
      totalParcelas,
      frequencia: freq,
      intervaloDias,
      parcelas,
      status: "ativo",
      observacoes: body.observacoes || undefined,
      registradoPor: auth.userId,
      registradoPorNome: auth.email,
    });

    // Recalcula status (poderia ser atrasado já se primeira parcela é passada)
    doc.status = recalcularStatus(doc);
    await doc.save();

    emitAuditLog({
      acao: "emprestimo.create",
      ator: auth.userId,
      atorNome: auth.email,
      atorRole: "admin",
      alvoTipo: "emprestimo",
      alvoId: String(doc._id),
      alvoLabel: `${clienteNome} · R$ ${valorEmprestado}`,
      estadoNovo: { valorEmprestado, valorTotal, totalParcelas, frequencia: freq },
    });

    return NextResponse.json({ emprestimo: doc.toObject() }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
