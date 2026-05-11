"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { KeuLogo, MotoIcon } from "@/components/keu-logo";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"cliente" | "vendedor">(
    "vendedor"
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT - Form */}
      <div className="flex-1 flex flex-col p-6 md:p-12 bg-white">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <KeuLogo size="md" />
              <h1 className="text-3xl font-black mt-6 mb-2">
                Bem-vindo de volta!
              </h1>
              <p className="text-keu-black/60">
                Entre na sua conta para continuar
              </p>
            </div>

            {/* Account type tabs */}
            <div className="flex bg-keu-gray-light rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setAccountType("vendedor")}
                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition ${
                  accountType === "vendedor"
                    ? "bg-white text-keu-red shadow-sm"
                    : "text-keu-black/60 hover:text-keu-black"
                }`}
              >
                Vendedor / Admin
              </button>
              <button
                type="button"
                onClick={() => setAccountType("cliente")}
                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition ${
                  accountType === "cliente"
                    ? "bg-white text-keu-red shadow-sm"
                    : "text-keu-black/60 hover:text-keu-black"
                }`}
              >
                Cliente
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="password" required className="mb-0">
                    Senha
                  </Label>
                  <Link
                    href="#"
                    className="text-xs font-medium text-keu-red hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-keu-black/40 hover:text-keu-black"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-keu-black/20 text-keu-red focus:ring-keu-red"
                />
                Manter conectado
              </label>

              <Button type="submit" size="lg" className="w-full">
                Entrar como{" "}
                {accountType === "vendedor" ? "Vendedor" : "Cliente"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-keu-black/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-keu-black/40 uppercase">
                    ou
                  </span>
                </div>
              </div>

              <p className="text-center text-sm text-keu-black/60">
                Não tem uma conta?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-keu-red hover:underline"
                >
                  Cadastre-se grátis
                </Link>
              </p>
            </form>
          </div>
        </div>

        <div className="text-xs text-keu-black/40 text-center">
          © 2026 KEU Empreendimentos
        </div>
      </div>

      {/* RIGHT - Visual */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-keu-black via-keu-gray to-keu-black overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-40"
          style={{ background: "var(--keu-red)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: "var(--keu-red)" }}
        />

        <div className="relative z-10 text-white max-w-md">
          <div className="mb-8 inline-block bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8">
            <MotoIcon className="w-24 h-24" />
          </div>
          <h2 className="text-5xl font-black mb-4 leading-tight">
            Acesse o painel
            <br />
            da <span className="text-keu-red">KEU</span>
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Gerencie estoque, vendas, aluguéis, contatos e seus clientes em
            um só lugar.
          </p>

          <div className="space-y-3">
            <Feature icon={<Bike />} text="Catálogo completo de motos" />
            <Feature
              icon={<Lock />}
              text="Controle total de vendas e comissões"
            />
            <Feature
              icon={<Mail />}
              text="Comunicação direta com seus clientes"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-keu-red/20 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-white/90">{text}</span>
    </div>
  );
}
