"use client";

import { useState } from "react";
import Image from "next/image";
import { Bike } from "lucide-react";
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
  const hasFotos = fotos.length > 0;
  const current = hasFotos ? fotos[active] : null;

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-keu-gray-light via-white to-keu-red/10 relative overflow-hidden">
        {current ? (
          <Image
            src={current}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
            priority
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30">
            <Bike className="h-32 w-32" />
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {destaque && <Badge variant="default">Destaque</Badge>}
          {tipo === "aluguel" && <Badge variant="dark">Aluguel</Badge>}
          {tipo === "ambos" && <Badge variant="info">Venda/Aluguel</Badge>}
        </div>
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg px-3 py-1.5 text-sm font-bold">
          {ano}
        </div>
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
              <Image
                src={foto}
                alt={`${alt} - foto ${i + 1}`}
                fill
                sizes="120px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
