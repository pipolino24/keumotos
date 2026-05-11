import mongoose, { Schema, Model } from "mongoose";

export interface IProprietarioDoc {
  nome: string;
  cpf: string;
  rg?: string;
  cnh?: string;
  dataNascimento?: Date;
  email?: string;
  telefone: string;
  whatsapp?: string;

  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;

  pixTipo?: "cpf" | "email" | "telefone" | "aleatoria";
  pixChave?: string;
  banco?: string;
  agencia?: string;
  conta?: string;

  fotoPessoal?: string;
  fotoCnh?: string;
  fotoComprovanteResidencia?: string;
  fotoDocMoto?: string;

  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProprietarioSchema = new Schema<IProprietarioDoc>(
  {
    nome: { type: String, required: true, trim: true },
    cpf: { type: String, required: true, unique: true, index: true },
    rg: String,
    cnh: String,
    dataNascimento: Date,
    email: { type: String, lowercase: true, trim: true },
    telefone: { type: String, required: true },
    whatsapp: String,
    cep: String,
    endereco: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
    pixTipo: { type: String, enum: ["cpf", "email", "telefone", "aleatoria"] },
    pixChave: String,
    banco: String,
    agencia: String,
    conta: String,
    fotoPessoal: String,
    fotoCnh: String,
    fotoComprovanteResidencia: String,
    fotoDocMoto: String,
    observacoes: String,
  },
  { timestamps: true }
);

export const Proprietario: Model<IProprietarioDoc> =
  mongoose.models.Proprietario ||
  mongoose.model<IProprietarioDoc>("Proprietario", ProprietarioSchema);
