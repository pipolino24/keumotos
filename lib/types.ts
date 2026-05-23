export type UserRole = "admin" | "vendedor" | "cliente" | "afiliado";

export type UserStatus = "ativo" | "suspenso" | "bloqueado";

export type UserSetor = "multimarcas" | "loca" | "pecas";

export interface EnderecoCompleto {
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface DadosBancarios {
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo?: "corrente" | "poupanca";
}

export interface DocumentoUpload {
  tipo:
    | "cnh_foto"
    | "rg_foto"
    | "cpf_foto"
    | "comprovante_endereco"
    | "foto_pessoal"
    | "outro";
  url: string;
  path: string;
  uploaded_at: string;
  validade?: string;
}

/**
 * Profile = perfil completo do usuário, vive na tabela public.profiles
 * do Supabase, em relação 1:1 com auth.users. Toda referência a usuário
 * no resto do sistema usa `id` (UUID).
 */
export interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  rg?: string | null;
  cnh?: string | null;
  cnh_validade?: string | null;
  profissao?: string | null;
  endereco?: EnderecoCompleto | null;
  pix?: string | null;
  banco?: DadosBancarios | null;
  role: UserRole;
  setor: UserSetor;
  permissoes: string[];
  documentos: DocumentoUpload[];
  avatar_url?: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export type MotoStatus =
  | "disponivel"
  | "lavagem" // no lava-jato, estado temporário curto
  | "reservada"
  | "vendida"
  | "alugada"
  | "manutencao" // em oficina pra revisão/conserto
  | "devolvida"; // repasse devolvido ao dono

export type MotoTipo = "venda" | "aluguel" | "ambos";

/**
 * Origem da moto:
 * - propria: moto já era da KEU (estoque histórico)
 * - comprada: KEU comprou de um terceiro (capital próprio)
 * - repasse: moto de terceiro em consignação (KEU vende e fica com %)
 */
export type MotoOrigem = "propria" | "comprada" | "repasse";

/**
 * Setores da KEU Empreendimentos (uma loja, três setores):
 */
export type MotoSetor = "multimarcas" | "loca" | "pecas";

export type Combustivel = "gasolina" | "flex" | "eletrica";

export type Cambio = "manual" | "automatico" | "semi-automatico" | "cvt";

export type Partida = "eletrica" | "pedal" | "ambas";

export interface Proprietario {
  id: string;
  nome: string;
  cpf: string;
  rg?: string;
  cnh?: string;
  dataNascimento?: string;
  email?: string;
  telefone: string;
  whatsapp?: string;

  // Endereço
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;

  // Bancário (para repasse — pagar quando vender)
  pixTipo?: "cpf" | "email" | "telefone" | "aleatoria";
  pixChave?: string;
  banco?: string;
  agencia?: string;
  conta?: string;

  // Fotos e documentos (todos como base64 comprimidos)
  fotoPessoal?: string;
  fotoCnh?: string;
  fotoComprovanteResidencia?: string;
  fotoDocMoto?: string; // CRLV

  observacoes?: string;
  criadoEm: string;
}

export interface AquisicaoCompra {
  // Valores
  valorPago: number;
  formaPagamento: "pix" | "dinheiro" | "transferencia" | "troca" | "cheque";
  numeroNotaFiscal?: string;
  dataAquisicao: string;
}

export interface AquisicaoRepasse {
  // Acordo com o proprietário
  valorCombinadoDono: number; // valor que o dono quer receber
  tipoComissao: "percentual" | "fixo";
  comissaoPercentual?: number; // ex: 7 (= 7%)
  comissaoFixa?: number; // valor R$
  prazoConsignacao: number; // dias
  dataInicioConsignacao: string;
  contratoAssinado: boolean;
  observacoesAcordo?: string;
}

export interface Moto {
  id: string;
  // Identificação
  marca: string;
  modelo: string;
  versao?: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  placa?: string;

  // Documentação
  chassi?: string;
  renavam?: string;
  numeroMotor?: string;

  // Técnico
  cilindrada: number;
  combustivel: Combustivel;
  cambio: Cambio;
  partida?: Partida;
  km: number;
  potencia?: string;

  // Comercial - VALORES
  valorFipe: number;
  valorCompra: number; // 0 se for repasse (não pagamos pela moto)
  valorAnunciado: number;
  valorMinimo: number;
  comissao?: number;

  // Aluguel (opcional)
  valorDiaria?: number;
  valorSemanal?: number;
  valorMensal?: number;
  caucao?: number;

  // Status & tipo
  tipo: MotoTipo;
  status: MotoStatus;
  destaque?: boolean;

  // ORIGEM / AQUISIÇÃO
  origem: MotoOrigem;
  proprietarioId?: string;
  proprietarioNome?: string; // cache para listagens
  compra?: AquisicaoCompra;
  repasse?: AquisicaoRepasse;

  // Mídia
  fotos: string[];
  descricao?: string;
  observacoes?: string;

  // Auditoria
  dataEntrada: string;
  vendedorResponsavel?: string;
  setor: MotoSetor;
}

export interface Contato {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  origem: "site" | "instagram" | "whatsapp" | "presencial" | "indicacao";
  interesse: "compra" | "venda" | "troca" | "aluguel" | "pecas" | "outro";
  motoInteresse?: string;
  observacoes?: string;
  status: "novo" | "em-atendimento" | "convertido" | "perdido";
  vendedorResponsavel?: string;
  criadoEm: string;
  ultimoContato?: string;
}

export interface Venda {
  id: string;
  motoId: string;
  motoModelo: string;
  clienteId: string;
  clienteNome: string;
  vendedorId: string;
  vendedorNome: string;
  valorVendido: number;
  formaPagamento: "a-vista" | "financiado" | "cartao" | "consorcio" | "troca";
  parcelas?: number;
  comissao: number;
  // Para vendas de repasse: lucro real é (valorVendido - valorCombinadoDono - comissaoVendedor)
  data: string;
  status: "concluida" | "pendente" | "cancelada";
}

export interface Aluguel {
  id: string;
  motoId: string;
  motoModelo: string;
  clienteId: string;
  clienteNome: string;
  vendedorId: string;
  dataInicio: string;
  dataFim: string;
  valorTotal: number;
  caucao: number;
  status: "ativo" | "concluido" | "atrasado" | "cancelado";
  km_inicial?: number;
  km_final?: number;
  observacoes?: string;
}
