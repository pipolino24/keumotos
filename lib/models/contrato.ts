import mongoose, { Schema, Model } from "mongoose";

/**
 * Contrato gerado pra um aluguel. Mantém SNAPSHOTS dos dados do cliente,
 * moto e plano no momento da geração — assim se a moto for vendida ou o
 * cliente atualizar cadastro, o contrato continua íntegro pra impressão
 * e auditoria futura.
 */

export interface IPessoaSnap {
  nome: string;
  sexo?: string;
  nascimento?: string;
  cnh?: string;
  natural?: string;
  profissao?: string;
  cpf?: string;
  rg?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

export interface IMotoSnap {
  marca: string;
  modelo: string;
  anoModelo?: number;
  cor?: string;
  placa?: string;
  chassi?: string;
  renavam?: string;
  km?: number;
  obs?: string;
}

export interface IPlanoSnap {
  parcelas: number;
  valorEntrada: number;
  valorParcela: number;
  planoEscolhido: string;
  multaPercent: number;
  jurosDiaPercent: number;
  datasVencimento?: string;
  vencimentoPrimeira?: string;
}

export interface IContratoDoc extends mongoose.Document {
  aluguelId?: mongoose.Types.ObjectId;
  motoId?: mongoose.Types.ObjectId;
  clienteId?: string;
  contratante: IPessoaSnap;
  avalista?: IPessoaSnap;
  moto: IMotoSnap;
  plano: IPlanoSnap;
  observacoes?: string;
  dataContrato: Date;
  status: "rascunho" | "ativo" | "assinado" | "rescindido" | "concluido";
  geradoPor?: string;
  geradoPorNome?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pessoaSnap = new Schema<IPessoaSnap>(
  {
    nome: { type: String, required: true },
    sexo: String,
    nascimento: String,
    cnh: String,
    natural: String,
    profissao: String,
    cpf: String,
    rg: String,
    endereco: String,
    telefone: String,
    email: String,
  },
  { _id: false }
);

const motoSnap = new Schema<IMotoSnap>(
  {
    marca: { type: String, required: true },
    modelo: { type: String, required: true },
    anoModelo: Number,
    cor: String,
    placa: String,
    chassi: String,
    renavam: String,
    km: Number,
    obs: String,
  },
  { _id: false }
);

const planoSnap = new Schema<IPlanoSnap>(
  {
    parcelas: { type: Number, required: true },
    valorEntrada: { type: Number, default: 0 },
    valorParcela: { type: Number, required: true },
    planoEscolhido: { type: String, default: "Conquista" },
    multaPercent: { type: Number, default: 10 },
    jurosDiaPercent: { type: Number, default: 2 },
    datasVencimento: String,
    vencimentoPrimeira: String,
  },
  { _id: false }
);

const contratoSchema = new Schema<IContratoDoc>(
  {
    aluguelId: { type: Schema.Types.ObjectId, ref: "Aluguel", index: true },
    motoId: { type: Schema.Types.ObjectId, ref: "Moto", index: true },
    clienteId: { type: String, index: true },
    contratante: { type: pessoaSnap, required: true },
    avalista: pessoaSnap,
    moto: { type: motoSnap, required: true },
    plano: { type: planoSnap, required: true },
    observacoes: String,
    dataContrato: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["rascunho", "ativo", "assinado", "rescindido", "concluido"],
      default: "ativo",
      index: true,
    },
    geradoPor: { type: String, index: true },
    geradoPorNome: String,
  },
  { timestamps: true }
);

contratoSchema.index({ clienteId: 1, createdAt: -1 });
contratoSchema.index({ createdAt: -1 });

export const Contrato: Model<IContratoDoc> =
  mongoose.models.Contrato ||
  mongoose.model<IContratoDoc>("Contrato", contratoSchema);
