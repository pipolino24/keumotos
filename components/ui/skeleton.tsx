import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Bloco placeholder com shimmer animation. Usa a classe `.skeleton` definida
 * em globals.css. Substitui `Loader2 spin` em estados onde já temos noção
 * do shape do conteúdo.
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

/** Linha típica de uma list view — avatar + duas linhas de texto. */
export function SkeletonListRow({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-center gap-3 p-4", className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-1/2" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

/** Card de stats no estilo do dashboard. */
export function SkeletonStatCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "p-6 bg-white rounded-2xl border border-keu-black/5",
        className
      )}
    >
      <Skeleton className="h-10 w-10 rounded-lg mb-4" />
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32 mb-2" />
      <Skeleton className="h-2 w-24" />
    </div>
  );
}

/** Cards de moto no /motos durante fetch. */
export function SkeletonMotoCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-keu-black/5 overflow-hidden",
        className
      )}
    >
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="border-t border-keu-black/5 pt-3 flex justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
