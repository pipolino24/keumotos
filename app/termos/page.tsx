import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KeuLogo } from "@/components/keu-logo";

export const metadata = {
  title: "Termos de Uso — KEU Empreendimentos",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-keu-gray-light py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <KeuLogo size="sm" />
          <h1 className="text-3xl md:text-4xl font-black mt-6 mb-2">
            Termos de Uso
          </h1>
          <p className="text-sm text-keu-black/60 mb-8">
            Última atualização: 11 de maio de 2026
          </p>

          <div className="prose prose-sm max-w-none space-y-6 text-keu-black/80">
            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                1. Aceitação dos termos
              </h2>
              <p>
                Ao criar uma conta ou utilizar os serviços da KEU
                Empreendimentos, você concorda com estes Termos de Uso. Caso
                não concorde com algum item, não utilize a plataforma.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                2. Sobre a KEU
              </h2>
              <p>
                A KEU Empreendimentos é uma empresa sediada em Juazeiro do
                Norte/CE que opera nos setores de venda, aluguel e peças de
                motocicletas, sob as marcas KEU Multimarcas, KEU Loca Motos e
                KEU Moto Peças.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                3. Cadastro e conta
              </h2>
              <p>
                O usuário se compromete a fornecer informações verdadeiras e
                atualizadas, e a manter a confidencialidade da sua senha.
                Contas de vendedor passam por aprovação da administração.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                4. Compra e venda de motos
              </h2>
              <p>
                Todas as transações realizadas via plataforma são intermediadas
                pela KEU. Em casos de repasse/consignação, o proprietário
                autoriza a KEU a anunciar e vender a moto conforme contrato
                específico de consignação.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                5. Programa de afiliados
              </h2>
              <p>
                Afiliados recebem comissão por vendas realizadas via seu link
                único, conforme acordo individual. Pagamentos são feitos via
                PIX ou conta bancária cadastrada após confirmação da venda. A
                KEU pode revisar percentuais de comissão a qualquer momento,
                aplicando-se a vendas futuras.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                6. Responsabilidades
              </h2>
              <p>
                A KEU garante a procedência das motos anunciadas, verificando
                documentação antes da venda. Em caso de repasse, o
                proprietário responde pela autenticidade dos documentos
                apresentados.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                7. Modificações
              </h2>
              <p>
                Estes termos podem ser atualizados a qualquer momento.
                Mudanças significativas serão comunicadas via e-mail ou no
                painel do usuário.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                8. Foro
              </h2>
              <p>
                Fica eleito o foro de Juazeiro do Norte/CE para dirimir
                quaisquer dúvidas ou controvérsias decorrentes destes Termos.
              </p>
            </section>

            <section className="border-t border-keu-black/10 pt-6 mt-8">
              <h2 className="font-bold text-lg text-keu-black mb-2">Contato</h2>
              <p className="text-sm">
                Dúvidas? Fale conosco pelo WhatsApp <strong>(88) 99850-5859</strong> ou pelo Instagram <strong>@keumultimarcass</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
