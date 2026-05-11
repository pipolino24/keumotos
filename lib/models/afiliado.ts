import mongoose, { Schema, Model } from "mongoose";

export interface IAfiliadoDoc {
  // Vínculo com User
  userId: mongoose.Types.ObjectId;

  // Identidade pública
  codigo: string; // slug único, ex: "joao-silva-keu"
  nome: string; // cache do nome do user (perf)
  email: string;
  telefone: string;
  avatar?: string;
  bio?: string;

  // Redes sociais
  instagram?: string;
  whatsapp?: string;
  cidade?: string;
  estado?: string;

  // Comissionamento (configurável a qualquer momento pelo admin)
  tipoComissao: "percentual" | "fixo";
  comissaoPercentual: number; // ex: 3 (= 3%)
  comissaoFixa: number; // ex: 200 (= R$200)
  valorMinimoVenda?: number; // venda só vira comissão acima desse valor
  comissaoMaxima?: number; // teto da comissão (ex: R$ 2000)

  // Pagamento
  pixTipo?: "cpf" | "email" | "telefone" | "aleatoria";
  pixChave?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  contaTipo?: "corrente" | "poupanca";
  cpfTitular?: string;

  // Status
  status: "ativo" | "pausado" | "bloqueado";
  aprovado: boolean;
  aprovadoPor?: string;
  aprovadoEm?: Date;

  // Estatísticas (denormalizadas para perf)
  totalCliques: number;
  totalIndicacoes: number;
  totalVendas: number;
  comissaoAcumulada: number; // total pendente + pago
  comissaoPaga: number;
  comissaoPendente: number;

  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AfiliadoSchema = new Schema<IAfiliadoDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    codigo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    nome: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    telefone: { type: String, required: true },
    avatar: String,
    bio: String,

    instagram: String,
    whatsapp: String,
    cidade: String,
    estado: String,

    tipoComissao: {
      type: String,
      enum: ["percentual", "fixo"],
      required: true,
      default: "percentual",
    },
    comissaoPercentual: { type: Number, default: 0, min: 0, max: 100 },
    comissaoFixa: { type: Number, default: 0, min: 0 },
    valorMinimoVenda: Number,
    comissaoMaxima: Number,

    pixTipo: { type: String, enum: ["cpf", "email", "telefone", "aleatoria"] },
    pixChave: String,
    banco: String,
    agencia: String,
    conta: String,
    contaTipo: { type: String, enum: ["corrente", "poupanca"] },
    cpfTitular: String,

    status: {
      type: String,
      enum: ["ativo", "pausado", "bloqueado"],
      default: "ativo",
      index: true,
    },
    aprovado: { type: Boolean, default: false },
    aprovadoPor: String,
    aprovadoEm: Date,

    totalCliques: { type: Number, default: 0 },
    totalIndicacoes: { type: Number, default: 0 },
    totalVendas: { type: Number, default: 0 },
    comissaoAcumulada: { type: Number, default: 0 },
    comissaoPaga: { type: Number, default: 0 },
    comissaoPendente: { type: Number, default: 0 },

    observacoes: String,
  },
  { timestamps: true }
);

export const Afiliado: Model<IAfiliadoDoc> =
  mongoose.models.Afiliado ||
  mongoose.model<IAfiliadoDoc>("Afiliado", AfiliadoSchema);
