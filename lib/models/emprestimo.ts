import mongoose, { Schema, Model } from "mongoose";

/**
 * Frequência das parcelas de um empréstimo. "custom" usa `intervaloDias`
 * pra qualquer cadência (3 dias, 45 dias, etc.).
 */
export type FrequenciaParcela =
  | "semanal" // 7 dias
  | "quinzenal" // 15 dias
  | "mensal" // 30 dias
  | "bimestral" // 60 dias
  | "trimestral" // 90 dias
  | "custom";

export type StatusEmprestimo =
  | "ativo" // tem parcelas em aberto
  | "quitado" // todas as parcelas pagas
  | "em_atraso" // tem ao menos 1 parcela vencida não paga
  | "cancelado"; // anulado pelo admin

export type StatusParcela =
  | "pendente" // ainda não venceu
  | "paga" // confirmada como recebida
  | "atrasada" // venceu e não foi paga
  | "postergada"; // remarcada pra frente

export interface IParcelaDoc {
  numero: number; // 1..N
  vencimento: Date;
  vencimentoOriginal?: Date; // preserva data antes de postergar
  valor: number;
  status: StatusParcela;
  pagoEm?: Date;
  valorPago?: number; // pode diferir do valor (pagamento parcial / juros extra)
  observacao?: string;
  registradoPor?: string; // userId quem confirmou
}

export interface IEmprestimoDoc {
  // CLIENTE — embedded (não há tabela Cliente isolada; cliente é derivado
  // de Interesse/Venda/Aluguel/Emprestimo na agregação /api/clientes).
  clienteId?: string; // ObjectId/UUID legado se selecionou existente
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  clienteCpf?: string;

  // VALORES
  valorEmprestado: number; // principal
  valorTotal: number; // o que cliente deve pagar (principal + juros)
  juros: number; // valorTotal - valorEmprestado (denormalizado)
  taxa: number; // % do principal (juros / valorEmprestado * 100)

  // CRONOGRAMA
  dataEmprestimo: Date; // quando o dinheiro saiu
  dataPrimeiraParcela: Date;
  totalParcelas: number;
  frequencia: FrequenciaParcela;
  intervaloDias?: number; // só quando frequencia="custom"

  // PARCELAS (geradas no momento do create, podem ser remarcadas)
  parcelas: IParcelaDoc[];

  // METADATA
  status: StatusEmprestimo;
  observacoes?: string;
  registradoPor: string; // userId admin que criou
  registradoPorNome?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ParcelaSchema = new Schema<IParcelaDoc>(
  {
    numero: { type: Number, required: true },
    vencimento: { type: Date, required: true },
    vencimentoOriginal: Date,
    valor: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pendente", "paga", "atrasada", "postergada"],
      default: "pendente",
      required: true,
    },
    pagoEm: Date,
    valorPago: Number,
    observacao: String,
    registradoPor: String,
  },
  { _id: false }
);

const EmprestimoSchema = new Schema<IEmprestimoDoc>(
  {
    clienteId: String,
    clienteNome: { type: String, required: true, trim: true },
    clienteTelefone: String,
    clienteEmail: String,
    clienteCpf: String,

    valorEmprestado: { type: Number, required: true, min: 0 },
    valorTotal: { type: Number, required: true, min: 0 },
    juros: { type: Number, required: true, min: 0 },
    taxa: { type: Number, required: true, min: 0 },

    dataEmprestimo: { type: Date, required: true, default: () => new Date() },
    dataPrimeiraParcela: { type: Date, required: true },
    totalParcelas: { type: Number, required: true, min: 1 },
    frequencia: {
      type: String,
      enum: ["semanal", "quinzenal", "mensal", "bimestral", "trimestral", "custom"],
      required: true,
    },
    intervaloDias: Number,

    parcelas: { type: [ParcelaSchema], default: [] },

    status: {
      type: String,
      enum: ["ativo", "quitado", "em_atraso", "cancelado"],
      default: "ativo",
      required: true,
    },
    observacoes: String,
    registradoPor: { type: String, required: true },
    registradoPorNome: String,
  },
  { timestamps: true, collection: "emprestimos" }
);

// Indexes pra queries comuns
EmprestimoSchema.index({ status: 1, createdAt: -1 });
EmprestimoSchema.index({ clienteCpf: 1 });
EmprestimoSchema.index({ clienteId: 1 });
EmprestimoSchema.index({ "parcelas.vencimento": 1, "parcelas.status": 1 });

/**
 * Recalcula o status do empréstimo a partir do estado das parcelas.
 * Chame sempre depois de mudar uma parcela.
 */
export function recalcularStatus(doc: IEmprestimoDoc): StatusEmprestimo {
  if (doc.status === "cancelado") return "cancelado";
  const todasPagas = doc.parcelas.every((p) => p.status === "paga");
  if (todasPagas) return "quitado";
  const hoje = new Date();
  const temAtrasada = doc.parcelas.some(
    (p) => p.status !== "paga" && p.vencimento < hoje
  );
  if (temAtrasada) return "em_atraso";
  return "ativo";
}

/**
 * Calcula a próxima data de vencimento a partir de uma data base e a
 * frequência. Usa `intervaloDias` quando frequencia="custom".
 */
export function proximoVencimento(
  base: Date,
  freq: FrequenciaParcela,
  intervaloDias?: number
): Date {
  const days =
    freq === "semanal"
      ? 7
      : freq === "quinzenal"
        ? 15
        : freq === "mensal"
          ? 30
          : freq === "bimestral"
            ? 60
            : freq === "trimestral"
              ? 90
              : (intervaloDias ?? 30);
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export const Emprestimo: Model<IEmprestimoDoc> =
  (mongoose.models.Emprestimo as Model<IEmprestimoDoc>) ||
  mongoose.model<IEmprestimoDoc>("Emprestimo", EmprestimoSchema);
