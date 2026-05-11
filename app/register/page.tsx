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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import Image from "next/image";
import { KeuLogo } from "@/components/keu-logo";
import { ImageUpload } from "@/components/ui/image-upload";

type RegisterForm = {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmar: string;
  role: "cliente" | "vendedor";
  avatar: string[];
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmar: "",
    role: "cliente",
    avatar: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.senha !== form.confirmar) {
      setError("As senhas não conferem");
      return;
    }
    if (form.senha.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          senha: form.senha,
          role: form.role,
          status: form.role === "vendedor" ? "pendente" : "ativo",
          avatar: form.avatar[0],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao cadastrar");
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      setSubmitting(false);
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
                onClick={() => set("role", "cliente")}
                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition ${
                  form.role === "cliente"
                    ? "bg-white text-keu-red shadow-sm"
                    : "text-keu-black/60 hover:text-keu-black"
                }`}
              >
                Sou Cliente
              </button>
              <button
                type="button"
                onClick={() => set("role", "vendedor")}
                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition ${
                  form.role === "vendedor"
                    ? "bg-white text-keu-red shadow-sm"
                    : "text-keu-black/60 hover:text-keu-black"
                }`}
              >
                Sou Vendedor
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar */}
              <div>
                <Label>Foto de perfil (opcional)</Label>
                <div className="flex items-center gap-4">
                  <ImageUpload
                    value={form.avatar}
                    onChange={(v) => set("avatar", v)}
                    max={1}
                    maxSizeKB={80}
                    maxWidth={400}
                    quality={0.8}
                    shape="round"
                    hint="Auto-comprimido para ~80KB"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nome" required>Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="nome"
                    placeholder="Seu nome completo"
                    className="pl-10"
                    required
                    value={form.nome}
                    onChange={(e) => set("nome", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" required>E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="telefone" required>Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(88) 99999-9999"
                    className="pl-10"
                    required
                    value={form.telefone}
                    onChange={(e) => set("telefone", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="password" required>Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                      minLength={6}
                      value={form.senha}
                      onChange={(e) => set("senha", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm" required>Confirmar</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                      minLength={6}
                      value={form.confirmar}
                      onChange={(e) => set("confirmar", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {form.role === "vendedor" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                  <strong>Atenção:</strong> contas de vendedor passam por
                  aprovação do administrador antes da ativação.
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" /> {error}
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
                  <Link href="/termos" className="text-keu-red font-semibold hover:underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" className="text-keu-red font-semibold hover:underline">
                    Política de Privacidade
                  </Link>
                </span>
              </label>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Criando conta...
                  </>
                ) : (
                  "Criar minha conta"
                )}
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
          <div className="mb-8 inline-block bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-6">
            <Image
              src="/logos/moto-rider-3.webp"
              alt="KEU"
              width={280}
              height={210}
              priority
              className="object-contain drop-shadow-2xl"
            />
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
