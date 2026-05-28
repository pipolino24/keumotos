import mongoose, { Schema, Model } from "mongoose";

export interface IMotoDoc {
  marca: string;
  modelo: string;
  versao?: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  placa?: string;
  chassi?: string;
  renavam?: string;
  numeroMotor?: string;
  cilindrada: number;
  combustivel: "gasolina" | "flex" | "eletrica";
  cambio: "manual" | "automatico" | "semi-automatico" | "cvt";
  partida?: "eletrica" | "pedal" | "ambas";
  km: number;
  potencia?: string;
  valorFipe: number;
  valorCompra: number;
  // Manutenções/reformas feitas pela KEU antes de colocar à venda
  // (troca de peça, pintura, retífica, etc). Cada item soma no custo
  // total (valorCompra + Σ manutencoesIniciais.valor). Usado pra calcular
  // margem real e dar visibilidade do que foi investido na moto.
  manutencoesIniciais?: { descricao: string; valor: number; data?: Date }[];
  valorAnunciado: number;
  valorMinimo: number;
  comissao?: number;
  valorDiaria?: number;
  valorSemanal?: number;
  valorMensal?: number;
  caucao?: number;
  tipo: "venda" | "aluguel" | "ambos";
  status:
    | "disponivel"
    | "lavagem"
    | "reservada"
    | "vendida"
    | "alugada"
    | "manutencao"
    | "devolvida";
  destaque?: boolean;
  fotos: string[];
  // CRLV/CRV do veículo (frente e/ou verso). Pode subir 1 ou 2 imagens —
  // documentos NÃO aparecem no catálogo público, são internos pra prova
  // de propriedade durante venda/transferência.
  documentos?: string[];
  descricao?: string;
  observacoes?: string;
  dataEntrada: Date;
  vendedorResponsavel?: string;

  // Origem / aquisição
  origem: "propria" | "comprada" | "repasse";
  proprietarioId?: mongoose.Types.ObjectId;
  proprietarioNome?: string;
  compra?: {
    valorPago: number;
    formaPagamento: "pix" | "dinheiro" | "transferencia" | "troca" | "cheque";
    numeroNotaFiscal?: string;
    dataAquisicao: Date;
  };
  repasse?: {
    valorCombinadoDono: number;
    tipoComissao: "percentual" | "fixo";
    comissaoPercentual?: number;
    comissaoFixa?: number;
    prazoConsignacao: number;
    dataInicioConsignacao: Date;
    contratoAssinado: boolean;
    observacoesAcordo?: string;
  };

  setor: "multimarcas" | "loca" | "pecas";

  // Contador de visualizações na página de detalhe (incrementado via
  // /api/interesses POST com tipo="visualizou"). Usado pra ranking
  // de motos mais visadas.
  viewCount?: number;

  createdAt: Date;
  updatedAt: Date;
}

const MotoSchema = new Schema<IMotoDoc>(
  {
    marca: { type: String, required: true, index: true },
    modelo: { type: String, required: true, index: true },
    versao: String,
    anoFabricacao: { type: Number, required: true },
    anoModelo: { type: Number, required: true },
    cor: { type: String, required: true },
    placa: { type: String, uppercase: true, sparse: true, index: true },
    chassi: { type: String, uppercase: true },
    renavam: String,
    numeroMotor: String,
    cilindrada: { type: Number, required: true },
    combustivel: {
      type: String,
      enum: ["gasolina", "flex", "eletrica"],
      required: true,
    },
    cambio: {
      type: String,
      enum: ["manual", "automatico", "semi-automatico", "cvt"],
      required: true,
    },
    partida: { type: String, enum: ["eletrica", "pedal", "ambas"] },
    km: { type: Number, required: true, min: 0 },
    potencia: String,
    valorFipe: { type: Number, required: true, min: 0 },
    valorCompra: { type: Number, required: true, min: 0 },
    manutencoesIniciais: {
      type: [
        {
          descricao: { type: String, required: true },
          valor: { type: Number, required: true, min: 0 },
          data: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    valorAnunciado: { type: Number, required: true, min: 0 },
    valorMinimo: { type: Number, required: true, min: 0 },
    comissao: { type: Number, min: 0 },
    valorDiaria: { type: Number, min: 0 },
    valorSemanal: { type: Number, min: 0 },
    valorMensal: { type: Number, min: 0 },
    caucao: { type: Number, min: 0 },
    tipo: {
      type: String,
      enum: ["venda", "aluguel", "ambos"],
      required: true,
      default: "venda",
    },
    status: {
      type: String,
      enum: [
        "disponivel",
        "lavagem",
        "reservada",
        "vendida",
        "alugada",
        "manutencao",
        "devolvida",
      ],
      required: true,
      default: "disponivel",
      index: true,
    },
    destaque: { type: Boolean, default: false },
    fotos: { type: [String], default: [] },
    documentos: { type: [String], default: [] },
    descricao: String,
    observacoes: String,
    dataEntrada: { type: Date, required: true, default: Date.now },
    vendedorResponsavel: String,

    origem: {
      type: String,
      enum: ["propria", "comprada", "repasse"],
      required: true,
      default: "comprada",
      index: true,
    },
    proprietarioId: { type: Schema.Types.ObjectId, ref: "Proprietario" },
    proprietarioNome: String,
    compra: {
      valorPago: Number,
      formaPagamento: {
        type: String,
        enum: ["pix", "dinheiro", "transferencia", "troca", "cheque"],
      },
      numeroNotaFiscal: String,
      dataAquisicao: Date,
    },
    repasse: {
      valorCombinadoDono: Number,
      tipoComissao: { type: String, enum: ["percentual", "fixo"] },
      comissaoPercentual: Number,
      comissaoFixa: Number,
      prazoConsignacao: Number,
      dataInicioConsignacao: Date,
      contratoAssinado: { type: Boolean, default: false },
      observacoesAcordo: String,
    },

    setor: {
      type: String,
      enum: ["multimarcas", "loca", "pecas"],
      required: true,
      default: "multimarcas",
    },

    viewCount: { type: Number, default: 0, min: 0, index: true },
  },
  { timestamps: true }
);

// Compound ESR pra catálogo público — filtra por status+tipo, ordena destaques
// primeiro e usa valorAnunciado como range filter.
MotoSchema.index({ status: 1, tipo: 1, destaque: -1, valorAnunciado: 1 });
// Aquisições: lista por origem ordenada por data
MotoSchema.index({ origem: 1, createdAt: -1 });
// Estoque por setor
MotoSchema.index({ setor: 1, status: 1 });
// Unicidade soft (sparse) pra chassi e renavam — POST /api/motos faz
// exists check com regex case-insensitive antes de criar. Sem index, o
// check faz collscan a cada cadastro. Ano sparse pra permitir vazio.
MotoSchema.index({ chassi: 1 }, { sparse: true });
MotoSchema.index({ renavam: 1 }, { sparse: true });
// Anos pra filtros do catálogo público
MotoSchema.index({ anoModelo: -1, status: 1 });

export const Moto: Model<IMotoDoc> =
  mongoose.models.Moto || mongoose.model<IMotoDoc>("Moto", MotoSchema);
