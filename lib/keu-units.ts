/**
 * Configuração das unidades KEU e seus contatos.
 *
 * Antes os telefones de WhatsApp estavam hardcoded em 5+ arquivos
 * apontando todos pro mesmo (5588998505859 = Multimarcas). Leads de
 * locação iam pro número errado, leads de peças também.
 *
 * Pra mudar um telefone, edite AQUI — todos os botões/links seguem.
 */

export type KeuUnidadeKey = "multimarcas" | "loca" | "pecas";

export interface KeuUnidade {
  /** Chave estável pra usar em código */
  key: KeuUnidadeKey;
  /** Nome de exibição */
  nome: string;
  /** Linha curta pra usar em botões/help text */
  apelido: string;
  /**
   * Telefone E.164 sem o "+" — formato esperado pelo wa.me.
   * 55 = Brasil, 88 = DDD do Cariri (Juazeiro do Norte / Crato).
   */
  whatsappE164: string;
  /** Telefone formatado pro humano (88) XXXX-XXXX */
  telefoneHumano: string;
  /** Endereço (futuro — pra Google Maps) */
  endereco?: string;
  /** Quando usar essa unidade — pra texto de help */
  oQueOferece: string;
}

export const KEU_UNIDADES: Record<KeuUnidadeKey, KeuUnidade> = {
  multimarcas: {
    key: "multimarcas",
    nome: "KEU Multimarcas",
    apelido: "Multimarcas",
    whatsappE164: "5588998505859",
    telefoneHumano: "(88) 99850-5859",
    oQueOferece: "Compra, venda e troca de motos seminovas",
  },
  loca: {
    key: "loca",
    nome: "KEU Loca Motos",
    apelido: "Loca Motos",
    // Mesmo número da Moto Peças (conforme tabela operacional do dono)
    whatsappE164: "5588988143757",
    telefoneHumano: "(88) 98814-3757",
    oQueOferece: "Locação semanal, mensal e plano Conquista",
  },
  pecas: {
    key: "pecas",
    nome: "KEU Moto Peças",
    apelido: "Moto Peças",
    whatsappE164: "5588988143757",
    telefoneHumano: "(88) 98814-3757",
    oQueOferece: "Peças, acessórios e serviços de manutenção",
  },
};

/**
 * Quando se sabe só o "tipo" da moto/intenção, mapeia pra unidade.
 *  - "venda" / "ambos" / undefined → Multimarcas (vende)
 *  - "aluguel" → Loca Motos
 *  - "pecas" / "manutencao" → Moto Peças
 */
export function unidadePorTipo(
  tipo?: "venda" | "aluguel" | "ambos" | "pecas" | "manutencao" | null
): KeuUnidade {
  if (tipo === "aluguel") return KEU_UNIDADES.loca;
  if (tipo === "pecas" || tipo === "manutencao") return KEU_UNIDADES.pecas;
  return KEU_UNIDADES.multimarcas;
}

/**
 * Gera link wa.me pronto. `texto` é encodado uma vez aqui — não passe
 * encodeURIComponent já feito.
 */
export function whatsappLink(
  unidade: KeuUnidade | KeuUnidadeKey,
  texto?: string
): string {
  const u =
    typeof unidade === "string" ? KEU_UNIDADES[unidade] : unidade;
  const base = `https://wa.me/${u.whatsappE164}`;
  if (!texto) return base;
  return `${base}?text=${encodeURIComponent(texto)}`;
}
