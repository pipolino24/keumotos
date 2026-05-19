import mongoose, { Schema, Model } from "mongoose";

export interface IItemPecaDoc {
  nome: string;
  quantidade: number;
  valorUnitario: number;
}

export interface IRevisaoDoc {
  motoId: mongoose.Types.ObjectId;
  data: Date;

  tipo: "revisao" | "manutencao" | "troca-peca" | "reparo-avaria" | "outro";
  descricao: string;

  // Itens trocados/serviços
  pecas: IItemPecaDoc[];
  servicos: { descricao: string; valor: number }[];

  custoTotal: number;
  kmNaRevisao: number;

  responsavel?: string; // mecânico
  notaFiscal?: string;
  fotos: string[];
  observacoes?: string;

  // Para vincular com aluguel ou avaria (se foi por causa de uma devolução)
  aluguelOrigemId?: mongoose.Types.ObjectId;
  avariaOrigemId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ItemPecaSchema = new Schema<IItemPecaDoc>(
  {
    nome: { type: String, required: true },
    quantidade: { type: Number, required: true, min: 1, default: 1 },
    valorUnitario: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const RevisaoSchema = new Schema<IRevisaoDoc>(
  {
    motoId: {
      type: Schema.Types.ObjectId,
      ref: "Moto",
      required: true,
      index: true,
    },
    data: { type: Date, required: true, default: Date.now, index: true },

    tipo: {
      type: String,
      enum: ["revisao", "manutencao", "troca-peca", "reparo-avaria", "outro"],
      required: true,
      default: "revisao",
    },
    descricao: { type: String, required: true },

    pecas: { type: [ItemPecaSchema], default: [] },
    servicos: {
      type: [
        new Schema(
          {
            descricao: { type: String, required: true },
            valor: { type: Number, required: true, min: 0 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    custoTotal: { type: Number, required: true, min: 0, default: 0 },
    kmNaRevisao: { type: Number, required: true, min: 0 },

    responsavel: String,
    notaFiscal: String,
    fotos: { type: [String], default: [] },
    observacoes: String,

    aluguelOrigemId: { type: Schema.Types.ObjectId, ref: "Aluguel" },
    avariaOrigemId: String,
  },
  { timestamps: true }
);

// Compound: histórico da moto ordenado por data (usado em /api/motos/[id]/historico)
RevisaoSchema.index({ motoId: 1, data: -1 });

export const Revisao: Model<IRevisaoDoc> =
  mongoose.models.Revisao ||
  mongoose.model<IRevisaoDoc>("Revisao", RevisaoSchema);
