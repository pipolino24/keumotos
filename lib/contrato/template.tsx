/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import type { IPessoaSnap, IMotoSnap, IPlanoSnap } from "@/lib/models/contrato";

// Tenta usar Helvetica (built-in). Sem font embedding remoto pra evitar
// dependência externa que pode travar o build na Vercel.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 60,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    lineHeight: 1.4,
    color: "#000",
  },
  header: {
    alignItems: "center",
    marginBottom: 14,
  },
  logoBox: {
    width: 200,
    height: 90,
    objectFit: "contain",
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 6,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderColor: "#000",
    borderWidth: 1,
    marginBottom: 8,
  },
  row: { flexDirection: "row" },
  cell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 4,
    minHeight: 18,
    fontSize: 9,
  },
  cellLabel: {
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f1f1f1",
  },
  partyLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  introA: {
    fontSize: 9.5,
    marginBottom: 8,
    lineHeight: 1.5,
  },
  clauseTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  list: {
    marginLeft: 8,
    marginBottom: 6,
  },
  listItem: { marginBottom: 2 },
  pageNumber: {
    position: "absolute",
    bottom: 28,
    right: 36,
    fontSize: 8,
    color: "#555",
  },
  signatureBlock: {
    marginTop: 60,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderColor: "#000",
    height: 30,
    marginBottom: 4,
  },
  centerText: { textAlign: "center" },
});

// Tabela 2-colunas (label + valor) lado a lado, repetida 2x por linha
function FieldRow({
  fields,
}: {
  fields: { label: string; value?: string | number }[];
}) {
  // sempre par; junta de 2 em 2
  const pairs: { label: string; value?: string | number }[][] = [];
  for (let i = 0; i < fields.length; i += 2) {
    pairs.push(fields.slice(i, i + 2));
  }
  return (
    <View style={styles.table}>
      {pairs.map((pair, idx) => (
        <View key={idx} style={styles.row}>
          {pair.map((f, j) => (
            <View key={j} style={{ flex: 1, flexDirection: "row" }}>
              <View
                style={[
                  styles.cell,
                  styles.cellLabel,
                  { width: 70, borderLeftWidth: idx === 0 && j === 0 ? 0 : 0 },
                ]}
              >
                <Text>{f.label}</Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text>{f.value ? String(f.value) : ""}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function fmtMoney(v: number | undefined) {
  if (typeof v !== "number") return "";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Formatação manual (sem depender de Intl locale pt-BR — Vercel functions
// normalmente rodam em C/POSIX locale, daí "long" devolve em inglês).
const MESES_PT = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];
function fmtDate(d: Date | string | undefined) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return String(d);
  const dia = String(dt.getDate()).padStart(2, "0");
  const mes = MESES_PT[dt.getMonth()];
  const ano = dt.getFullYear();
  return `${dia} DE ${mes} DE ${ano}`;
}

/**
 * Deriva periodicidade ("quinzenais", "mensais", "semanais") a partir da
 * string `datasVencimento` informada pelo staff. Default: "mensais".
 * "06 e 21" → quinzenais (2 datas no mês), "todo dia 5" → mensais,
 * "5 e 20" → quinzenais.
 */
function periodicidade(datas?: string): string {
  if (!datas) return "mensais";
  // Conta números no string — 2+ = quinzenal/dupla
  const numbers = datas.match(/\d+/g) || [];
  if (numbers.length >= 2) return "quinzenais";
  if (/semana/i.test(datas)) return "semanais";
  return "mensais";
}

export interface ContratoPdfProps {
  numero?: string;
  contratante: IPessoaSnap;
  avalista?: IPessoaSnap | null;
  moto: IMotoSnap;
  plano: IPlanoSnap;
  observacoes?: string;
  dataContrato: Date | string;
  /**
   * Logo opcional como data URI (base64). Se não vier, o cabeçalho
   * renderiza apenas o texto "KEU LOCA MOTOS". Mantém PDF leve
   * quando logo não está pronto.
   */
  logoDataUrl?: string;
}

export function ContratoPdf({
  numero,
  contratante,
  avalista,
  moto,
  plano,
  observacoes,
  dataContrato,
  logoDataUrl,
}: ContratoPdfProps) {
  const hasAvalista = avalista && avalista.nome && avalista.nome.trim();

  return (
    <Document
      title={`Contrato KEU Loca Motos${numero ? ` ${numero}` : ""}`}
      author="KEU Loca Motos"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logoDataUrl ? (
            <Image src={logoDataUrl} style={styles.logoBox} />
          ) : (
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 22 }}>
              KEU LOCA MOTOS
            </Text>
          )}
          <Text style={{ fontSize: 8, color: "#666" }}>Realizando Sonhos</Text>
        </View>

        <Text style={styles.sectionTitle}>I – DA IDENTIFICAÇÃO DAS PARTES</Text>
        <Text style={styles.introA}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>
            A– CONTRATADA/LOCADORA:
          </Text>{" "}
          JOSICLEUDO FERREIRA CRUZ denominada apenas por KEU LOCA MOTOS, CPF:
          061.104.423-48, Endereço: Rua José Lopes de Oliveira, nº 741, Bairro
          João Cabral, Juazeiro do Norte – CE, Telefone: (88) 99850-5859
        </Text>

        <Text style={styles.partyLabel}>B– CONTRATANTE:</Text>
        <FieldRow
          fields={[
            { label: "NOME", value: contratante.nome },
            { label: "SEXO", value: contratante.sexo },
            { label: "NASCIMENTO", value: contratante.nascimento },
            { label: "CNH", value: contratante.cnh },
            { label: "NATURAL", value: contratante.natural },
            { label: "PROFISSÃO", value: contratante.profissao },
            { label: "CPF", value: contratante.cpf },
            { label: "RG", value: contratante.rg },
          ]}
        />
        {/* Linhas de largura total */}
        <View style={[styles.table, { marginTop: -8 }]}>
          <View style={styles.row}>
            <View
              style={[styles.cell, styles.cellLabel, { width: 70 }]}
            >
              <Text>ENDEREÇO</Text>
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text>{contratante.endereco ?? ""}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.cellLabel, { width: 70 }]}>
              <Text>CONTATOS</Text>
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text>{contratante.telefone ?? ""}</Text>
            </View>
            <View style={[styles.cell, styles.cellLabel, { width: 50 }]}>
              <Text>EMAIL</Text>
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text>{contratante.email ?? ""}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.partyLabel}>C – DADOS DO AVALISTA VOLUNTÁRIO:</Text>
        <FieldRow
          fields={[
            { label: "NOME", value: hasAvalista ? avalista?.nome : "" },
            { label: "SEXO", value: avalista?.sexo },
            { label: "NASCIMENTO", value: avalista?.nascimento },
            { label: "CNH", value: avalista?.cnh },
            { label: "NATURAL", value: avalista?.natural },
            { label: "PROFISSÃO", value: avalista?.profissao },
            { label: "CPF", value: avalista?.cpf },
            { label: "RG", value: avalista?.rg },
          ]}
        />
        <View style={[styles.table, { marginTop: -8 }]}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.cellLabel, { width: 70 }]}>
              <Text>ENDEREÇO</Text>
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text>{avalista?.endereco ?? ""}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.cellLabel, { width: 70 }]}>
              <Text>CONTATOS</Text>
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text>{avalista?.telefone ?? ""}</Text>
            </View>
            <View style={[styles.cell, styles.cellLabel, { width: 50 }]}>
              <Text>EMAIL</Text>
            </View>
            <View style={[styles.cell, { flex: 1 }]}>
              <Text>{avalista?.email ?? ""}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          II – O presente contrato tem como objeto a locação de uma motocicleta
          de propriedade da LOCADORA ao LOCATÁRIO, conforme especificações
          abaixo:
        </Text>
        <FieldRow
          fields={[
            { label: "MARCA", value: moto.marca },
            { label: "CHASSI", value: moto.chassi },
            { label: "MODELO", value: moto.modelo },
            { label: "PLACA", value: moto.placa },
            {
              label: "ANO/MODELO",
              value: moto.anoModelo ? String(moto.anoModelo) : "",
            },
            {
              label: "KM",
              value: typeof moto.km === "number" ? `${moto.km} km` : "",
            },
            { label: "COR", value: moto.cor },
            { label: "OBS.", value: moto.obs },
          ]}
        />

        <Text style={styles.sectionTitle}>
          III – DO VALOR DA CONTRATAÇÃO, CONDIÇÕES DO PLANO E ENCARGOS:
        </Text>
        <FieldRow
          fields={[
            {
              label: "PARCELAS",
              value: `${plano.parcelas} PARCELAS`,
            },
            {
              label: "ENTRADA",
              value: fmtMoney(plano.valorEntrada),
            },
            {
              label: "VALOR PARCELA",
              value: fmtMoney(plano.valorParcela),
            },
            {
              label: "PLANO",
              value: plano.planoEscolhido,
            },
            {
              label: "MULTA ATRASO",
              value: `${plano.multaPercent}%`,
            },
            {
              label: "VENCIMENTOS",
              value: plano.datasVencimento,
            },
            {
              label: "JUROS/DIA",
              value: `${plano.jurosDiaPercent}% ao dia`,
            },
            {
              label: "1º VENCTO",
              value: plano.vencimentoPrimeira,
            },
          ]}
        />
        {observacoes ? (
          <View style={[styles.table, { marginTop: -8 }]}>
            <View style={styles.row}>
              <View style={[styles.cell, styles.cellLabel, { width: 90 }]}>
                <Text>Observações</Text>
              </View>
              <View style={[styles.cell, { flex: 1 }]}>
                <Text>{observacoes}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Pag. ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* PÁGINA 2 — CLÁUSULAS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.clauseTitle}>CLÁUSULA IV – OPÇÃO DE QUITAÇÃO</Text>
        <Text style={styles.paragraph}>
          Ao final das {plano.parcelas} parcelas {periodicidade(plano.datasVencimento)},
          estando todos os pagamentos devidamente quitados, o LOCATÁRIO terá
          direito à transferência do veículo para seu nome, ficando desde já
          ciente de que todas as despesas relativas à transferência serão de
          sua inteira responsabilidade, incluindo, mas não se limitando a:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Taxas de cartório</Text>
          <Text style={styles.listItem}>• Taxas do DETRAN</Text>
          <Text style={styles.listItem}>• Emolumentos</Text>
          <Text style={styles.listItem}>
            • Qualquer outro custo necessário para efetivação da transferência
          </Text>
        </View>

        <Text style={styles.clauseTitle}>
          CLÁUSULA V – RESPONSABILIDADES DO LOCATÁRIO
        </Text>
        <Text style={styles.paragraph}>O LOCATÁRIO se compromete a:</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Zelar pela motocicleta</Text>
          <Text style={styles.listItem}>• Realizar manutenções básicas</Text>
          <Text style={styles.listItem}>
            • Não utilizar o veículo para fins ilícitos
          </Text>
          <Text style={styles.listItem}>
            • Não emprestar a terceiros sem autorização
          </Text>
          <Text style={styles.listItem}>
            • Arcar com multas, infrações e danos
          </Text>
        </View>

        <Text style={styles.clauseTitle}>
          CLÁUSULA VI – SEGURO E SINISTROS
        </Text>
        <Text style={styles.paragraph}>
          Em caso de roubo, furto ou perda total:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>
            • O LOCATÁRIO deverá comunicar imediatamente à LOCADORA, bem como
            comparecer à delegacia e realizar o B.O (Boletim de Ocorrência) do
            sinistro.
          </Text>
          <Text style={styles.listItem}>
            • Realizar o pagamento de franquia no valor de R$ 1.500,00 (Um mil
            e quinhentos reais)
          </Text>
          <Text style={styles.listItem}>
            • O veículo será substituído em até 30 dias a contar da data do
            sinistro
          </Text>
          <Text style={styles.listItem}>
            • Permanecerá responsável pelo cumprimento integral dos pagamentos
            previstos neste contrato
          </Text>
        </View>

        <Text style={styles.clauseTitle}>CLÁUSULA VII – RESCISÃO</Text>
        <Text style={styles.paragraph}>
          O contrato poderá ser rescindido em caso de:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Atraso superior a 10 dias</Text>
          <Text style={styles.listItem}>• Uso indevido do veículo</Text>
          <Text style={styles.listItem}>• Descumprimento das cláusulas</Text>
        </View>
        <Text style={styles.paragraph}>
          Neste caso, a motocicleta será retomada pela LOCADORA, sem devolução
          dos valores pagos.
        </Text>

        <Text style={styles.clauseTitle}>
          CLÁUSULA VIII – DISPOSIÇÕES GERAIS
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>
            • Este contrato é irrevogável e irretratável
          </Text>
          <Text style={styles.listItem}>
            • Qualquer alteração deverá ser feita por escrito
          </Text>
        </View>

        <Text style={styles.clauseTitle}>
          CLÁUSULA IX – MANUTENÇÃO DO VEÍCULO
        </Text>
        <Text style={styles.paragraph}>
          A manutenção da motocicleta será de responsabilidade total do
          LOCATÁRIO, incluindo revisões periódicas, trocas de peças, serviços
          mecânicos e quaisquer outros reparos necessários.
        </Text>
        <Text style={styles.paragraph}>
          Fica estabelecido que todas as manutenções deverão ser realizadas
          exclusivamente em oficina credenciada pela LOCADORA, sendo indicada
          desde já a oficina KEU MOTO PEÇAS, localizada na Rua José Lopes de
          Oliveira, nº 741, Bairro João Cabral, Juazeiro do Norte – CE.
        </Text>
        <Text style={styles.paragraph}>
          O descumprimento desta cláusula poderá implicar em penalidades e/ou
          rescisão contratual.
        </Text>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Pag. ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* PÁGINA 3 — FORO + ASSINATURAS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.clauseTitle}>X. DO FORO</Text>
        <Text style={styles.paragraph}>
          As partes elegem a Comarca de Juazeiro do Norte como o único
          competente para dirimir qualquer questão oriunda deste contrato, em
          detrimento de qualquer outro, por mais privilegiado que possa ser ou
          venha se tornar.
        </Text>
        <Text style={styles.paragraph}>
          E, por estarem justas e contratadas, as partes firmam este contrato
          em 02 (duas) vias de igual teor, subscritas pelas testemunhas abaixo
          qualificadas.
        </Text>

        <Text style={[styles.paragraph, { marginTop: 30, textAlign: "right" }]}>
          Juazeiro do Norte – CE, {fmtDate(dataContrato)}
        </Text>

        <View style={styles.signatureBlock}>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>
            CONTRATANTE/LOCATÁRIO:
          </Text>
          <View style={styles.signatureLine} />
          <Text style={[styles.centerText, { fontFamily: "Helvetica-Bold" }]}>
            {contratante.nome.toUpperCase()}
          </Text>
          <Text style={styles.centerText}>CPF {contratante.cpf}</Text>
        </View>

        {hasAvalista ? (
          <View style={[styles.signatureBlock, { marginTop: 28 }]}>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>
              AVALISTA:
            </Text>
            <View style={styles.signatureLine} />
            <Text style={[styles.centerText, { fontFamily: "Helvetica-Bold" }]}>
              {avalista?.nome?.toUpperCase()}
            </Text>
            <Text style={styles.centerText}>CPF {avalista?.cpf}</Text>
          </View>
        ) : null}

        <View style={[styles.signatureBlock, { marginTop: 28 }]}>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>
            CONTRATADA/LOCADOR:
          </Text>
          <View style={styles.signatureLine} />
          <Text style={[styles.centerText, { fontFamily: "Helvetica-Bold" }]}>
            JOSICLEUDO FERREIRA CRUZ
          </Text>
          <Text style={styles.centerText}>CPF 061.104.423-48</Text>
          <Text style={styles.centerText}>KEU LOCA MOTOS</Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Pag. ${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
