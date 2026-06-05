/**
 * Formata um evento de audit log pra exibição humana — pra leigo entender.
 * Recebe o doc cru do AuditLog e devolve título, descrição amigável e
 * destaques de antes/depois já formatados (R$ pt-BR, datas dd/mm/yyyy).
 *
 * Convenções:
 *  - Valores monetários sempre como "R$ 1.800,00"
 *  - Datas sempre como "24/01/2027" (sem hora pra campos do dia)
 *  - Status, IDs longos escondidos do título humano
 *  - Quem fez sempre por nome (atorNome) ou email — nunca UUID
 *  - Quando vier campo desconhecido, fallback pro nome do campo legível
 */

export interface AuditEventLike {
  acao: string;
  ator: string;
  atorNome?: string;
  atorRole?: string;
  alvoTipo: string;
  alvoLabel?: string;
  alvoId: string;
  estadoAnterior?: Record<string, unknown>;
  estadoNovo?: Record<string, unknown>;
  motivo?: string;
  createdAt: string | Date;
}

export interface FormattedLog {
  /** Título humano de uma linha. Ex: "Recebeu R$ 1.800,00 do rony vajem" */
  titulo: string;
  /** Subtítulo mais detalhado. Ex: "Parcela 8/10 paga em 29/05/2026 — no prazo" */
  subtitulo?: string;
  /** Quem fez (nome humano, nunca UUID) */
  atorDisplay: string;
  /** Categoria pra colorir badge */
  categoria: "create" | "update" | "delete" | "pagamento" | "acesso" | "outros";
  /** Pares (label, valor) formatados pra "Antes" */
  antes?: Array<{ label: string; valor: string }>;
  /** Pares (label, valor) formatados pra "Depois" */
  depois?: Array<{ label: string; valor: string }>;
}

export function formatLogEvent(ev: AuditEventLike): FormattedLog {
  const ator = ev.atorNome ?? abreviarSeUuid(ev.ator);
  const alvo = ev.alvoLabel ?? `${ev.alvoTipo} ${abreviarSeUuid(ev.alvoId)}`;

  const categoria = inferirCategoria(ev.acao);

  // Despacha por ação. Quando não casa, cai no genérico no fim.
  switch (ev.acao) {
    case "emprestimo.parcela.pagar":
      return formatParcelaPagar(ev, ator, alvo);
    case "emprestimo.parcela.estornar":
      return {
        titulo: `Estornou parcela do empréstimo`,
        subtitulo: alvo,
        atorDisplay: ator,
        categoria: "update",
        antes: kvToDisplayList(ev.estadoAnterior),
        depois: kvToDisplayList(ev.estadoNovo),
      };
    case "emprestimo.parcela.postergar":
      return {
        titulo: `Adiou parcela do empréstimo`,
        subtitulo: alvo,
        atorDisplay: ator,
        categoria: "update",
        antes: kvToDisplayList(ev.estadoAnterior),
        depois: kvToDisplayList(ev.estadoNovo),
      };
    case "emprestimo.create":
      return {
        titulo: `Cadastrou empréstimo pra ${alvo}`,
        atorDisplay: ator,
        categoria: "create",
        depois: kvToDisplayList(ev.estadoNovo),
      };
    case "emprestimo.cancel":
      return {
        titulo: `Cancelou o empréstimo de ${alvo}`,
        atorDisplay: ator,
        categoria: "delete",
      };

    case "moto.create":
      return {
        titulo: `Cadastrou a moto ${alvo}`,
        subtitulo: descricaoMoto(ev.estadoNovo),
        atorDisplay: ator,
        categoria: "create",
        depois: kvToDisplayList(ev.estadoNovo),
      };
    case "moto.delete":
      return {
        titulo: `Excluiu a moto ${alvo}`,
        atorDisplay: ator,
        categoria: "delete",
        antes: kvToDisplayList(ev.estadoAnterior),
      };

    case "aluguel.create":
      return {
        titulo: `Registrou nova locação`,
        subtitulo: alvo,
        atorDisplay: ator,
        categoria: "create",
        depois: kvToDisplayList(ev.estadoNovo),
      };
    case "aluguel.cancelar":
      return {
        titulo: `Cancelou a locação`,
        subtitulo: alvo,
        atorDisplay: ator,
        categoria: "delete",
      };
    case "aluguel.devolver":
      return {
        titulo: `Recebeu devolução da moto`,
        subtitulo: alvo,
        atorDisplay: ator,
        categoria: "update",
      };
    case "aluguel.reativar":
      return {
        titulo: `Reativou a locação`,
        subtitulo: alvo,
        atorDisplay: ator,
        categoria: "update",
      };

    case "venda.create":
      return {
        titulo: `Registrou nova venda`,
        subtitulo: alvo,
        atorDisplay: ator,
        categoria: "create",
        depois: kvToDisplayList(ev.estadoNovo),
      };
    case "venda.cancel":
      return {
        titulo: `Cancelou venda`,
        subtitulo: alvo,
        atorDisplay: ator,
        categoria: "delete",
      };

    case "contrato.update":
      return formatContratoUpdate(ev, ator, alvo);
    case "contrato.delete":
      return {
        titulo: `Excluiu contrato`,
        subtitulo: alvo,
        atorDisplay: ator,
        categoria: "delete",
      };

    case "proprietario.create":
      return {
        titulo: `Cadastrou fornecedor ${alvo}`,
        atorDisplay: ator,
        categoria: "create",
      };
    case "proprietario.delete":
      return {
        titulo: `Excluiu fornecedor ${alvo}`,
        atorDisplay: ator,
        categoria: "delete",
      };

    case "user.role_change":
      return formatRoleChange(ev, ator, alvo);
    case "user.delete":
      return {
        titulo: `Excluiu usuário ${alvo}`,
        atorDisplay: ator,
        categoria: "delete",
      };
    case "user.status_change":
      return {
        titulo: `Mudou status do usuário ${alvo}`,
        subtitulo: descricaoStatus(ev.estadoAnterior, ev.estadoNovo),
        atorDisplay: ator,
        categoria: "update",
      };
    case "user.create":
      return {
        titulo: `Cadastrou usuário ${alvo}`,
        atorDisplay: ator,
        categoria: "create",
      };

    case "login.success":
      return {
        titulo: `Entrou no sistema`,
        atorDisplay: ator,
        categoria: "acesso",
      };
    case "login.failed":
      return {
        titulo: `Tentativa de login falhou`,
        subtitulo: alvo,
        atorDisplay: ator,
        categoria: "acesso",
      };

    case "page.view":
      return {
        titulo: `Acessou ${alvo}`,
        atorDisplay: ator,
        categoria: "acesso",
      };
    case "form.start":
      return {
        titulo: `Começou a preencher ${alvo}`,
        atorDisplay: ator,
        categoria: "acesso",
      };
    case "form.abandon":
      return {
        titulo: `Saiu de ${alvo} sem salvar`,
        atorDisplay: ator,
        categoria: "acesso",
      };

    default:
      return formatGenerico(ev, ator, alvo, categoria);
  }
}

// ============== HANDLERS ESPECIALIZADOS ==============

function formatParcelaPagar(
  ev: AuditEventLike,
  ator: string,
  alvo: string
): FormattedLog {
  const a = ev.estadoAnterior as Record<string, unknown> | undefined;
  const d = ev.estadoNovo as Record<string, unknown> | undefined;

  // alvoLabel tem "rony vajem · parcela 8/10" — extraímos parcela X/Y
  const matchParcela = alvo.match(/parcela\s+(\d+)\/(\d+)/i);
  const parcelaTxt = matchParcela ? matchParcela[0] : "parcela";
  const cliente = alvo.split("·")[0]?.trim() ?? "cliente";

  // Valor pago: prefer estadoNovo.valorPago; fallback estadoNovo.valor
  const valorPago =
    asNumber(d?.valorPago) ?? asNumber(d?.valor) ?? asNumber(a?.valor);
  const valorPrevisto = asNumber(a?.valor);
  const vencimento = asDate(a?.vencimento) ?? asDate(d?.vencimento);
  const pagoEm = asDate(d?.pagoEm);

  // Contexto de atraso (pra ajudar leigo)
  let contextoAtraso = "";
  if (vencimento && pagoEm) {
    const diff = Math.floor(
      (pagoEm.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff > 0) contextoAtraso = ` — com ${diff} dia${diff > 1 ? "s" : ""} de atraso`;
    else if (diff < 0) contextoAtraso = ` — ${-diff} dia${diff < -1 ? "s" : ""} adiantado`;
    else contextoAtraso = " — no prazo";
  }

  // Diferença entre pago e previsto (se houver)
  let dif = "";
  if (
    valorPago !== undefined &&
    valorPrevisto !== undefined &&
    valorPago !== valorPrevisto
  ) {
    const delta = valorPago - valorPrevisto;
    if (delta > 0) dif = ` (R$ ${formatBRL(delta)} a mais que o previsto)`;
    else dif = ` (R$ ${formatBRL(-delta)} a menos que o previsto)`;
  }

  const titulo =
    valorPago !== undefined
      ? `Recebeu R$ ${formatBRL(valorPago)} de ${cliente}`
      : `Pagou ${parcelaTxt} de ${cliente}`;

  const subtitulo =
    pagoEm && vencimento
      ? `${capital(parcelaTxt)} paga em ${formatDate(pagoEm)} (venc. ${formatDate(vencimento)})${contextoAtraso}${dif}`
      : `${capital(parcelaTxt)}${contextoAtraso}${dif}`;

  return {
    titulo,
    subtitulo,
    atorDisplay: ator,
    categoria: "pagamento",
  };
}

function formatContratoUpdate(
  ev: AuditEventLike,
  ator: string,
  alvo: string
): FormattedLog {
  const a = ev.estadoAnterior ?? {};
  const d = ev.estadoNovo ?? {};
  const statusAntes = a.status as string | undefined;
  const statusDepois = d.status as string | undefined;
  if (statusAntes !== statusDepois && statusDepois) {
    return {
      titulo: `Mudou status do contrato pra "${statusLabel(statusDepois)}"`,
      subtitulo: `${alvo} · era "${statusLabel(statusAntes ?? "?")}"`,
      atorDisplay: ator,
      categoria: "update",
    };
  }
  return {
    titulo: `Editou contrato`,
    subtitulo: alvo,
    atorDisplay: ator,
    categoria: "update",
  };
}

function formatRoleChange(
  ev: AuditEventLike,
  ator: string,
  alvo: string
): FormattedLog {
  const antes = (ev.estadoAnterior as Record<string, unknown> | undefined)?.role;
  const depois = (ev.estadoNovo as Record<string, unknown> | undefined)?.role;
  return {
    titulo: `Mudou nível de ${alvo}`,
    subtitulo: `de ${roleLabel(String(antes))} pra ${roleLabel(String(depois))}`,
    atorDisplay: ator,
    categoria: "update",
  };
}

function formatGenerico(
  ev: AuditEventLike,
  ator: string,
  alvo: string,
  categoria: FormattedLog["categoria"]
): FormattedLog {
  const verbos: Record<string, string> = {
    create: "Criou",
    update: "Atualizou",
    delete: "Excluiu",
  };
  const partes = ev.acao.split(".");
  const verbo = verbos[partes[1] ?? ""] ?? "Registrou";
  return {
    titulo: `${verbo} ${ev.alvoTipo} ${alvo}`,
    atorDisplay: ator,
    categoria,
    antes: kvToDisplayList(ev.estadoAnterior),
    depois: kvToDisplayList(ev.estadoNovo),
  };
}

// ============== HELPERS DE FORMATAÇÃO ==============

const NUMERIC_FIELDS = new Set([
  "valor",
  "valorPago",
  "valorTotal",
  "valorVendido",
  "valorAnunciado",
  "valorCompra",
  "valorMinimo",
  "comissao",
  "acrescimo",
  "juros",
  "principal",
  "caucao",
  "entrada",
  "jurosPorParcela",
]);
const DATE_FIELDS = new Set([
  "vencimento",
  "pagoEm",
  "dataInicio",
  "dataFim",
  "data",
  "createdAt",
  "updatedAt",
  "dataContrato",
]);
const HIDDEN_FIELDS = new Set([
  "registradoPor", // UUID nada útil pro humano
  "_id",
  "__v",
]);

const LABELS: Record<string, string> = {
  valor: "Valor",
  valorPago: "Valor pago",
  valorTotal: "Valor total",
  valorVendido: "Valor vendido",
  valorAnunciado: "Anunciado",
  valorCompra: "Custo de compra",
  valorMinimo: "Valor mínimo",
  comissao: "Comissão",
  acrescimo: "Acréscimo",
  juros: "Juros",
  caucao: "Caução",
  entrada: "Entrada",
  jurosPorParcela: "Juros por parcela",
  vencimento: "Vencimento",
  pagoEm: "Pago em",
  dataInicio: "Início",
  dataFim: "Fim",
  dataContrato: "Data do contrato",
  numero: "Parcela nº",
  status: "Status",
  tipo: "Tipo",
  modalidade: "Modalidade",
  observacao: "Observação",
  observacoes: "Observações",
  marca: "Marca",
  modelo: "Modelo",
  placa: "Placa",
  cpf: "CPF",
  telefone: "Telefone",
  email: "E-mail",
  nome: "Nome",
};

const STATUS_HUMAN: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  cancelado: "Cancelado",
  concluido: "Concluído",
  rescindido: "Rescindido",
  rascunho: "Rascunho",
  assinado: "Assinado",
  pendente: "Pendente",
  paga: "Paga",
  aberto: "Em aberto",
  atrasado: "Atrasado",
  disponivel: "Disponível",
  reservada: "Reservada",
  vendida: "Vendida",
  alugada: "Alugada",
  manutencao: "Em manutenção",
  lavagem: "Em lavagem",
  devolvida: "Devolvida",
  quitado: "Quitado",
};

function kvToDisplayList(
  obj?: Record<string, unknown> | null
): Array<{ label: string; valor: string }> {
  if (!obj || typeof obj !== "object") return [];
  const out: Array<{ label: string; valor: string }> = [];
  for (const [k, v] of Object.entries(obj)) {
    if (HIDDEN_FIELDS.has(k)) continue;
    if (v === null || v === undefined) continue;
    out.push({ label: LABELS[k] ?? toTitleCase(k), valor: formatFieldValue(k, v) });
  }
  return out;
}

function formatFieldValue(field: string, v: unknown): string {
  if (NUMERIC_FIELDS.has(field)) {
    const n = asNumber(v);
    if (n !== undefined) return `R$ ${formatBRL(n)}`;
  }
  if (DATE_FIELDS.has(field)) {
    const d = asDate(v);
    if (d) return formatDate(d);
  }
  if (field === "status" && typeof v === "string") {
    return statusLabel(v);
  }
  if (field === "role" && typeof v === "string") {
    return roleLabel(v);
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function descricaoMoto(s?: Record<string, unknown> | null): string {
  if (!s) return "";
  const partes: string[] = [];
  if (s.valorAnunciado)
    partes.push(`anunciada por R$ ${formatBRL(Number(s.valorAnunciado))}`);
  if (s.tipo) partes.push(`pra ${s.tipo}`);
  return partes.join(" — ");
}

function descricaoStatus(
  a?: Record<string, unknown> | null,
  d?: Record<string, unknown> | null
): string {
  const sa = (a?.status ?? "?") as string;
  const sd = (d?.status ?? "?") as string;
  return `de ${statusLabel(sa)} pra ${statusLabel(sd)}`;
}

// ============== UTILS GENÉRICOS ==============

function inferirCategoria(acao: string): FormattedLog["categoria"] {
  if (acao.endsWith(".pagar") || acao.endsWith(".estornar")) return "pagamento";
  if (acao.endsWith(".delete") || acao.endsWith(".cancel") || acao.endsWith(".cancelar"))
    return "delete";
  if (acao.endsWith(".create")) return "create";
  if (acao.startsWith("login.") || acao.startsWith("page.") || acao.startsWith("form."))
    return "acesso";
  return "update";
}

function statusLabel(s: string): string {
  return STATUS_HUMAN[s] ?? toTitleCase(s);
}

function roleLabel(r: string): string {
  if (r === "admin") return "Administrador";
  if (r === "vendedor") return "Vendedor";
  if (r === "cliente") return "Cliente";
  if (r === "afiliado") return "Afiliado";
  return toTitleCase(r);
}

function abreviarSeUuid(s: string): string {
  // UUID Supabase ou ObjectId Mongo — ambos têm formato técnico
  if (/^[0-9a-f-]{36}$/i.test(s) || /^[0-9a-f]{24}$/i.test(s)) {
    return s.slice(0, 8) + "...";
  }
  return s;
}

function toTitleCase(s: string): string {
  return s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

function asDate(v: unknown): Date | undefined {
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}

function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}
