import mongoose, { Schema, Model } from "mongoose";

/**
 * AuditLog — registro imutável de ações sensíveis (mudança de role,
 * delete de usuário, reativação de aluguel, etc.) pra rastreabilidade
 * e compliance.
 *
 * Não tem update/delete — append-only.
 */
export type AcaoAudit =
  | "user.role_change"
  | "user.status_change"
  | "user.delete"
  | "aluguel.reativar"
  | "aluguel.cancelar"
  | "aluguel.devolver"
  | "moto.delete"
  | "venda.cancel"
  | "venda.refund"
  | "role.create"
  | "role.update"
  | "role.delete"
  | "contato.delete"
  | "afiliado.delete"
  | "afiliado.aprovar"
  | "interesse.reassign";

export interface IAuditLogDoc {
  acao: AcaoAudit;
  ator: string; // userId quem executou (auth.userId)
  atorNome?: string;
  atorRole?: "admin" | "vendedor" | "afiliado" | "cliente";

  alvoTipo: "user" | "moto" | "aluguel" | "venda" | "role" | "contato" | "afiliado" | "interesse";
  alvoId: string; // id do recurso afetado
  alvoLabel?: string; // descrição humana ("João Silva", "Honda CB 300")

  // Antes/depois (snapshot dos campos relevantes)
  estadoAnterior?: Record<string, unknown>;
  estadoNovo?: Record<string, unknown>;

  motivo?: string;
  ip?: string;
  userAgent?: string;

  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDoc>(
  {
    acao: {
      type: String,
      enum: [
        "user.role_change",
        "user.status_change",
        "user.delete",
        "aluguel.reativar",
        "aluguel.cancelar",
        "aluguel.devolver",
        "moto.delete",
        "venda.cancel",
        "venda.refund",
        "role.create",
        "role.update",
        "role.delete",
        "contato.delete",
        "afiliado.delete",
        "afiliado.aprovar",
        "interesse.reassign",
      ],
      required: true,
      index: true,
    },
    ator: { type: String, required: true, index: true },
    atorNome: String,
    atorRole: { type: String, enum: ["admin", "vendedor", "afiliado", "cliente"] },

    alvoTipo: {
      type: String,
      enum: ["user", "moto", "aluguel", "venda", "role", "contato", "afiliado", "interesse"],
      required: true,
    },
    alvoId: { type: String, required: true, index: true },
    alvoLabel: String,

    estadoAnterior: Schema.Types.Mixed,
    estadoNovo: Schema.Types.Mixed,

    motivo: String,
    ip: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Lista mais comum: últimas ações do sistema ordenadas por data
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ alvoTipo: 1, alvoId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLogDoc> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLogDoc>("AuditLog", AuditLogSchema);
