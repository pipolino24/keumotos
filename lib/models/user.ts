import mongoose, { Schema, Model } from "mongoose";

export interface IUserDoc {
  nome: string;
  email: string;
  senhaHash: string;
  telefone: string;
  cpf?: string;
  role: "admin" | "vendedor" | "cliente";
  status: "ativo" | "inativo" | "pendente";
  avatar?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  vendasRealizadas: number;
  comissaoTotal: number;
  ultimoAcesso?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    nome: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    senhaHash: { type: String, required: true },
    telefone: { type: String, required: true },
    cpf: { type: String, sparse: true },
    role: {
      type: String,
      enum: ["admin", "vendedor", "cliente"],
      required: true,
      default: "cliente",
      index: true,
    },
    status: {
      type: String,
      enum: ["ativo", "inativo", "pendente"],
      required: true,
      default: "pendente",
    },
    avatar: String,
    endereco: String,
    cidade: String,
    estado: String,
    vendasRealizadas: { type: Number, default: 0 },
    comissaoTotal: { type: Number, default: 0 },
    ultimoAcesso: Date,
  },
  { timestamps: true }
);

export const User: Model<IUserDoc> =
  mongoose.models.User || mongoose.model<IUserDoc>("User", UserSchema);
