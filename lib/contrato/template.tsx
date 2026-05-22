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

// Sem fontes externas — Helvetica é built-in. Hyphenation desligado pra
// não cortar nomes em locais estranhos.
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
  // Watermark — logo desbotado no centro de fundo
  watermark: {
    position: "absolute",
    top: "30%",
    left: "20%",
    width: "60%",
    opacity: 0.06,
    objectFit: "contain",
  },
  header: {
    alignItems: "center",
    marginBottom: 14,
  },
  logoBox: {
    width: 220,
    height: 80,
    objectFit: "contain",
  },
  slogan: {
    fontSize: 8,
    color: "#999",
    marginTop: -4,
    fontStyle: "italic",
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
  // Tabela 2-col com par label-valor
  table: {
    width: "100%",
    borderStyle: "solid",
    borderColor: "#000",
    borderWidth: 1,
    marginBottom: 8,
  },
  row: { flexDirection: "row" },
  cellLabel: {
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f0f0f0",
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    fontSize: 8.5,
  },
  cellValue: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    fontSize: 9,
  },
  partyLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginTop: 6,
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
  footerLogo: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerLogoImg: {
    width: 80,
    height: 28,
    objectFit: "contain",
    opacity: 0.6,
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

/**
 * Calcula font-size adaptativa pro nome: textos longos encolhem pra caber
 * na célula sem quebrar layout. >50 chars → 7px, >35 → 8px, default 9px.
 */
function adaptiveFontSize(text: string | undefined, defaultSize = 9): number {
  if (!text) return defaultSize;
  const len = text.length;
  if (len > 60) return 6.5;
  if (len > 45) return 7.5;
  if (len > 30) return 8.5;
  return defaultSize;
}

/**
 * Célula de tabela com label fixa + valor. labelWidth e flex controlam
 * largura. wrap=true permite quebra natural (default true em Text v3).
 * fontSize adapta automaticamente pelo conteúdo.
 */
function FieldCell({
  label,
  value,
  labelWidth = 70,
  noRightBorder = false,
  flex = 1,
}: {
  label: string;
  value?: string | number;
  labelWidth?: number;
  noRightBorder?: boolean;
  flex?: number;
}) {
  const valueStr = value != null && value !== "" ? String(value) : "";
  const fs = adaptiveFontSize(valueStr);
  return (
    <View style={{ flex, flexDirection: "row" }}>
      <View style={[styles.cellLabel, { width: labelWidth }]}>
        <Text>{label}</Text>
      </View>
      <View
        style={[
          styles.cellValue,
          {
            flex: 1,
            fontSize: fs,
            ...(noRightBorder ? { borderRightWidth: 0 } : {}),
          },
        ]}
      >
        {/* Sempre 1 linha no PDF — Text quebra naturalmente. minHeight pra altura uniforme */}
        <Text style={{ fontSize: fs }}>{valueStr}</Text>
      </View>
    </View>
  );
}

// Linha de tabela com 2 pares label/valor lado a lado
function DoubleField(props: {
  left: { label: string; value?: string | number; labelWidth?: number };
  right: { label: string; value?: string | number; labelWidth?: number };
}) {
  return (
    <View style={styles.row}>
      <FieldCell {...props.left} />
      <FieldCell {...props.right} noRightBorder />
    </View>
  );
}

// Linha de tabela com 1 par label/valor ocupando linha inteira
function FullField({
  label,
  value,
  labelWidth = 70,
}: {
  label: string;
  value?: string | number;
  labelWidth?: number;
}) {
  return (
    <View style={styles.row}>
      <FieldCell label={label} value={value} labelWidth={labelWidth} noRightBorder />
    </View>
  );
}

function fmtMoney(v: number | undefined) {
  if (typeof v !== "number") return "";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

function periodicidade(datas?: string): string {
  if (!datas) return "mensais";
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
  logoDataUrl?: string;
}

function PageDecorations({ logoDataUrl }: { logoDataUrl?: string }) {
  return (
    <>
      {logoDataUrl ? <Image src={logoDataUrl} style={styles.watermark} fixed /> : null}
      <View style={styles.footerLogo} fixed>
        {logoDataUrl ? <Image src={logoDataUrl} style={styles.footerLogoImg} /> : null}
      </View>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Pag. ${pageNumber} / ${totalPages}`
        }
        fixed
      />
    </>
  );
}

function PdfHeader({ logoDataUrl }: { logoDataUrl?: string }) {
  return (
    <View style={styles.header}>
      {logoDataUrl ? (
        <Image src={logoDataUrl} style={styles.logoBox} />
      ) : (
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 22 }}>
          KEU LOCA MOTOS
        </Text>
      )}
      <Text style={styles.slogan}>Realizando Sonhos</Text>
    </View>
  );
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
      {/* PÁGINA 1 — IDENTIFICAÇÃO DAS PARTES + VEÍCULO + PLANO */}
      <Page size="A4" style={styles.page}>
        <PageDecorations logoDataUrl={logoDataUrl} />
        <PdfHeader logoDataUrl={logoDataUrl} />

        <Text style={styles.sectionTitle}>I – DA IDENTIFICAÇÃO DAS PARTES</Text>
        <Text style={styles.introA}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>
            A– CONTRATADA/LOCADORA:
          </Text>{" "}
          JOSICLEUDO FERREIRA CRUZ denominada apenas por KEU LOCA MOTOS, CPF:
          061.104.423-48, Endereço: Rua José Lopes de Oliveira, nº 741, Bairro
          João Cabral, Juazeiro do Norte – CE, Telefone: (88) 99850-5859
        </Text>

        <Text style={styles.partyLabel}>B – CONTRATANTE:</Text>
        <View style={styles.table}>
          <DoubleField
            left={{ label: "NOME", value: contratante.nome, labelWidth: 50 }}
            right={{ label: "SEXO", value: contratante.sexo, labelWidth: 40 }}
          />
          <View style={styles.row}>
            <FieldCell
              label="NASCIMENTO"
              value={contratante.nascimento}
              labelWidth={70}
              flex={1}
            />
            <FieldCell
              label="CNH"
              value={contratante.cnh}
              labelWidth={35}
              flex={1}
            />
            <FieldCell
              label="NATURAL"
              value={contratante.natural}
              labelWidth={55}
              flex={1}
              noRightBorder
            />
          </View>
          <View style={styles.row}>
            <FieldCell
              label="PROFISSÃO"
              value={contratante.profissao}
              labelWidth={60}
              flex={1}
            />
            <FieldCell
              label="CPF"
              value={contratante.cpf}
              labelWidth={35}
              flex={1}
            />
            <FieldCell
              label="RG"
              value={contratante.rg}
              labelWidth={35}
              flex={1}
              noRightBorder
            />
          </View>
          <FullField label="ENDEREÇO" value={contratante.endereco} />
          <View style={styles.row}>
            <FieldCell
              label="CONTATOS"
              value={contratante.telefone}
              labelWidth={60}
              flex={1}
            />
            <FieldCell
              label="EMAIL"
              value={contratante.email}
              labelWidth={40}
              flex={1.6}
              noRightBorder
            />
          </View>
        </View>

        <Text style={styles.partyLabel}>C – DADOS DO AVALISTA VOLUNTÁRIO:</Text>
        <View style={styles.table}>
          <DoubleField
            left={{
              label: "NOME",
              value: hasAvalista ? avalista?.nome : "",
              labelWidth: 50,
            }}
            right={{
              label: "SEXO",
              value: avalista?.sexo,
              labelWidth: 40,
            }}
          />
          <View style={styles.row}>
            <FieldCell
              label="NASCIMENTO"
              value={avalista?.nascimento}
              labelWidth={70}
              flex={1}
            />
            <FieldCell
              label="CNH"
              value={avalista?.cnh}
              labelWidth={35}
              flex={1}
            />
            <FieldCell
              label="NATURAL"
              value={avalista?.natural}
              labelWidth={55}
              flex={1}
              noRightBorder
            />
          </View>
          <View style={styles.row}>
            <FieldCell
              label="PROFISSÃO"
              value={avalista?.profissao}
              labelWidth={60}
              flex={1}
            />
            <FieldCell
              label="CPF"
              value={avalista?.cpf}
              labelWidth={35}
              flex={1}
            />
            <FieldCell
              label="RG"
              value={avalista?.rg}
              labelWidth={35}
              flex={1}
              noRightBorder
            />
          </View>
          <FullField label="ENDEREÇO" value={avalista?.endereco} />
          <View style={styles.row}>
            <FieldCell
              label="CONTATOS"
              value={avalista?.telefone}
              labelWidth={60}
              flex={1}
            />
            <FieldCell
              label="EMAIL"
              value={avalista?.email}
              labelWidth={40}
              flex={1.6}
              noRightBorder
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          II – O presente contrato tem como objeto a locação de uma motocicleta
          de propriedade da LOCADORA ao LOCATÁRIO, conforme especificações
          abaixo:
        </Text>
        <View style={styles.table}>
          <DoubleField
            left={{ label: "MARCA", value: moto.marca, labelWidth: 60 }}
            right={{
              label: "CHASSI",
              value: moto.chassi,
              labelWidth: 60,
            }}
          />
          <DoubleField
            left={{ label: "MODELO", value: moto.modelo, labelWidth: 60 }}
            right={{ label: "PLACA", value: moto.placa, labelWidth: 60 }}
          />
          <DoubleField
            left={{
              label: "ANO/MODELO",
              value: moto.anoModelo ? String(moto.anoModelo) : "",
              labelWidth: 60,
            }}
            right={{
              label: "KM",
              value: typeof moto.km === "number" ? `${moto.km} km` : "",
              labelWidth: 60,
            }}
          />
          <DoubleField
            left={{ label: "COR", value: moto.cor, labelWidth: 60 }}
            right={{ label: "OBS.", value: moto.obs, labelWidth: 60 }}
          />
        </View>

        <Text style={styles.sectionTitle}>
          III – DO VALOR DA CONTRATAÇÃO, CONDIÇÕES DO PLANO E ENCARGOS:
        </Text>
        <View style={styles.table}>
          <DoubleField
            left={{
              label: "PARCELAS",
              value: `${plano.parcelas} PARCELAS`,
              labelWidth: 75,
            }}
            right={{
              label: "ENTRADA",
              value: fmtMoney(plano.valorEntrada),
              labelWidth: 65,
            }}
          />
          <DoubleField
            left={{
              label: "VALOR PARCELA",
              value: fmtMoney(plano.valorParcela),
              labelWidth: 90,
            }}
            right={{
              label: "PLANO",
              value: plano.planoEscolhido,
              labelWidth: 65,
            }}
          />
          <DoubleField
            left={{
              label: "MULTA ATRASO",
              value: `${plano.multaPercent}%`,
              labelWidth: 90,
            }}
            right={{
              label: "VENCIMENTOS",
              value: plano.datasVencimento,
              labelWidth: 80,
            }}
          />
          <DoubleField
            left={{
              label: "JUROS/DIA",
              value: `${plano.jurosDiaPercent}% ao dia`,
              labelWidth: 90,
            }}
            right={{
              label: "1º VENCTO",
              value: plano.vencimentoPrimeira,
              labelWidth: 65,
            }}
          />
          {observacoes ? (
            <FullField label="OBSERVAÇÕES" value={observacoes} labelWidth={90} />
          ) : null}
        </View>
      </Page>

      {/* PÁGINA 2 — CLÁUSULAS */}
      <Page size="A4" style={styles.page}>
        <PageDecorations logoDataUrl={logoDataUrl} />

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
      </Page>

      {/* PÁGINA 3 — FORO + ASSINATURAS */}
      <Page size="A4" style={styles.page}>
        <PageDecorations logoDataUrl={logoDataUrl} />

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
          <Text
            style={[
              styles.centerText,
              { fontFamily: "Helvetica-Bold", fontSize: adaptiveFontSize(contratante.nome, 10) },
            ]}
          >
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
            <Text
              style={[
                styles.centerText,
                { fontFamily: "Helvetica-Bold", fontSize: adaptiveFontSize(avalista?.nome, 10) },
              ]}
            >
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
      </Page>
    </Document>
  );
}
