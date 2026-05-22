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

export type StatusParcelaLocacao =
  | "pendente" // ainda não venceu
  | "paga" // confirmada
  | "atrasada"; // venceu e não foi paga (status derivado em runtime, mas
  // pode ser fixado quando admin reconhece)

export interface IParcelaLocacaoDoc {
  numero: number; // 1..N
  vencimento: Date;
  valor: number; // valor desta parcela
  status: StatusParcelaLocacao;
  pagoEm?: Date;
  valorPago?: number; // pode diferir do valor (cliente paga multa+juros)
  multa?: number; // multa cobrada (10% do valor por default)
  juros?: number; // juros acumulados até pagamento
  formaPagamento?: string; // "pix", "dinheiro", "transferencia", "cartao"
  observacao?: string;
  registradoPor?: string; // staff que confirmou
  registradoEm?: Date;
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

  // === LOCAÇÃO PERIÓDICA ===
  // Cliente paga em ciclos (semanal/quinzenal/mensal/personalizada).
  // cicloDias = fonte de verdade (7/15/30/custom). frequenciaParcela = label.
  // `tipoPlano` mantido só pra leitura de docs legados (KEU já não usa
  // Plano Conquista em aluguel — isso é forma de pagamento de VENDA agora).
  /** @deprecated Plano Conquista virou forma de pagamento de venda, não de locação. */
  tipoPlano?: "conquista" | "venda-direta";
  /** @deprecated Plano Conquista. */
  valorEntrada?: number;
  /** @deprecated Plano Conquista. */
  dataEntrada?: Date;
  valorParcela?: number;
  numeroParcelas?: number;
  parcelasPagas?: number;
  frequenciaParcela?: "semanal" | "quinzenal" | "mensal" | "personalizada";
  cicloDias?: number; // 7, 15, 30 ou custom
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

  // === LOCAÇÃO PERIÓDICA — parcelas geradas no momento do cadastro ===
  // Cada parcela é uma cobrança quinzenal/mensal/etc. que vence enquanto
  // o cliente tiver com a moto. Diferente de `parcelasPagas` (contador
  // simples de Plano Conquista legado) — esse array detalha cada cobrança.
  parcelasLocacao?: IParcelaLocacaoDoc[];
  multaPorAtrasoPercent?: number; // default 10%
  jurosDiaPercent?: number; // default 2% ao dia
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

const ParcelaLocacaoSchema = new Schema<IParcelaLocacaoDoc>(
  {
    numero: { type: Number, required: true, min: 1 },
    vencimento: { type: Date, required: true },
    valor: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pendente", "paga", "atrasada"],
      required: true,
      default: "pendente",
    },
    pagoEm: Date,
    valorPago: { type: Number, min: 0 },
    multa: { type: Number, min: 0 },
    juros: { type: Number, min: 0 },
    formaPagamento: String,
    observacao: String,
    registradoPor: String,
    registradoEm: Date,
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

    // Locação periódica — cliente paga em ciclos
    // tipoPlano: legacy. Não usado em novas locações.
    tipoPlano: {
      type: String,
      enum: ["conquista", "venda-direta"],
    },
    valorEntrada: { type: Number, min: 0 },
    dataEntrada: Date,
    valorParcela: { type: Number, min: 0 },
    numeroParcelas: { type: Number, min: 1 },
    parcelasPagas: { type: Number, min: 0, default: 0 },
    frequenciaParcela: {
      type: String,
      enum: ["semanal", "quinzenal", "mensal", "personalizada"],
    },
    cicloDias: { type: Number, min: 1, max: 365 },
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

    // Parcelas detalhadas — uma entrada por cobrança quinzenal/mensal/etc.
    // Usado pra rastrear inadimplência (parcela.vencimento < hoje && status !== "paga").
    parcelasLocacao: { type: [ParcelaLocacaoSchema], default: [] },
    multaPorAtrasoPercent: { type: Number, min: 0, max: 100, default: 10 },
    jurosDiaPercent: { type: Number, min: 0, max: 100, default: 2 },

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
// Inadimplência — busca por parcelas vencidas e não pagas (dashboard cobrança)
AluguelSchema.index({
  "parcelasLocacao.vencimento": 1,
  "parcelasLocacao.status": 1,
});

export const Aluguel: Model<IAluguelDoc> =
  mongoose.models.Aluguel ||
  mongoose.model<IAluguelDoc>("Aluguel", AluguelSchema);
