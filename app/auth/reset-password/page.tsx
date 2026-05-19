"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { KeuLogo } from "@/components/keu-logo";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [readyToReset, setReadyToReset] = useState(false);

  const [invalidEntry, setInvalidEntry] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = readyToReset;
  }, [readyToReset]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReadyToReset(true);
    });
    // Janela curta pra esperar o PASSWORD_RECOVERY: se em 2s não veio,
    // assume que o usuário entrou direto (não veio do email de recovery)
    // e mostra mensagem de orientação em vez do form. Antes qualquer
    // sessão ativa liberava o form — permitia trocar senha sem confirmar
    // identidade via link de recuperação.
    const t = setTimeout(() => {
      if (!readyRef.current) setInvalidEntry(true);
    }, 2000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (senha !== confirmar) {
      setError("As senhas não conferem");
      return;
    }
    if (senha.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      setDone(true);
      toast.success("Senha alterada com sucesso!");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar senha";
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-keu-gray-light">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-keu-black/60 hover:text-keu-red transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="mb-6">
            <KeuLogo size="md" />
            <h1 className="text-2xl font-black mt-6 mb-2">
              {done ? "Senha alterada!" : "Defina sua nova senha"}
            </h1>
            <p className="text-sm text-keu-black/60">
              {done
                ? "Você será redirecionado em instantes…"
                : "Escolha uma senha forte com pelo menos 8 caracteres."}
            </p>
          </div>

          {done ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-900">
                Pronto! Já pode usar a nova senha.
              </div>
            </div>
          ) : invalidEntry && !readyToReset ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  Essa página só funciona com o link enviado por e-mail de
                  recuperação. Solicite um novo link abaixo.
                </div>
              </div>
              <Link href="/forgot-password">
                <Button className="w-full">Pedir link de recuperação</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Voltar ao login
                </Button>
              </Link>
            </div>
          ) : !readyToReset ? (
            <div className="text-sm text-keu-black/60 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Validando link…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="senha" required>
                  Nova senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="senha"
                    type="password"
                    className="pl-10"
                    required
                    minLength={8}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="confirmar" required>
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-keu-black/40" />
                  <Input
                    id="confirmar"
                    type="password"
                    className="pl-10"
                    required
                    minLength={8}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
                  </>
                ) : (
                  "Salvar nova senha"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
