import Link from "next/link";
import { ArrowLeft, Info, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KeuLogo } from "@/components/keu-logo";
import { whatsappLink } from "@/lib/keu-units";

export const metadata = {
  title: "Cadastro fechado — KEU Motos",
  description: "O cadastro de cliente da KEU agora é feito pela equipe.",
};

/**
 * Cadastro público FECHADO. Decisão de produto: KEU não opera mais
 * auto-cadastro de cliente — todo novo cliente entra pela equipe
 * (vendedor cadastra no momento da venda/aluguel/lead). Esta rota
 * permanece pra capturar links antigos (email, indicação, bookmarks)
 * sem 404 e direcionar o visitante pro caminho certo.
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-keu-gray-light">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar pra home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="flex justify-center mb-6">
            <KeuLogo size="md" />
          </div>

          <div className="inline-flex items-center justify-center w-14 h-14 bg-keu-red/10 rounded-full mb-4">
            <Info className="h-7 w-7 text-keu-red" />
          </div>

          <h1 className="text-2xl font-black mb-3">Cadastro fechado</h1>
          <p className="text-keu-black/70 mb-6 leading-relaxed">
            O cadastro online de clientes foi descontinuado. Agora é a
            própria equipe da <strong>KEU</strong> que registra seus dados
            no momento da compra, aluguel ou primeira visita à loja.
          </p>

          <div className="space-y-3">
            <a
              href={whatsappLink("multimarcas", "Quero conhecer uma moto")}
              target="_blank"
              rel="noopener"
              className="block"
            >
              <Button size="lg" className="w-full">
                <MessageCircle className="h-5 w-5" />
                Falar com a equipe no WhatsApp
              </Button>
            </a>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full">
                Já tenho conta — entrar
              </Button>
            </Link>
            <Link href="/motos">
              <Button variant="ghost" size="lg" className="w-full">
                Ver catálogo de motos
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-keu-black/50">
          KEU Empreendimentos · Juazeiro do Norte, CE
        </p>
      </div>
    </div>
  );
}
