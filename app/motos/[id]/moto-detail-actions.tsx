"use client";

import { useState } from "react";
import {
  MessageCircle,
  Heart,
  Share2,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LeadFormModal } from "@/components/motos/lead-form-modal";
import { RentalRequestModal } from "@/components/motos/rental-request-modal";
import { FavoriteButton } from "@/components/motos/favorite-button";

interface Props {
  whatsappUrl: string;
  motoInteresse: string;
  shareTitle: string;
  motoId: string;
  motoTipo?: "venda" | "aluguel" | "ambos";
}

export function MotoDetailActions({
  whatsappUrl,
  motoInteresse,
  shareTitle,
  motoId,
  motoTipo,
}: Props) {
  const [showLead, setShowLead] = useState(false);
  const [showRental, setShowRental] = useState(false);
  const aceitaAluguel = motoTipo === "aluguel" || motoTipo === "ambos";

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Olha essa moto na KEU Multimarcas: ${shareTitle}`,
          url,
        });
        return;
      } catch {
        // user cancelled or share unsupported
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard && url) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado pra você compartilhar!");
        return;
      } catch {
        // ignore
      }
    }
    toast.info("Copie a URL da página pra compartilhar.");
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener"
          className="col-span-2"
        >
          <Button size="lg" className="w-full">
            <MessageCircle className="h-5 w-5" /> Falar pelo WhatsApp
          </Button>
        </a>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowLead(true)}
        >
          <Heart className="h-4 w-4" /> Tenho interesse
        </Button>
        {aceitaAluguel && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowRental(true)}
            className="col-span-2 bg-emerald-500/5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
          >
            <KeyRound className="h-4 w-4" /> Solicitar aluguel
          </Button>
        )}
        <div className="col-span-2 flex gap-2">
          <FavoriteButton motoId={motoId} motoLabel={shareTitle} />
          <Button
            variant="ghost"
            size="lg"
            onClick={handleShare}
            className="flex-1"
          >
            <Share2 className="h-4 w-4" /> Compartilhar
          </Button>
        </div>
      </div>

      <LeadFormModal
        open={showLead}
        onClose={() => setShowLead(false)}
        motoInteresse={motoInteresse}
        motoId={motoId}
      />
      <RentalRequestModal
        open={showRental}
        onClose={() => setShowRental(false)}
        motoId={motoId}
        motoLabel={shareTitle}
      />

      {/* MOBILE STICKY CTA — visível só em telas <md, fica acima do footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-keu-black/10 px-4 py-3 flex gap-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] safe-bottom">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener"
          className="flex-1"
        >
          <Button size="lg" className="w-full">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
        </a>
        {aceitaAluguel ? (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowRental(true)}
            className="bg-emerald-500/5 border-emerald-500/30 text-emerald-700"
          >
            <KeyRound className="h-4 w-4" /> Alugar
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowLead(true)}
          >
            <Heart className="h-4 w-4" /> Quero
          </Button>
        )}
      </div>
    </>
  );
}
