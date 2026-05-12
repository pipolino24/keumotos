import mongoose, { Schema, Model } from "mongoose";

export interface IAvariaDoc {
  descricao: string;
  fotos: string[];
  custoEstimado?: number;
  cobradoCaucao?: boolean;
  reparado?: boolean;
  dataReparo?: Date;
  registradoEm: Date;
}

export interface IAluguelDoc {
  motoId: mongoose.Types.ObjectId;
  motoModelo: string;
  motoMarca?: string;
  motoAno?: number;

  clienteId?: string; // UUID Supabase (ou ObjectId legacy)
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  clienteCpf?: string;

  vendedorId?: string;
  vendedorNome?: string;

  dataInicio: Date;
  dataFim: Date;
  // `dataConclusao` é o nome novo (Plano Conquista — moto vira do cliente
  // ao fim do contrato). `dataDevolucao` mantido como alias legado pra
  // compatibilidade com dados antigos; lemos ambos.
  dataConclusao?: Date;
  dataDevolucao?: Date;

  // === PLANO CONQUISTA / VENDA DIRETA ===
  // No Plano Conquista, cliente paga entrada + parcelas QUINZENAIS;
  // ao final do contrato a moto fica com ele (não há devolução nem caução).
  tipoPlano?: "conquista" | "venda-direta";
  valorEntrada?: number;
  dataEntrada?: Date;
  valorParcela?: number;
  numeroParcelas?: number;
  parcelasPagas?: number;
  frequenciaParcela?: "quinzenal" | "mensal";
  proximaParcelaEm?: Date;

  valorDiariaUsada?: number;
  valorSemanalUsada?: number;
  valorMensalUsada?: number;
  modalidadeAplicada?: "diaria" | "semanal" | "mensal";
  diasContratados: number;
  valorTotal: number;
  /** @deprecated — KEU não trabalha mais com caução. Mantido pra leitura
   *  de docs legados. */
  caucao: number;

  km_inicial: number;
  km_final?: number;

  // Vistoria visual
  fotosInicio: string[]; // fotos no momento da retirada
  fotosFim: string[]; // fotos na devolução
  observacoesInicio?: string; // estado da moto na entrega
  observacoesFim?: string; // observações na devolução

  // Ocorrências durante o aluguel
  avarias: IAvariaDoc[];
  custoTotalAvarias?: number;
  valorAReceberCaucao?: number; // caução − descontos
  multaAtraso?: number;

  status: "ativo" | "concluido" | "atrasado" | "cancelado";
  observacoes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const AvariaSchema = new Schema<IAvariaDoc>(
  {
    descricao: { type: String, required: true },
    fotos: { type: [String], default: [] },
    custoEstimado: { type: Number, min: 0 },
    cobradoCaucao: { type: Boolean, default: false },
    reparado: { type: Boolean, default: false },
    dataReparo: Date,
    registradoEm: { type: Date, default: Date.now },
  },
  { _id: true }
);

const AluguelSchema = new Schema<IAluguelDoc>(
  {
    motoId: {
      type: Schema.Types.ObjectId,
      ref: "Moto",
      required: true,
      index: true,
    },
    motoModelo: { type: String, required: true },
    motoMarca: String,
    motoAno: Number,

    clienteId: { type: String, index: true },
    clienteNome: { type: String, required: true },
    clienteTelefone: String,
    clienteEmail: String,
    clienteCpf: String,

    vendedorId: String,
    vendedorNome: String,

    dataInicio: { type: Date, required: true, index: true },
    dataFim: { type: Date, required: true },
    dataConclusao: Date,
    dataDevolucao: Date,

    // Plano Conquista (default) — entrada + parcelas quinzenais
    tipoPlano: {
      type: String,
      enum: ["conquista", "venda-direta"],
      default: "conquista",
    },
    valorEntrada: { type: Number, min: 0 },
    dataEntrada: Date,
    valorParcela: { type: Number, min: 0 },
    numeroParcelas: { type: Number, min: 1 },
    parcelasPagas: { type: Number, min: 0, default: 0 },
    frequenciaParcela: {
      type: String,
      enum: ["quinzenal", "mensal"],
      default: "quinzenal",
    },
    proximaParcelaEm: Date,

    valorDiariaUsada: Number,
    valorSemanalUsada: Number,
    valorMensalUsada: Number,
    modalidadeAplicada: {
      type: String,
      enum: ["diaria", "semanal", "mensal"],
    },
    diasContratados: { type: Number, required: true, min: 1 },
    valorTotal: { type: Number, required: true, min: 0 },
    // Mantido por compat com docs antigos. Não exigido nem usado.
    caucao: { type: Number, min: 0, default: 0 },

    km_inicial: { type: Number, required: true, min: 0 },
    km_final: { type: Number, min: 0 },

    fotosInicio: { type: [String], default: [] },
    fotosFim: { type: [String], default: [] },
    observacoesInicio: String,
    observacoesFim: String,

    avarias: { type: [AvariaSchema], default: [] },
    custoTotalAvarias: { type: Number, min: 0, default: 0 },
    valorAReceberCaucao: { type: Number, min: 0 },
    multaAtraso: { type: Number, min: 0, default: 0 },

    status: {
      type: String,
      enum: ["ativo", "concluido", "atrasado", "cancelado"],
      required: true,
      default: "ativo",
      index: true,
    },
    observacoes: String,
  },
  { timestamps: true }
);

// Índices compostos para as queries mais comuns (dashboard cliente/vendedor)
AluguelSchema.index({ clienteId: 1, status: 1 });
AluguelSchema.index({ vendedorId: 1, status: 1 });
AluguelSchema.index({ status: 1, dataFim: 1 }); // para detectar atrasos

export const Aluguel: Model<IAluguelDoc> =
  mongoose.models.Aluguel ||
  mongoose.model<IAluguelDoc>("Aluguel", AluguelSchema);
