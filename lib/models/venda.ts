import mongoose, { Schema, Model } from "mongoose";

/**
 * Forma de pagamento de uma parcela da venda.
 *
 * - dinheiro / pix / transferencia / cartao-debito: pago à vista naquela parte
 * - cartao-credito: parcelado no cartão do cliente — só guardamos o número
 *   de parcelas para registro
 * - financiamento-banco: cliente financiou com banco externo (Itaú, Santander,
 *   BV, etc) — KEU recebe o valor à vista do banco
 * - parcelado-loja: o cliente parcelou DIRETO com a loja, sem banco. Aqui
 *   precisamos rastrear quantas parcelas foram acordadas e quantas já foram
 *   recebidas para o financeiro.
 * - troca: cliente deu outra moto/veículo como parte do pagamento
 * - cheque / consorcio: registros menos comuns
 */
export type FormaPagamento =
  | "dinheiro"
  | "pix"
  | "transferencia"
  | "cartao-debito"
  | "cartao-credito"
  | "financiamento-banco"
  | "parcelado-loja"
  | "troca"
  | "cheque"
  | "consorcio";

export interface IPagamentoDoc {
  forma: FormaPagamento;
  valor: number;

  // Apenas quando forma = "cartao-credito": parcelas no cartão do cliente
  parcelasCartao?: number;

  // Apenas quando forma = "parcelado-loja": parcelamento direto da KEU
  parcelasLoja?: number; // total acordado
  parcelasPagasLoja?: number; // quantas já entraram (financeiro)
  valorParcelaLoja?: number; // valor de cada parcela
  primeiraParcelaEm?: Date;
  proximaParcelaEm?: Date;

  // Apenas quando forma = "financiamento-banco"
  banco?: string;
  numeroContratoBanco?: string;
  parcelasContrato?: number;

  // Apenas quando forma = "troca"
  itemRecebido?: string; // ex: "Honda CG 150 2018 placa XYZ"

  observacao?: string;
  registradoEm: Date;
}

export interface IVendaDoc {
  motoId: mongoose.Types.ObjectId;
  motoModelo: string;
  motoMarca?: string;
  motoAno?: number;
  motoValorAnunciado?: number;
  motoValorMinimo?: number;

  clienteId?: mongoose.Types.ObjectId;
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  clienteCpf?: string;

  vendedorId: string;
  vendedorNome: string;

  valorVendido: number;

  // Múltiplas formas de pagamento (uma venda pode ter PIX + cartão + troca, etc)
  pagamentos: IPagamentoDoc[];

  comissao: number;

  status: "pendente" | "concluida" | "cancelada";
  data: Date;
  observacoes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const PagamentoSchema = new Schema<IPagamentoDoc>(
  {
    forma: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    valor: { type: Number, required: true, min: 0 },
    parcelasCartao: { type: Number, min: 1 },
    parcelasLoja: { type: Number, min: 1 },
    parcelasPagasLoja: { type: Number, min: 0, default: 0 },
    valorParcelaLoja: { type: Number, min: 0 },
    primeiraParcelaEm: Date,
    proximaParcelaEm: Date,
    banco: String,
    numeroContratoBanco: String,
    parcelasContrato: { type: Number, min: 1 },
    itemRecebido: String,
    observacao: String,
    registradoEm: { type: Date, default: Date.now },
  },
  { _id: true }
);

const VendaSchema = new Schema<IVendaDoc>(
  {
    motoId: {
      type: Schema.Types.ObjectId,
      ref: "Moto",
      required: true,
      index: true,
    },
    motoModelo: { type: String, required: true },
    motoMarca: String,
    motoAno: Number,
    motoValorAnunciado: Number,
    motoValorMinimo: Number,

    clienteId: { type: Schema.Types.ObjectId, ref: "User" },
    clienteNome: { type: String, required: true },
    clienteTelefone: String,
    clienteEmail: String,
    clienteCpf: String,

    vendedorId: { type: String, required: true, index: true },
    vendedorNome: { type: String, required: true },

    valorVendido: { type: Number, required: true, min: 0 },
    pagamentos: { type: [PagamentoSchema], default: [], required: true },
    comissao: { type: Number, required: true, min: 0, default: 0 },

    status: {
      type: String,
      enum: ["pendente", "concluida", "cancelada"],
      required: true,
      default: "concluida",
      index: true,
    },
    data: { type: Date, required: true, default: Date.now, index: true },
    observacoes: String,
  },
  { timestamps: true }
);

export const Venda: Model<IVendaDoc> =
  mongoose.models.Venda || mongoose.model<IVendaDoc>("Venda", VendaSchema);
