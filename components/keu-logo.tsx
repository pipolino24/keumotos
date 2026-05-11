import { cn } from "@/lib/utils";

interface KeuLogoProps {
  variant?: "full" | "icon" | "horizontal";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showSubtitle?: boolean;
}

const sizeMap = {
  sm: { text: "text-2xl", sub: "text-[8px]", icon: "h-8 w-8" },
  md: { text: "text-4xl", sub: "text-[10px]", icon: "h-10 w-10" },
  lg: { text: "text-6xl", sub: "text-xs", icon: "h-14 w-14" },
  xl: { text: "text-8xl", sub: "text-sm", icon: "h-20 w-20" },
};

export function KeuLogo({
  variant = "full",
  size = "md",
  className,
  showSubtitle = true,
}: KeuLogoProps) {
  const s = sizeMap[size];

  if (variant === "icon") {
    return <MotoIcon className={cn(s.icon, className)} />;
  }

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div className="relative flex items-center gap-2">
        {variant === "horizontal" && <MotoIcon className={s.icon} />}
        <span
          className={cn(
            "font-black tracking-tighter italic text-keu-black leading-none",
            s.text
          )}
          style={{
            textShadow:
              "3px 3px 0px var(--keu-red), 4px 4px 0px rgba(0,0,0,0.2)",
            WebkitTextStroke: "1px var(--keu-black)",
          }}
        >
          KEU
        </span>
      </div>
      {showSubtitle && (
        <span
          className={cn(
            "font-bold tracking-[0.3em] text-keu-black/80 mt-1",
            s.sub
          )}
        >
          EMPREENDIMENTOS
        </span>
      )}
    </div>
  );
}

export function MotoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("fill-keu-red", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stylized racing motorcycle silhouette */}
      <path
        d="M20 70 C 20 78, 28 78, 28 70 C 28 62, 20 62, 20 70 Z"
        className="fill-keu-black"
      />
      <path
        d="M72 70 C 72 78, 80 78, 80 70 C 80 62, 72 62, 72 70 Z"
        className="fill-keu-black"
      />
      <path
        d="M24 70 L 40 50 L 55 45 L 70 50 L 76 70 L 65 70 L 58 55 L 45 55 L 35 70 Z"
        className="fill-keu-red"
      />
      <circle cx="50" cy="32" r="8" className="fill-keu-black" />
      <path
        d="M48 24 L 52 24 L 53 32 L 47 32 Z"
        className="fill-white opacity-60"
      />
    </svg>
  );
}

interface SubBrandProps {
  className?: string;
}

export function KeuMotoPecas({ className }: SubBrandProps) {
  return (
    <div className={cn("flex flex-col items-start", className)}>
      <span
        className="font-black italic text-keu-red text-xl leading-none"
        style={{ WebkitTextStroke: "0.5px var(--keu-black)" }}
      >
        KEU MOTO PEÇAS
      </span>
      <span className="text-[10px] font-semibold text-keu-black/70 mt-1">
        E BORRACHARIA PADRE CÍCERO
      </span>
    </div>
  );
}

export function KeuLocaMotos({ className }: SubBrandProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <span
        className="font-black italic text-keu-red text-xl leading-none"
        style={{ WebkitTextStroke: "0.5px var(--keu-black)" }}
      >
        KEU LOCA
      </span>
      <span className="text-xs font-bold text-keu-black -mt-0.5">MOTOS</span>
      <span className="text-[10px] italic text-keu-red mt-0.5">
        Realizando Sonhos
      </span>
    </div>
  );
}

export function KeuMultimarcas({ className }: SubBrandProps) {
  return (
    <div className={cn("flex flex-col items-end", className)}>
      <span
        className="font-black italic text-keu-red text-xl leading-none"
        style={{ WebkitTextStroke: "0.5px var(--keu-black)" }}
      >
        KEU MULTIMARCAS
      </span>
      <span className="text-[10px] font-semibold text-keu-black/70 mt-1 tracking-wider">
        COMPRA • VENDE • TROCA
      </span>
    </div>
  );
}
