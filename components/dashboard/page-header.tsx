import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8",
        className
      )}
    >
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-keu-black">
          {title}
        </h1>
        {description && (
          <p className="text-keu-black/60 mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
