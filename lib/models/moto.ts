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
  valorAnunciado: number;
  valorMinimo: number;
  comissao?: number;
  valorDiaria?: number;
  valorSemanal?: number;
  valorMensal?: number;
  caucao?: number;
  tipo: "venda" | "aluguel" | "ambos";
  status: "disponivel" | "reservada" | "vendida" | "alugada" | "manutencao";
  destaque?: boolean;
  fotos: string[];
  descricao?: string;
  observacoes?: string;
  dataEntrada: Date;
  vendedorResponsavel?: string;
  fornecedor?: string;
  loja: "multimarcas" | "loca" | "pecas";
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
      enum: ["disponivel", "reservada", "vendida", "alugada", "manutencao"],
      required: true,
      default: "disponivel",
      index: true,
    },
    destaque: { type: Boolean, default: false },
    fotos: { type: [String], default: [] },
    descricao: String,
    observacoes: String,
    dataEntrada: { type: Date, required: true, default: Date.now },
    vendedorResponsavel: String,
    fornecedor: String,
    loja: {
      type: String,
      enum: ["multimarcas", "loca", "pecas"],
      required: true,
      default: "multimarcas",
    },
  },
  { timestamps: true }
);

export const Moto: Model<IMotoDoc> =
  mongoose.models.Moto || mongoose.model<IMotoDoc>("Moto", MotoSchema);
