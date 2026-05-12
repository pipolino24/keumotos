import mongoose, { Schema, Model } from "mongoose";

/**
 * Interesse / View Event — registra TODA interação relevante de um cliente
 * com uma moto: visualizou detalhe, simulou financiamento, marcou favorito,
 * enviou lead, solicitou aluguel.
 *
 * Cada interesse vira potencialmente uma Notification para vendedor/admin.
 *
 * Anônimos (sem clienteId) só são logados pra moto.viewCount (cards
 * populares); identificados ficam visíveis pra staff como "leads quentes".
 */
export type TipoInteresse =
  | "visualizou"
  | "simulou_financiamento"
  | "enviou_lead"
  | "solicitou_aluguel"
  | "solicitou_compra"
  | "favoritou"
  | "agendar_visita";

export interface IInteresseDoc {
  // Quem (opcional pra visualizações anônimas)
  clienteId?: string; // UUID Supabase
  clienteNome?: string;
  clienteTelefone?: string;
  clienteEmail?: string;

  // Sobre o quê
  motoId: mongoose.Types.ObjectId;
  motoModelo: string;
  motoMarca?: string;
  motoValor?: number;

  tipo: TipoInteresse;

  // Detalhes específicos por tipo
  simulacao?: {
    entrada: number;
    parcelas: number;
    taxa: number;
    valorParcela: number;
  };
  mensagem?: string;

  // Tracking
  origem?: "site" | "instagram" | "whatsapp" | "afiliado";
  afiliadoCodigo?: string;
  ip?: string;
  userAgent?: string;

  // Atendimento
  vendedorAtendeu?: string; // userId
  atendidoEm?: Date;
  resultado?: "convertido" | "perdido" | "em-atendimento";

  createdAt: Date;
  updatedAt: Date;
}

const InteresseSchema = new Schema<IInteresseDoc>(
  {
    clienteId: { type: String, index: true },
    clienteNome: String,
    clienteTelefone: String,
    clienteEmail: String,

    motoId: {
      type: Schema.Types.ObjectId,
      ref: "Moto",
      required: true,
      index: true,
    },
    motoModelo: { type: String, required: true },
    motoMarca: String,
    motoValor: Number,

    tipo: {
      type: String,
      enum: [
        "visualizou",
        "simulou_financiamento",
        "enviou_lead",
        "solicitou_aluguel",
        "solicitou_compra",
        "favoritou",
        "agendar_visita",
      ],
      required: true,
      index: true,
    },

    simulacao: {
      entrada: Number,
      parcelas: Number,
      taxa: Number,
      valorParcela: Number,
    },
    mensagem: String,

    origem: {
      type: String,
      enum: ["site", "instagram", "whatsapp", "afiliado"],
    },
    afiliadoCodigo: String,
    ip: String,
    userAgent: String,

    vendedorAtendeu: String,
    atendidoEm: Date,
    resultado: {
      type: String,
      enum: ["convertido", "perdido", "em-atendimento"],
    },
  },
  { timestamps: true }
);

// Queries comuns
InteresseSchema.index({ clienteId: 1, createdAt: -1 });
InteresseSchema.index({ motoId: 1, tipo: 1 });
InteresseSchema.index({ resultado: 1, createdAt: -1 });
// Para detectar "interesse quente": vários interesses do mesmo cliente
InteresseSchema.index({ clienteId: 1, motoId: 1 });

export const Interesse: Model<IInteresseDoc> =
  mongoose.models.Interesse ||
  mongoose.model<IInteresseDoc>("Interesse", InteresseSchema);
