import { z } from "zod";

export const userCreateSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.email("E-mail inválido"),
  telefone: z.string().min(8, "Telefone inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["admin", "vendedor", "cliente", "afiliado"]).optional(),
  status: z.enum(["ativo", "inativo", "pendente"]).optional(),
  avatar: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cpf: z.string().optional(),
});

export const motoCreateSchema = z.object({
  marca: z.string().min(1, "Marca obrigatória"),
  modelo: z.string().min(1, "Modelo obrigatório"),
  versao: z.string().optional(),
  anoFabricacao: z.number().int().min(1900).max(2100),
  anoModelo: z.number().int().min(1900).max(2100),
  cor: z.string().min(1, "Cor obrigatória"),
  placa: z.string().optional(),
  chassi: z.string().optional(),
  renavam: z.string().optional(),
  numeroMotor: z.string().optional(),
  cilindrada: z.number().int().min(1),
  combustivel: z.enum(["gasolina", "flex", "eletrica"]),
  cambio: z.enum(["manual", "automatico", "semi-automatico", "cvt"]),
  partida: z.enum(["eletrica", "pedal", "ambas"]).optional(),
  km: z.number().int().min(0),
  potencia: z.string().optional(),
  valorFipe: z.number().min(0),
  valorCompra: z.number().min(0),
  valorAnunciado: z.number().min(0),
  valorMinimo: z.number().min(0),
  comissao: z.number().min(0).optional(),
  valorDiaria: z.number().min(0).optional(),
  valorSemanal: z.number().min(0).optional(),
  valorMensal: z.number().min(0).optional(),
  caucao: z.number().min(0).optional(),
  tipo: z.enum(["venda", "aluguel", "ambos"]),
  status: z
    .enum(["disponivel", "reservada", "vendida", "alugada", "manutencao", "devolvida"])
    .optional(),
  destaque: z.boolean().optional(),
  // Cada foto pode ser URL ou base64. Limita 8MB por foto + 20 fotos
  // máximo pra prevenir DOS via payload gigante.
  fotos: z
    .array(z.string().max(8_000_000, "Foto muito grande (>8MB)"))
    .max(20, "Máximo 20 fotos")
    .default([]),
  // CRLV/CRV — frente e/ou verso (até 4 imagens). NÃO entra no catálogo
  // público (projeção em /api/motos remove).
  documentos: z
    .array(z.string().max(8_000_000, "Documento muito grande (>8MB)"))
    .max(4, "Máximo 4 documentos")
    .default([])
    .optional(),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  origem: z.enum(["propria", "comprada", "repasse"]).default("comprada"),
  proprietarioId: z.string().optional(),
  proprietarioNome: z.string().optional(),
  compra: z
    .object({
      valorPago: z.number().min(0),
      formaPagamento: z.enum([
        "pix",
        "dinheiro",
        "transferencia",
        "troca",
        "cheque",
      ]),
      numeroNotaFiscal: z.string().optional(),
      dataAquisicao: z.union([z.string(), z.date()]),
    })
    .optional(),
  repasse: z
    .object({
      valorCombinadoDono: z.number().min(0),
      tipoComissao: z.enum(["percentual", "fixo"]),
      comissaoPercentual: z.number().min(0).max(100).optional(),
      comissaoFixa: z.number().min(0).optional(),
      prazoConsignacao: z.number().int().min(1),
      dataInicioConsignacao: z.union([z.string(), z.date()]),
      contratoAssinado: z.boolean().default(false),
      observacoesAcordo: z.string().optional(),
    })
    .optional(),
  setor: z.enum(["multimarcas", "loca", "pecas"]).default("multimarcas"),
  vendedorResponsavel: z.string().optional(),
  dataEntrada: z.union([z.string(), z.date()]).optional(),
});

export const proprietarioCreateSchema = z.object({
  nome: z.string().min(2),
  cpf: z.string().min(11),
  rg: z.string().optional(),
  cnh: z.string().optional(),
  email: z.email().optional().or(z.literal("")),
  telefone: z.string().min(8),
  whatsapp: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  pixTipo: z.enum(["cpf", "email", "telefone", "aleatoria"]).optional(),
  pixChave: z.string().optional(),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  fotoPessoal: z.string().optional(),
  fotoCnh: z.string().optional(),
  fotoComprovanteResidencia: z.string().optional(),
  fotoDocMoto: z.string().optional(),
});

export const afiliadoCreateSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.email(),
  telefone: z.string().min(8).max(20),
  avatar: z.string().max(8_000_000, "Avatar muito grande (>8MB)").optional(),
  cidade: z.string().max(80).optional(),
  estado: z.string().max(2).optional(),
  bio: z.string().max(1000).optional(),
  instagram: z.string().max(80).optional(),
  whatsapp: z.string().max(20).optional(),
  tipoComissao: z.enum(["percentual", "fixo"]),
  comissaoPercentual: z.number().min(0).max(100).optional(),
  comissaoFixa: z.number().min(0).max(10_000_000).optional(),
  valorMinimoVenda: z.number().min(0).max(100_000_000).optional(),
  comissaoMaxima: z.number().min(0).max(10_000_000).optional(),
  pixTipo: z.enum(["cpf", "email", "telefone", "aleatoria"]).optional(),
  pixChave: z.string().max(80).optional(),
  banco: z.string().max(80).optional(),
  agencia: z.string().max(20).optional(),
  conta: z.string().max(20).optional(),
  aprovado: z.boolean().default(true),
  status: z.enum(["ativo", "pausado", "bloqueado"]).optional(),
  observacoes: z.string().max(2000).optional(),
});

export const contatoCreateSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(8),
  email: z.email().optional().or(z.literal("")),
  origem: z.enum(["site", "instagram", "whatsapp", "presencial", "indicacao"]),
  interesse: z.enum(["compra", "venda", "troca", "aluguel", "pecas", "outro"]),
  motoInteresse: z.string().optional(),
  observacoes: z.string().optional(),
  status: z
    .enum(["novo", "em-atendimento", "convertido", "perdido"])
    .optional(),
  vendedorResponsavel: z.string().optional(),
});

export const roleCreateSchema = z.object({
  nome: z.string().min(2).max(80, "Nome muito longo (>80 caracteres)"),
  descricao: z.string().max(500, "Descrição muito longa (>500 caracteres)").optional(),
  cor: z.string().max(16).optional(),
  permissoes: z
    .array(z.string().max(64, "Permissão muito longa"))
    .max(200, "Máximo 200 permissões")
    .default([]),
  ativo: z.boolean().default(true),
});

export const pagamentoFormaEnum = z.enum([
  "dinheiro",
  "pix",
  "transferencia",
  "cartao-debito",
  "cartao-credito",
  "financiamento-banco",
  "parcelado-loja",
  "troca",
  "cheque",
  "consorcio",
]);

export const pagamentoSchema = z.object({
  forma: pagamentoFormaEnum,
  valor: z.number().min(0.01, "Valor obrigatório"),
  parcelasCartao: z.number().int().min(1).max(24).optional(),
  parcelasLoja: z.number().int().min(1).max(60).optional(),
  parcelasPagasLoja: z.number().int().min(0).optional(),
  valorParcelaLoja: z.number().min(0).optional(),
  primeiraParcelaEm: z.union([z.string(), z.date()]).optional(),
  proximaParcelaEm: z.union([z.string(), z.date()]).optional(),
  banco: z.string().optional(),
  numeroContratoBanco: z.string().optional(),
  parcelasContrato: z.number().int().min(1).max(120).optional(),
  itemRecebido: z.string().optional(),
  observacao: z.string().optional(),
});

export const vendaCreateSchema = z
  .object({
    motoId: z.string().min(1, "Moto obrigatória"),
    motoModelo: z.string().min(1),
    motoMarca: z.string().optional(),
    motoAno: z.number().int().optional(),
    motoValorAnunciado: z.number().min(0).optional(),
    motoValorMinimo: z.number().min(0).optional(),

    clienteId: z.string().optional(),
    clienteNome: z.string().min(1, "Cliente obrigatório"),
    clienteTelefone: z.string().optional(),
    clienteEmail: z.string().optional(),
    clienteCpf: z.string().optional(),

    vendedorId: z.string().min(1, "Vendedor obrigatório"),
    vendedorNome: z.string().min(1),

    valorVendido: z.number().min(0, "Valor inválido"),
    pagamentos: z.array(pagamentoSchema).min(1, "Adicione ao menos uma forma de pagamento"),

    comissao: z.number().min(0).default(0),

    status: z.enum(["pendente", "concluida", "cancelada"]).optional(),
    data: z.union([z.string(), z.date()]).optional(),
    observacoes: z.string().max(2000, "Observação muito longa").optional(),
  })
  .refine(
    (d) =>
      !d.motoValorMinimo ||
      d.motoValorMinimo <= 0 ||
      d.valorVendido >= d.motoValorMinimo,
    {
      message: "Valor da venda abaixo do valor mínimo da moto",
      path: ["valorVendido"],
    }
  )
  .refine(
    (d) => {
      const total = d.pagamentos.reduce((s, p) => s + (Number(p.valor) || 0), 0);
      // Tolerância de 1 centavo pra arredondamento
      return Math.abs(total - d.valorVendido) < 0.01;
    },
    {
      message: "Soma dos pagamentos deve igualar o valor da venda",
      path: ["pagamentos"],
    }
  );

export const aluguelCreateSchema = z
  .object({
    motoId: z.string().min(1, "Moto obrigatória"),
    motoModelo: z.string().min(1),
    motoMarca: z.string().optional(),
    motoAno: z.number().int().optional(),

    clienteId: z.string().optional(),
    clienteNome: z.string().min(1, "Cliente obrigatório"),
    clienteTelefone: z.string().optional(),
    clienteEmail: z.string().optional(),
    clienteCpf: z.string().optional(),

    vendedorId: z.string().optional(),
    vendedorNome: z.string().optional(),

    dataInicio: z.union([z.string(), z.date()]),
    dataFim: z.union([z.string(), z.date()]),

    valorDiariaUsada: z.number().min(0).optional(),
    valorSemanalUsada: z.number().min(0).optional(),
    valorMensalUsada: z.number().min(0).optional(),
    modalidadeAplicada: z.enum(["diaria", "semanal", "mensal"]).optional(),
    diasContratados: z.number().int().min(1),
    valorTotal: z.number().min(0),
    // Plano Conquista (entrada + parcelas quinzenais)
    tipoPlano: z.enum(["conquista", "venda-direta"]).optional(),
    valorEntrada: z.number().min(0).optional(),
    dataEntrada: z.union([z.string(), z.date()]).optional(),
    valorParcela: z.number().min(0).optional(),
    numeroParcelas: z.number().int().min(1).max(120).optional(),
    parcelasPagas: z.number().int().min(0).optional(),
    frequenciaParcela: z.enum(["quinzenal", "mensal"]).optional(),
    proximaParcelaEm: z.union([z.string(), z.date()]).optional(),
    // Mantido por compat — KEU não trabalha com caução.
    caucao: z.number().min(0).default(0).optional(),

    km_inicial: z.number().min(0),
    km_final: z.number().min(0).optional(),

    fotosInicio: z.array(z.string()).default([]),
    observacoesInicio: z.string().optional(),

    status: z.enum(["ativo", "concluido", "atrasado", "cancelado"]).optional(),
    observacoes: z.string().optional(),
  })
  .refine(
    (d) => {
      const inicio = new Date(d.dataInicio as string | Date).getTime();
      const fim = new Date(d.dataFim as string | Date).getTime();
      return Number.isFinite(inicio) && Number.isFinite(fim) && fim > inicio;
    },
    { message: "dataFim deve ser posterior a dataInicio", path: ["dataFim"] }
  );

export const avariaSchema = z.object({
  descricao: z.string().min(2, "Descrição obrigatória"),
  // Cada foto pode ser URL ou base64. Limita 8MB por foto + 20 fotos
  // máximo pra prevenir DOS via payload gigante.
  fotos: z
    .array(z.string().max(8_000_000, "Foto muito grande (>8MB)"))
    .max(20, "Máximo 20 fotos")
    .default([]),
  custoEstimado: z.number().min(0).optional(),
  cobradoCaucao: z.boolean().optional(),
  reparado: z.boolean().optional(),
});

export const aluguelDevolucaoSchema = z.object({
  km_final: z.number().min(0),
  fotosFim: z.array(z.string()).default([]),
  observacoesFim: z.string().optional(),
  avarias: z.array(avariaSchema).default([]),
  multaAtraso: z.number().min(0).optional(),
  dataDevolucao: z.union([z.string(), z.date()]).optional(),
});

export const revisaoCreateSchema = z.object({
  motoId: z.string().min(1),
  data: z.union([z.string(), z.date()]).optional(),
  tipo: z
    .enum(["revisao", "manutencao", "troca-peca", "reparo-avaria", "outro"])
    .default("revisao"),
  descricao: z.string().min(3, "Descrição obrigatória"),
  pecas: z
    .array(
      z.object({
        nome: z.string().min(1),
        quantidade: z.number().int().min(1).default(1),
        valorUnitario: z.number().min(0),
      })
    )
    .default([]),
  servicos: z
    .array(
      z.object({
        descricao: z.string().min(1),
        valor: z.number().min(0),
      })
    )
    .default([]),
  custoTotal: z.number().min(0),
  kmNaRevisao: z.number().min(0),
  responsavel: z.string().optional(),
  notaFiscal: z.string().optional(),
  // Cada foto pode ser URL ou base64. Limita 8MB por foto + 20 fotos
  // máximo pra prevenir DOS via payload gigante.
  fotos: z
    .array(z.string().max(8_000_000, "Foto muito grande (>8MB)"))
    .max(20, "Máximo 20 fotos")
    .default([]),
  observacoes: z.string().optional(),
  aluguelOrigemId: z.string().optional(),
  avariaOrigemId: z.string().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type MotoCreateInput = z.infer<typeof motoCreateSchema>;
export type ProprietarioCreateInput = z.infer<typeof proprietarioCreateSchema>;
export type AfiliadoCreateInput = z.infer<typeof afiliadoCreateSchema>;
export type ContatoCreateInput = z.infer<typeof contatoCreateSchema>;
export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type VendaCreateInput = z.infer<typeof vendaCreateSchema>;
export type AluguelCreateInput = z.infer<typeof aluguelCreateSchema>;
export type PagamentoInput = z.infer<typeof pagamentoSchema>;
export type AvariaInput = z.infer<typeof avariaSchema>;
export type AluguelDevolucaoInput = z.infer<typeof aluguelDevolucaoSchema>;
export type RevisaoCreateInput = z.infer<typeof revisaoCreateSchema>;

// === CONTRATO ===
const pessoaSnapSchema = z.object({
  nome: z.string().min(2).max(120),
  sexo: z.string().max(20).optional(),
  nascimento: z.string().max(20).optional(),
  cnh: z.string().max(40).optional(),
  natural: z.string().max(80).optional(),
  profissao: z.string().max(80).optional(),
  cpf: z.string().max(20).optional(),
  rg: z.string().max(30).optional(),
  endereco: z.string().max(200).optional(),
  telefone: z.string().max(30).optional(),
  email: z.string().max(120).optional().or(z.literal("")),
});

export const contratoCreateSchema = z.object({
  aluguelId: z.string().optional(),
  motoId: z.string(),
  clienteId: z.string().optional(),
  contratante: pessoaSnapSchema,
  avalista: pessoaSnapSchema.optional(),
  moto: z.object({
    marca: z.string(),
    modelo: z.string(),
    anoModelo: z.number().int().optional(),
    cor: z.string().optional(),
    placa: z.string().optional(),
    chassi: z.string().optional(),
    renavam: z.string().optional(),
    km: z.number().nonnegative().optional(),
    obs: z.string().max(500).optional(),
  }),
  plano: z.object({
    parcelas: z.number().int().min(1).max(120),
    valorEntrada: z.number().nonnegative().default(0),
    // valorParcela > 0 — contrato sem valor é inválido
    valorParcela: z.number().positive("Valor da locação deve ser > 0"),
    planoEscolhido: z.string().max(60).default("Locação"),
    multaPercent: z.number().nonnegative().max(100).default(10),
    jurosDiaPercent: z.number().nonnegative().max(100).default(2),
    datasVencimento: z.string().max(60).optional(),
    vencimentoPrimeira: z.string().max(40).optional(),
  }),
  observacoes: z.string().max(1000).optional(),
  dataContrato: z.string().optional(),
});

export type ContratoCreateInput = z.infer<typeof contratoCreateSchema>;
