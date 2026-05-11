import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { w: 60, h: 24 },
  md: { w: 100, h: 40 },
  lg: { w: 160, h: 64 },
  xl: { w: 240, h: 96 },
};

const fullSizeMap = {
  sm: { w: 100, h: 44 },
  md: { w: 160, h: 70 },
  lg: { w: 240, h: 105 },
  xl: { w: 360, h: 160 },
};

interface KeuLogoProps {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showSubtitle?: boolean;
}

export function KeuLogo({
  variant = "full",
  size = "md",
  className,
  showSubtitle = true,
}: KeuLogoProps) {
  if (variant === "icon" || !showSubtitle) {
    const dim = sizeMap[size];
    return (
      <Image
        src="/logos/keu-icon.webp"
        alt="KEU"
        width={dim.w}
        height={dim.h}
        priority
        className={cn("object-contain", className)}
      />
    );
  }

  const dim = fullSizeMap[size];
  return (
    <Image
      src="/logos/keu-empreendimentos.webp"
      alt="KEU Empreendimentos"
      width={dim.w}
      height={dim.h}
      priority
      className={cn("object-contain", className)}
    />
  );
}

interface SubBrandProps {
  className?: string;
  width?: number;
  height?: number;
}

export function KeuMotoPecas({
  className,
  width = 200,
  height = 120,
}: SubBrandProps) {
  return (
    <Image
      src="/logos/keu-moto-pecas.webp"
      alt="KEU Moto Peças e Borracharia Padre Cícero"
      width={width}
      height={height}
      className={cn("object-contain", className)}
    />
  );
}

export function KeuLocaMotos({
  className,
  width = 200,
  height = 160,
}: SubBrandProps) {
  return (
    <Image
      src="/logos/keu-loca-motos.webp"
      alt="KEU Loca Motos - Realizando Sonhos"
      width={width}
      height={height}
      className={cn("object-contain", className)}
    />
  );
}

export function KeuMultimarcas({
  className,
  width = 200,
  height = 120,
}: SubBrandProps) {
  return (
    <Image
      src="/logos/keu-multimarcas.webp"
      alt="KEU Multimarcas - Compra, Vende, Troca"
      width={width}
      height={height}
      className={cn("object-contain", className)}
    />
  );
}

export function KeuBanner({ className }: { className?: string }) {
  return (
    <Image
      src="/logos/banner.webp"
      alt="KEU Empreendimentos"
      width={2400}
      height={800}
      priority
      className={cn("object-contain w-full h-auto", className)}
    />
  );
}

export function MotoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("fill-keu-red", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
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
    </svg>
  );
}
