/**
 * Helpers de parcelas de locação.
 *
 * Locação periódica = cliente paga em ciclos (7/15/30 dias ou custom).
 * Cada parcela é uma cobrança individual com vencimento próprio.
 * Inadimplência é derivada: parcela.vencimento < hoje && status !== "paga".
 */

import type {
  IParcelaLocacaoDoc,
  StatusParcelaLocacao,
} from "@/lib/models/aluguel";

export interface GerarParcelasInput {
  dataInicio: Date;
  numParcelas: number;
  cicloDias: number; // 7 (semanal), 15 (quinzenal), 30 (mensal) ou custom
  valorParcela: number;
}

/**
 * Gera N parcelas distribuídas no tempo a partir de dataInicio.
 *
 * Primeira parcela vence em (dataInicio + cicloDias). Última parcela vence em
 * (dataInicio + cicloDias * N). Tudo zerado em status="pendente" — cliente
 * pode pagar quando quiser e marcamos paga depois.
 *
 * Por que cicloDias e não enum? Permite "personalizado" (a cada 10 dias, etc.)
 * sem ramificar a lógica.
 */
export function gerarParcelasLocacao(
  input: GerarParcelasInput
): IParcelaLocacaoDoc[] {
  const { dataInicio, numParcelas, cicloDias, valorParcela } = input;
  if (numParcelas <= 0) return [];
  if (cicloDias <= 0) {
    throw new Error("cicloDias deve ser positivo");
  }
  if (valorParcela < 0) {
    throw new Error("valorParcela não pode ser negativo");
  }

  const parcelas: IParcelaLocacaoDoc[] = [];
  for (let i = 1; i <= numParcelas; i++) {
    const venc = new Date(dataInicio.getTime());
    venc.setDate(venc.getDate() + cicloDias * i);
    parcelas.push({
      numero: i,
      vencimento: venc,
      valor: valorParcela,
      status: "pendente",
      registradoEm: new Date(),
    });
  }
  return parcelas;
}

/**
 * Calcula status real de uma parcela considerando data atual.
 * Atrasada = não paga e venceu.
 */
export function statusReal(
  p: Pick<IParcelaLocacaoDoc, "status" | "vencimento">,
  hoje: Date = new Date()
): StatusParcelaLocacao {
  if (p.status === "paga") return "paga";
  if (p.vencimento.getTime() < hoje.getTime()) return "atrasada";
  return "pendente";
}

/**
 * Multa + juros pra parcela atrasada.
 *
 * multa = valor * multaPercent/100 (uma vez só, no momento do atraso)
 * juros = valor * jurosDiaPercent/100 * dias_atraso (acumula diariamente)
 *
 * Retorna { multa, juros, total } onde total = valor + multa + juros.
 */
export function calcularMultaJuros(
  parcela: Pick<IParcelaLocacaoDoc, "valor" | "vencimento">,
  multaPercent: number,
  jurosDiaPercent: number,
  hoje: Date = new Date()
): { multa: number; juros: number; total: number; diasAtraso: number } {
  const diasMs = hoje.getTime() - parcela.vencimento.getTime();
  const diasAtraso = Math.max(0, Math.floor(diasMs / (24 * 60 * 60 * 1000)));
  if (diasAtraso === 0) {
    return { multa: 0, juros: 0, total: parcela.valor, diasAtraso: 0 };
  }
  const multa = (parcela.valor * multaPercent) / 100;
  const juros = (parcela.valor * jurosDiaPercent * diasAtraso) / 100;
  return {
    multa: Math.round(multa * 100) / 100,
    juros: Math.round(juros * 100) / 100,
    total: Math.round((parcela.valor + multa + juros) * 100) / 100,
    diasAtraso,
  };
}

/**
 * Resumo de inadimplência de um aluguel.
 *
 * Agrega todas as parcelas atrasadas + calcula total devido (valor + multa + juros).
 * Usado no dashboard de cobrança e no detalhe do aluguel.
 */
export function resumoInadimplencia(
  parcelas: IParcelaLocacaoDoc[],
  multaPercent: number = 10,
  jurosDiaPercent: number = 2,
  hoje: Date = new Date()
): {
  parcelasAtrasadas: number;
  diasAtrasoMaiorParcela: number;
  totalDevido: number;
  totalMultas: number;
  totalJuros: number;
  proximaParcelaEm?: Date;
} {
  let parcelasAtrasadas = 0;
  let diasAtrasoMaiorParcela = 0;
  let totalDevido = 0;
  let totalMultas = 0;
  let totalJuros = 0;
  let proximaPendente: Date | undefined;

  for (const p of parcelas) {
    if (p.status === "paga") continue;
    if (p.vencimento.getTime() < hoje.getTime()) {
      // Atrasada
      const calc = calcularMultaJuros(p, multaPercent, jurosDiaPercent, hoje);
      parcelasAtrasadas++;
      totalDevido += calc.total;
      totalMultas += calc.multa;
      totalJuros += calc.juros;
      if (calc.diasAtraso > diasAtrasoMaiorParcela) {
        diasAtrasoMaiorParcela = calc.diasAtraso;
      }
    } else {
      // Pendente futura — guarda a mais próxima
      if (!proximaPendente || p.vencimento < proximaPendente) {
        proximaPendente = p.vencimento;
      }
    }
  }

  return {
    parcelasAtrasadas,
    diasAtrasoMaiorParcela,
    totalDevido: Math.round(totalDevido * 100) / 100,
    totalMultas: Math.round(totalMultas * 100) / 100,
    totalJuros: Math.round(totalJuros * 100) / 100,
    proximaParcelaEm: proximaPendente,
  };
}
