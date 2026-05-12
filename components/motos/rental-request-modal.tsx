"use client";

import { useState } from "react";
import { X, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Props {
  open: boolean;
  onClose: () => void;
  motoId: string;
  motoLabel: string;
}

/**
 * Modal pra cliente solicitar aluguel — registra Interesse "solicitou_aluguel"
 * com datas pretendidas e mensagem. Vendedor recebe notificação de alta
 * prioridade automaticamente.
 */
export function RentalRequestModal({ open, onClose, motoId, motoLabel }: Props) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dataInicio || !dataFim) {
      toast.error("Informe as datas pretendidas");
      return;
    }
    if (new Date(dataInicio) > new Date(dataFim)) {
      toast.error("Data fim deve ser depois da data início");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/interesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motoId,
          tipo: "solicitou_aluguel",
          clienteNome: nome.trim() || undefined,
          clienteTelefone: telefone.trim() || undefined,
          mensagem: [
            `Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} → ${new Date(dataFim).toLocaleDateString("pt-BR")}`,
            mensagem.trim(),
          ]
            .filter(Boolean)
            .join("\n"),
          origem: "site",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao enviar solicitação");
      }
      toast.success("Solicitação enviada! O vendedor entrará em contato em breve.");
      setNome("");
      setTelefone("");
      setDataInicio("");
      setDataFim("");
      setMensagem("");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
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
        className="w-full max-w-md p-6 md:p-8 relative max-h-[95vh] overflow-y-auto animate-scale-in"
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

        <div className="bg-emerald-500/10 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
          <KeyRound className="h-6 w-6" />
        </div>

        <h2 className="text-2xl font-black mb-1">Solicitar aluguel</h2>
        <p className="text-sm text-keu-black/60 mb-6">
          Da <span className="font-semibold">{motoLabel}</span>. Te respondemos em
          minutos.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>De</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <Label required>Até</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <Label>Nome (opcional)</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              disabled={submitting}
            />
          </div>
          <div>
            <Label>Telefone / WhatsApp</Label>
            <Input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(88) 99999-9999"
              disabled={submitting}
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Vai usar pra delivery? Outras dúvidas?"
              rows={2}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : (
                "Solicitar aluguel"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
