import mongoose, { Schema, Model } from "mongoose";

export interface IRoleDoc {
  nome: string;
  descricao?: string;
  cor?: string;
  permissoes: string[];
  ativo: boolean;
  sistema: boolean;
  criadoPor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRoleDoc>(
  {
    nome: { type: String, required: true, trim: true, unique: true, index: true },
    descricao: { type: String, trim: true },
    cor: { type: String, default: "#dc1f1f" },
    permissoes: { type: [String], default: [] },
    ativo: { type: Boolean, default: true },
    sistema: { type: Boolean, default: false },
    criadoPor: String,
  },
  { timestamps: true }
);

export const Role: Model<IRoleDoc> =
  mongoose.models.Role || mongoose.model<IRoleDoc>("Role", RoleSchema);
