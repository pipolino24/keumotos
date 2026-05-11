"use client";

import { useState } from "react";
import { X, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  motoInteresse: string;
}

export function LeadFormModal({
  open,
  onClose,
  motoInteresse,
}: LeadFormModalProps) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) {
      toast.error("Preencha nome e telefone");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim() || undefined,
          observacoes: mensagem.trim() || undefined,
          origem: "site",
          interesse: "compra",
          motoInteresse,
          status: "novo",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao enviar");
      }
      toast.success(
        "Recebemos seu contato! Em breve um vendedor falará com você."
      );
      setNome("");
      setTelefone("");
      setEmail("");
      setMensagem("");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-keu-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md p-6 md:p-8 relative max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-keu-black/40 hover:text-keu-red transition"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-keu-red/10 text-keu-red w-12 h-12 rounded-xl flex items-center justify-center mb-4">
          <MessageCircle className="h-6 w-6" />
        </div>

        <h2 className="text-2xl font-black mb-1">Tenho interesse</h2>
        <p className="text-sm text-keu-black/60 mb-6">
          {motoInteresse
            ? `Deixe seu contato e nossa equipe falará com você sobre a ${motoInteresse}.`
            : "Deixe seu contato e nossa equipe falará com você."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label required>Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              required
              disabled={submitting}
            />
          </div>
          <div>
            <Label required>Telefone / WhatsApp</Label>
            <Input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(88) 99999-9999"
              required
              disabled={submitting}
            />
          </div>
          <div>
            <Label>E-mail (opcional)</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              disabled={submitting}
            />
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Conte como podemos te ajudar..."
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                "Enviar"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
