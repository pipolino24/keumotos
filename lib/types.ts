export type UserRole = "admin" | "vendedor" | "cliente";

export type UserStatus = "ativo" | "inativo" | "pendente";

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  criadoEm: string;
  ultimoAcesso?: string;
  vendasRealizadas?: number;
  comissaoTotal?: number;
}

export type MotoStatus =
  | "disponivel"
  | "reservada"
  | "vendida"
  | "alugada"
  | "manutencao";

export type MotoTipo = "venda" | "aluguel" | "ambos";

export type Combustivel = "gasolina" | "flex" | "eletrica";

export type Cambio = "manual" | "automatico" | "semi-automatico" | "cvt";

export type Partida = "eletrica" | "pedal" | "ambas";

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
  valorCompra: number;
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

  // Mídia
  fotos: string[];
  descricao?: string;
  observacoes?: string;

  // Auditoria
  dataEntrada: string;
  vendedorResponsavel?: string;
  fornecedor?: string;
  loja: "multimarcas" | "loca" | "pecas";
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
