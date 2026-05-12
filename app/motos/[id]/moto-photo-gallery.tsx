"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Bike, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  fotos: string[];
  alt: string;
  destaque?: boolean;
  tipo: "venda" | "aluguel" | "ambos";
  ano: number;
}

export function MotoPhotoGallery({ fotos, alt, destaque, tipo, ano }: Props) {
  const [active, setActive] = useState(0);
  const [erros, setErros] = useState<Record<number, boolean>>({});
  const hasFotos = fotos.length > 0;
  const current = hasFotos ? fotos[active] : null;
  const currentErrou = erros[active] === true;

  const irPrev = useCallback(() => {
    if (!hasFotos) return;
    setActive((i) => (i - 1 + fotos.length) % fotos.length);
  }, [hasFotos, fotos.length]);

  const irNext = useCallback(() => {
    if (!hasFotos) return;
    setActive((i) => (i + 1) % fotos.length);
  }, [hasFotos, fotos.length]);

  // Keyboard nav (← →) — só ativa se o usuário não está digitando num input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        irPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        irNext();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [irPrev, irNext]);

  const marcarErro = (i: number) =>
    setErros((prev) => (prev[i] ? prev : { ...prev, [i]: true }));

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-keu-gray-light via-white to-keu-red/10 relative overflow-hidden group">
        {current && !currentErrou ? (
          <Image
            key={`${active}-${current.slice(0, 16)}`}
            src={current}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
            priority
            unoptimized
            onError={() => marcarErro(active)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-keu-red/30 gap-2">
            <Bike className="h-32 w-32" />
            {currentErrou && (
              <span className="text-xs text-keu-black/40 font-semibold">
                Imagem indisponível
              </span>
            )}
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
          {destaque && <Badge variant="default">Destaque</Badge>}
          {tipo === "aluguel" && <Badge variant="dark">Aluguel</Badge>}
          {tipo === "ambos" && <Badge variant="info">Venda/Aluguel</Badge>}
        </div>
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg px-3 py-1.5 text-sm font-bold pointer-events-none">
          {ano}
        </div>

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={irPrev}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5 text-keu-black" />
            </button>
            <button
              type="button"
              onClick={irNext}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white transition-all hover:scale-110"
            >
              <ChevronRight className="h-5 w-5 text-keu-black" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-keu-black/70 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {active + 1} / {fotos.length}
            </div>
          </>
        )}
      </div>

      {fotos.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {fotos.slice(0, 10).map((foto, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "aspect-square rounded-lg overflow-hidden relative bg-keu-black border-2 transition-all",
                active === i
                  ? "border-keu-red ring-2 ring-keu-red/30"
                  : "border-transparent hover:border-keu-red/40 opacity-70 hover:opacity-100"
              )}
              aria-label={`Foto ${i + 1}`}
            >
              {erros[i] ? (
                <div className="absolute inset-0 flex items-center justify-center bg-keu-gray-light">
                  <Bike className="h-4 w-4 text-keu-black/30" />
                </div>
              ) : (
                <Image
                  src={foto}
                  alt={`${alt} - foto ${i + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                  unoptimized
                  onError={() => marcarErro(i)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
