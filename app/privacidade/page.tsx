import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Trash2 } from "lucide-react";
import { KeuLogo } from "@/components/keu-logo";

export const metadata = {
  title: "Política de Privacidade — KEU Empreendimentos",
};

export default function PrivacidadePage() {
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
            Política de Privacidade
          </h1>
          <p className="text-sm text-keu-black/60 mb-8">
            Conformidade com a LGPD (Lei 13.709/2018) · Última atualização:
            11 de maio de 2026
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
              <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div className="text-sm">
                <strong className="block">Seus dados são seus</strong>
                <span className="text-keu-black/60">
                  Você controla o que coletamos e pode pedir remoção a qualquer
                  momento.
                </span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Lock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm">
                <strong className="block">Armazenamento seguro</strong>
                <span className="text-keu-black/60">
                  Senhas criptografadas, conexões HTTPS, banco isolado.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-keu-black/80">
            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                Dados que coletamos
              </h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Identificação:</strong> nome, CPF, RG, CNH, e-mail,
                  telefone
                </li>
                <li>
                  <strong>Endereço:</strong> CEP, rua, número, bairro, cidade,
                  estado
                </li>
                <li>
                  <strong>Bancário (afiliados/proprietários):</strong> chave
                  PIX, banco, conta
                </li>
                <li>
                  <strong>Documentos:</strong> fotos de CNH, comprovante de
                  residência, CRLV (apenas para aquisição/repasse de motos)
                </li>
                <li>
                  <strong>Uso:</strong> data e hora de login, ações realizadas
                  no sistema
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                Como usamos
              </h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Identificar partes em compras, vendas e repasses</li>
                <li>Pagar comissões a afiliados e valores a proprietários</li>
                <li>Cumprir obrigações fiscais e contratuais</li>
                <li>Enviar notificações relevantes da sua conta</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                Com quem compartilhamos
              </h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Bancos/financeiras</strong> ao gerar propostas de
                  financiamento
                </li>
                <li>
                  <strong>Detran/SENATRAN</strong> ao transferir documentação
                </li>
                <li>
                  <strong>Contadores</strong> para fins fiscais
                </li>
                <li>Nunca vendemos seus dados para marketing de terceiros</li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                Seus direitos (LGPD)
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 text-keu-red mt-0.5" />
                  <span>
                    <strong>Acesso:</strong> ver todos os seus dados
                    cadastrados
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-keu-red mt-0.5" />
                  <span>
                    <strong>Correção:</strong> atualizar informações
                    incorretas
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Trash2 className="h-4 w-4 text-keu-red mt-0.5" />
                  <span>
                    <strong>Exclusão:</strong> apagar sua conta e dados, salvo
                    obrigação legal de retenção (fiscal)
                  </span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                Retenção
              </h2>
              <p className="text-sm">
                Dados de transações (compra, venda, repasse) são mantidos por{" "}
                <strong>5 anos</strong> por exigência fiscal. Dados de uso e
                marketing podem ser removidos a qualquer momento mediante
                solicitação.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-keu-black mt-6 mb-2">
                Cookies
              </h2>
              <p className="text-sm">
                Usamos cookies apenas para manter sua sessão ativa. Não usamos
                cookies de rastreamento de terceiros.
              </p>
            </section>

            <section className="border-t border-keu-black/10 pt-6 mt-8">
              <h2 className="font-bold text-lg text-keu-black mb-2">
                Encarregado de Proteção de Dados (DPO)
              </h2>
              <p className="text-sm">
                Para exercer seus direitos ou tirar dúvidas, fale com nosso DPO
                pelo WhatsApp <strong>(88) 99850-5859</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
