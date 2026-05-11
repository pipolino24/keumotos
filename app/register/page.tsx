"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Lock,
  Mail,
  User,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { KeuLogo, MotoIcon } from "@/components/keu-logo";

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"cliente" | "vendedor">(
    "cliente"
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col p-6 md:p-12 bg-white">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <KeuLogo size="md" />
              <h1 className="text-3xl font-black mt-6 mb-2">Criar conta</h1>
              <p className="text-keu-black/60">
                Junte-se à família KEU em segundos
              </p>
            </div>

            <div className="flex bg-keu-gray-light rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setAccountType("cliente")}
                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition ${
                  accountType === "cliente"
                    ? "bg-white text-keu-red shadow-sm"
                    : "text-keu-black/60 hover:text-keu-black"
                }`}
              >
                Sou Cliente
              </button>
              <button
                type="button"
                onClick={() => setAccountType("vendedor")}
                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition ${
                  accountType === "vendedor"
                    ? "bg-white text-keu-red shadow-sm"
                    : "text-keu-black/60 hover:text-keu-black"
                }`}
              >
                Sou Vendedor
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome" required>
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="nome"
                    placeholder="Seu nome completo"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" required>
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="telefone" required>
                  Telefone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(88) 99999-9999"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="password" required>
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm" required>
                    Confirmar
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {accountType === "vendedor" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                  <strong>Atenção:</strong> contas de vendedor passam por
                  aprovação do administrador antes da ativação.
                </div>
              )}

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-keu-black/20 text-keu-red focus:ring-keu-red"
                  required
                />
                <span>
                  Eu li e concordo com os{" "}
                  <Link href="#" className="text-keu-red font-semibold hover:underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="#" className="text-keu-red font-semibold hover:underline">
                    Política de Privacidade
                  </Link>
                </span>
              </label>

              <Button type="submit" size="lg" className="w-full">
                Criar minha conta
              </Button>

              <p className="text-center text-sm text-keu-black/60">
                Já tem uma conta?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-keu-red hover:underline"
                >
                  Entrar
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-keu-red via-keu-red-dark to-keu-black overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-grid opacity-10" />

        <div className="relative z-10 text-white max-w-md">
          <div className="mb-8 inline-block bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8">
            <MotoIcon className="w-24 h-24 fill-white" />
          </div>
          <h2 className="text-5xl font-black mb-4 leading-tight">
            Faça parte
            <br />
            da família KEU
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Como cliente, você acompanha pedidos, salva favoritos e tem acesso
            antecipado às melhores ofertas.
          </p>

          <div className="space-y-3">
            <Benefit text="Acesso antecipado às novidades" />
            <Benefit text="Histórico de compras e aluguéis" />
            <Benefit text="Ofertas exclusivas e personalizadas" />
            <Benefit text="Atendimento prioritário" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
      <span className="text-white/90">{text}</span>
    </div>
  );
}
