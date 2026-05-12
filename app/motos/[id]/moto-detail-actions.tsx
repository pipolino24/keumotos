"use client";

import { useState } from "react";
import {
  MessageCircle,
  Heart,
  Calculator,
  Share2,
  ChevronDown,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LeadFormModal } from "@/components/motos/lead-form-modal";
import { FinancingSimulator } from "@/components/motos/financing-simulator";
import { RentalRequestModal } from "@/components/motos/rental-request-modal";
import { FavoriteButton } from "@/components/motos/favorite-button";

interface Props {
  whatsappUrl: string;
  motoInteresse: string;
  shareTitle: string;
  valorMoto: number;
  motoId: string;
  motoTipo?: "venda" | "aluguel" | "ambos";
}

export function MotoDetailActions({
  whatsappUrl,
  motoInteresse,
  shareTitle,
  valorMoto,
  motoId,
  motoTipo,
}: Props) {
  const [showLead, setShowLead] = useState(false);
  const [showSimulador, setShowSimulador] = useState(false);
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
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowSimulador((v) => !v)}
        >
          <Calculator className="h-4 w-4" />{" "}
          {showSimulador ? "Fechar simulador" : "Simular financiamento"}
        </Button>
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

      {/* SIMULADOR COLAPSÁVEL */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowSimulador((v) => !v)}
          className="w-full flex items-center justify-between gap-2 rounded-lg border-2 border-dashed border-keu-red/30 bg-keu-red/5 px-4 py-3 text-sm font-bold text-keu-red hover:bg-keu-red/10 transition"
          aria-expanded={showSimulador}
          aria-controls="simulador-financiamento"
        >
          <span className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Simule o financiamento
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              showSimulador ? "rotate-180" : ""
            }`}
          />
        </button>
        {showSimulador && (
          <div id="simulador-financiamento" className="mt-3">
            <FinancingSimulator
              valorMoto={valorMoto}
              modeloNome={shareTitle}
              motoId={motoId}
            />
          </div>
        )}
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
    </>
  );
}
