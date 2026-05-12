"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Bike,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import Image from "next/image";
import { KeuLogo } from "@/components/keu-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Sessão inválida");

      const role = (data.user.user_metadata?.role as string) || "cliente";
      toast.success("Login realizado!");

      const target =
        role === "afiliado" && nextPath === "/dashboard"
          ? "/afiliado"
          : nextPath;
      router.push(target);
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? traduzirErro(err.message) : "Erro ao entrar";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
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

            {error && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Label htmlFor="password" required className="mb-0">
                    Senha
                  </Label>
                  <Link
                    href="/forgot-password"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

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

      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-keu-gray via-keu-black to-keu-red-dark overflow-hidden items-center justify-center p-12">
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
          <div className="mb-8 inline-block bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6">
            <Image
              src="/logos/moto-rider-1.webp"
              alt="KEU"
              width={280}
              height={210}
              priority
              className="object-contain drop-shadow-2xl"
            />
          </div>
          <h2 className="text-5xl font-black mb-4 leading-tight">
            Acesse o painel
            <br />
            da <span className="text-keu-red">KEU</span>
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Gerencie estoque, vendas, aluguéis, contatos e seus clientes em um
            só lugar.
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

function traduzirErro(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (lower.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (lower.includes("too many requests")) return "Muitas tentativas. Tente novamente em alguns minutos.";
  return msg;
}
