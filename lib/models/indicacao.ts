import mongoose, { Schema, Model } from "mongoose";

export interface IIndicacaoDoc {
  afiliadoId: mongoose.Types.ObjectId;
  afiliadoCodigo: string;
  motoId?: mongoose.Types.ObjectId;
  motoModelo?: string;
  clienteId?: mongoose.Types.ObjectId;
  clienteNome?: string;
  vendaId?: mongoose.Types.ObjectId;

  // Tracking
  origem: "link" | "qr" | "indicacao-direta";
  utmSource?: string;
  utmCampaign?: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;

  // Funil
  status: "clique" | "lead" | "negociando" | "vendido" | "perdido";

  // Comissão (calculada no fechamento da venda)
  valorVenda?: number;
  valorComissao: number;
  comissaoPaga: boolean;
  pagaEm?: Date;

  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IndicacaoSchema = new Schema<IIndicacaoDoc>(
  {
    afiliadoId: {
      type: Schema.Types.ObjectId,
      ref: "Afiliado",
      required: true,
      index: true,
    },
    afiliadoCodigo: { type: String, required: true, index: true },
    motoId: { type: Schema.Types.ObjectId, ref: "Moto" },
    motoModelo: String,
    clienteId: { type: Schema.Types.ObjectId, ref: "User" },
    clienteNome: String,
    vendaId: { type: Schema.Types.ObjectId, ref: "Venda" },

    origem: {
      type: String,
      enum: ["link", "qr", "indicacao-direta"],
      default: "link",
    },
    utmSource: String,
    utmCampaign: String,
    ip: String,
    userAgent: String,
    referrer: String,

    status: {
      type: String,
      enum: ["clique", "lead", "negociando", "vendido", "perdido"],
      default: "clique",
      index: true,
    },

    valorVenda: Number,
    valorComissao: { type: Number, default: 0 },
    comissaoPaga: { type: Boolean, default: false },
    pagaEm: Date,

    observacoes: String,
  },
  { timestamps: true }
);

export const Indicacao: Model<IIndicacaoDoc> =
  mongoose.models.Indicacao ||
  mongoose.model<IIndicacaoDoc>("Indicacao", IndicacaoSchema);
