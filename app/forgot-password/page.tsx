"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { KeuLogo } from "@/components/keu-logo";
import { toast } from "sonner";
import { whatsappLink } from "@/lib/keu-units";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Chama nosso endpoint /api/forgot-password (rate-limited) em vez de
      // bater no Supabase direto do browser. Backend faz a proteção contra
      // enumeração e spam.
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }),
      });
      if (res.status === 429) {
        toast.error("Muitas tentativas. Aguarde alguns minutos e tente de novo.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao enviar e-mail");
      }
      setSent(true);
      toast.success("Se o e-mail existir, você receberá instruções em instantes");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar e-mail";
      toast.error(msg);
    } finally {
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
              {sent ? "Verifique seu e-mail" : "Esqueceu a senha?"}
            </h1>
            <p className="text-sm text-keu-black/60">
              {sent
                ? "Se o e-mail existir em nossa base, enviamos um link para redefinir sua senha."
                : "Sem stress. Digite seu e-mail e enviaremos um link para criar uma nova senha."}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-900">
                  E-mail enviado para <strong>{email}</strong>. Confira sua
                  caixa de entrada e spam.
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Enviar para outro e-mail
              </Button>
              <Link href="/login">
                <Button className="w-full">Voltar ao login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" required>
                  E-mail cadastrado
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
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  "Enviar link de redefinição"
                )}
              </Button>
              <p className="text-xs text-keu-black/50 text-center">
                Não tem conta?{" "}
                <a
                  href={whatsappLink("multimarcas", "Quero conhecer a KEU")}
                  target="_blank"
                  rel="noopener"
                  className="font-semibold text-keu-red hover:underline"
                >
                  Fale com a equipe
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
