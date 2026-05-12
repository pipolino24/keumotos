import { AuditLog, AcaoAudit } from "@/lib/models/audit-log";
import { connectMongo } from "@/lib/mongodb";

interface EmitAuditParams {
  acao: AcaoAudit;
  ator: string;
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
    | "interesse";
  alvoId: string;
  alvoLabel?: string;
  estadoAnterior?: Record<string, unknown>;
  estadoNovo?: Record<string, unknown>;
  motivo?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Emite registro de auditoria — fire-and-forget.
 * Não bloqueia o caller se a gravação falhar (mas loga).
 * Use em DELETE de recursos, mudanças de role, reativação, cancelamentos.
 */
export async function emitAuditLog(p: EmitAuditParams): Promise<void> {
  try {
    await connectMongo();
    await AuditLog.create({
      acao: p.acao,
      ator: p.ator,
      atorNome: p.atorNome,
      atorRole: p.atorRole,
      alvoTipo: p.alvoTipo,
      alvoId: p.alvoId,
      alvoLabel: p.alvoLabel,
      estadoAnterior: p.estadoAnterior,
      estadoNovo: p.estadoNovo,
      motivo: p.motivo,
      ip: p.ip,
      userAgent: p.userAgent,
    });
  } catch (err) {
    // Não derruba a operação principal — só sinaliza
    console.warn(
      "[audit] emit failed:",
      err instanceof Error ? err.message : "unknown"
    );
  }
}
