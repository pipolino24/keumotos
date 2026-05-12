import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "default" | "success";
}

/**
 * Estado vazio padrão pra listas. Ícone num círculo colorido + título + texto
 * + opcional CTA. Usa keyframes globais (animate-fade-up + animate-float)
 * pra dar um toque de vida sem dependências externas.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center py-10 px-6 animate-fade-up",
        className
      )}
    >
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float",
          variant === "success"
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-keu-red/10 text-keu-red"
        )}
      >
        {icon}
      </div>
      <h3 className="font-bold text-base mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-keu-black/60 max-w-sm mx-auto mb-4">
          {description}
        </p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
