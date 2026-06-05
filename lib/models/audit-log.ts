import mongoose, { Schema, Model } from "mongoose";

/**
 * AuditLog — registro imutável de ações sensíveis (mudança de role,
 * delete de usuário, reativação de aluguel, etc.) pra rastreabilidade
 * e compliance.
 *
 * Não tem update/delete — append-only.
 */
// Catálogo de ações registráveis. Convenção: <recurso>.<verbo> em snake_case
// pra ações compostas. Quando precisar adicionar nova ação, anexe aqui E no
// enum do schema lá embaixo (Mongoose valida no save).
export type AcaoAudit =
  // user / acesso
  | "user.create"
  | "user.update"
  | "user.role_change"
  | "user.status_change"
  | "user.delete"
  | "login.success"
  | "login.failed"
  // moto
  | "moto.create"
  | "moto.update"
  | "moto.delete"
  // aluguel
  | "aluguel.create"
  | "aluguel.update"
  | "aluguel.reativar"
  | "aluguel.cancelar"
  | "aluguel.devolver"
  // venda
  | "venda.create"
  | "venda.update"
  | "venda.cancel"
  | "venda.refund"
  // contrato
  | "contrato.create"
  | "contrato.update"
  | "contrato.delete"
  // cliente
  | "cliente.create"
  | "cliente.update"
  | "cliente.delete"
  // proprietario / fornecedor
  | "proprietario.create"
  | "proprietario.update"
  | "proprietario.delete"
  // roles / niveis
  | "role.create"
  | "role.update"
  | "role.delete"
  // contato (lead)
  | "contato.create"
  | "contato.update"
  | "contato.delete"
  // afiliado (sistema oculto mas mantemos ações)
  | "afiliado.create"
  | "afiliado.update"
  | "afiliado.delete"
  | "afiliado.aprovar"
  // interesse
  | "interesse.create"
  | "interesse.update"
  | "interesse.delete"
  | "interesse.reassign"
  // emprestimo
  | "emprestimo.create"
  | "emprestimo.update"
  | "emprestimo.cancel"
  | "emprestimo.parcela.pagar"
  | "emprestimo.parcela.estornar"
  | "emprestimo.parcela.postergar"
  // notificações + acessos (page views / form abandons — opcional)
  | "page.view"
  | "form.start"
  | "form.abandon";

export interface IAuditLogDoc {
  acao: AcaoAudit;
  ator: string; // userId quem executou (auth.userId)
  atorNome?: string;
  atorRole?: "admin" | "vendedor" | "afiliado" | "cliente";

  alvoTipo:
    | "user"
    | "moto"
    | "aluguel"
    | "venda"
    | "role"
    | "contato"
    | "afiliado"
    | "interesse"
    | "emprestimo"
    | "contrato"
    | "cliente"
    | "proprietario"
    | "page"
    | "form"
    | "sistema";
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
        "user.create",
        "user.update",
        "user.role_change",
        "user.status_change",
        "user.delete",
        "login.success",
        "login.failed",
        "moto.create",
        "moto.update",
        "moto.delete",
        "aluguel.create",
        "aluguel.update",
        "aluguel.reativar",
        "aluguel.cancelar",
        "aluguel.devolver",
        "venda.create",
        "venda.update",
        "venda.cancel",
        "venda.refund",
        "contrato.create",
        "contrato.update",
        "contrato.delete",
        "cliente.create",
        "cliente.update",
        "cliente.delete",
        "proprietario.create",
        "proprietario.update",
        "proprietario.delete",
        "role.create",
        "role.update",
        "role.delete",
        "contato.create",
        "contato.update",
        "contato.delete",
        "afiliado.create",
        "afiliado.update",
        "afiliado.delete",
        "afiliado.aprovar",
        "interesse.create",
        "interesse.update",
        "interesse.delete",
        "interesse.reassign",
        "emprestimo.create",
        "emprestimo.update",
        "emprestimo.cancel",
        "emprestimo.parcela.pagar",
        "emprestimo.parcela.estornar",
        "emprestimo.parcela.postergar",
        "page.view",
        "form.start",
        "form.abandon",
      ],
      required: true,
      index: true,
    },
    ator: { type: String, required: true, index: true },
    atorNome: String,
    atorRole: { type: String, enum: ["admin", "vendedor", "afiliado", "cliente"] },

    alvoTipo: {
      type: String,
      enum: [
        "user",
        "moto",
        "aluguel",
        "venda",
        "role",
        "contato",
        "afiliado",
        "interesse",
        "emprestimo",
        "contrato",
        "cliente",
        "proprietario",
        "page",
        "form",
        "sistema",
      ],
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

// TTL de 365 dias — Mongo deleta documentos automaticamente quando
// `createdAt + 365d < now`. Compliance: a maioria das leis (LGPD/GDPR)
// permite reter logs de auditoria por até 1 ano sem justificativa formal.
// Pra reter mais, suba esse número OU exporte os logs antes do limite.
AuditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
);

export const AuditLog: Model<IAuditLogDoc> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLogDoc>("AuditLog", AuditLogSchema);
