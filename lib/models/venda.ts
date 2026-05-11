import mongoose, { Schema, Model } from "mongoose";

export interface IVendaDoc {
  motoId: mongoose.Types.ObjectId;
  motoModelo: string; // cache: "Marca Modelo Ano"
  motoMarca?: string;
  motoAno?: number;
  motoValorAnunciado?: number;
  motoValorMinimo?: number;

  clienteId?: mongoose.Types.ObjectId;
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  clienteCpf?: string;

  vendedorId: string; // pode ser id mock ou ObjectId em formato string
  vendedorNome: string;

  valorVendido: number;
  formaPagamento: "a-vista" | "financiado" | "cartao" | "consorcio" | "troca";
  parcelas?: number;
  comissao: number;

  status: "pendente" | "concluida" | "cancelada";
  data: Date;
  observacoes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const VendaSchema = new Schema<IVendaDoc>(
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
    motoValorAnunciado: Number,
    motoValorMinimo: Number,

    clienteId: { type: Schema.Types.ObjectId, ref: "User" },
    clienteNome: { type: String, required: true },
    clienteTelefone: String,
    clienteEmail: String,
    clienteCpf: String,

    vendedorId: { type: String, required: true, index: true },
    vendedorNome: { type: String, required: true },

    valorVendido: { type: Number, required: true, min: 0 },
    formaPagamento: {
      type: String,
      enum: ["a-vista", "financiado", "cartao", "consorcio", "troca"],
      required: true,
    },
    parcelas: { type: Number, min: 1 },
    comissao: { type: Number, required: true, min: 0, default: 0 },

    status: {
      type: String,
      enum: ["pendente", "concluida", "cancelada"],
      required: true,
      default: "concluida",
      index: true,
    },
    data: { type: Date, required: true, default: Date.now, index: true },
    observacoes: String,
  },
  { timestamps: true }
);

export const Venda: Model<IVendaDoc> =
  mongoose.models.Venda || mongoose.model<IVendaDoc>("Venda", VendaSchema);
