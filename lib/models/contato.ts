import mongoose, { Schema, Model } from "mongoose";

export interface IContatoDoc {
  nome: string;
  telefone: string;
  email?: string;
  origem: "site" | "instagram" | "whatsapp" | "presencial" | "indicacao";
  interesse: "compra" | "venda" | "troca" | "aluguel" | "pecas" | "outro";
  motoInteresse?: string;
  observacoes?: string;
  status: "novo" | "em-atendimento" | "convertido" | "perdido";
  vendedorResponsavel?: string;
  ultimoContato?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContatoSchema = new Schema<IContatoDoc>(
  {
    nome: { type: String, required: true, trim: true },
    telefone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    origem: {
      type: String,
      enum: ["site", "instagram", "whatsapp", "presencial", "indicacao"],
      required: true,
    },
    interesse: {
      type: String,
      enum: ["compra", "venda", "troca", "aluguel", "pecas", "outro"],
      required: true,
    },
    motoInteresse: String,
    observacoes: String,
    status: {
      type: String,
      enum: ["novo", "em-atendimento", "convertido", "perdido"],
      required: true,
      default: "novo",
      index: true,
    },
    vendedorResponsavel: String,
    ultimoContato: Date,
  },
  { timestamps: true }
);

// Compound: lista filtrada por status, ordenada por mais recente
ContatoSchema.index({ status: 1, createdAt: -1 });
// Pool de leads sem dono ordenados por última atividade
ContatoSchema.index({ vendedorResponsavel: 1, ultimoContato: -1 });

export const Contato: Model<IContatoDoc> =
  mongoose.models.Contato ||
  mongoose.model<IContatoDoc>("Contato", ContatoSchema);
