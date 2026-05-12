import mongoose, { Schema, Model } from "mongoose";

/**
 * Notification — entrega de eventos pra usuários internos (vendedor/admin).
 *
 * Cada Interesse de cliente identificado gera 1 Notification por staff
 * que deveria ver o evento (geralmente: admin geral + vendedor responsável
 * pela moto).
 *
 * Vencimentos (parcela, devolução) também geram Notification recorrente.
 */
export type TipoNotificacao =
  | "interesse"
  | "lead"
  | "venda"
  | "aluguel"
  | "pagamento_proximo"
  | "pagamento_atrasado"
  | "devolucao_proxima"
  | "devolucao_atrasada"
  | "novo_cliente"
  | "documento_pendente";

export interface INotificationDoc {
  // Destinatário (admin, vendedor ou afiliado)
  destinatarioId: string;
  destinatarioRole?: "admin" | "vendedor" | "afiliado";

  tipo: TipoNotificacao;
  titulo: string; // "José Silva visualizou Honda CB 300"
  descricao?: string; // detalhes opcionais

  // Recurso de origem
  origemTipo?: "interesse" | "contato" | "venda" | "aluguel" | "user";
  origemId?: string;

  // Cliente envolvido (pra agrupar por pessoa)
  clienteId?: string;
  clienteNome?: string;

  // Recurso alvo (moto, venda…)
  link?: string;

  // Prioridade visual
  prioridade: "baixa" | "normal" | "alta" | "urgente";

  // Estado
  lido: boolean;
  lidoEm?: Date;
  arquivado: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDoc>(
  {
    destinatarioId: { type: String, required: true, index: true },
    destinatarioRole: {
      type: String,
      enum: ["admin", "vendedor", "afiliado"],
    },

    tipo: {
      type: String,
      enum: [
        "interesse",
        "lead",
        "venda",
        "aluguel",
        "pagamento_proximo",
        "pagamento_atrasado",
        "devolucao_proxima",
        "devolucao_atrasada",
        "novo_cliente",
        "documento_pendente",
      ],
      required: true,
      index: true,
    },

    titulo: { type: String, required: true },
    descricao: String,

    origemTipo: {
      type: String,
      enum: ["interesse", "contato", "venda", "aluguel", "user"],
    },
    origemId: String,

    clienteId: { type: String, index: true },
    clienteNome: String,

    link: String,

    prioridade: {
      type: String,
      enum: ["baixa", "normal", "alta", "urgente"],
      default: "normal",
      index: true,
    },

    lido: { type: Boolean, default: false, index: true },
    lidoEm: Date,
    arquivado: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Lista mais comum: notificações não-lidas do usuário, mais recentes primeiro
NotificationSchema.index({ destinatarioId: 1, lido: 1, createdAt: -1 });
NotificationSchema.index({ destinatarioId: 1, arquivado: 1, createdAt: -1 });

export const Notification: Model<INotificationDoc> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDoc>("Notification", NotificationSchema);
