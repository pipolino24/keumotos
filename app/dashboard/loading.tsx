import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-keu-gray-light">
      {/* PageHeader skeleton */}
      <div className="mb-6 bg-white border-b border-keu-black/5 px-6 py-5 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-keu-black/5 rounded animate-pulse" />
          <div className="h-4 w-72 bg-keu-black/5 rounded animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-keu-red/20 rounded-lg animate-pulse" />
      </div>

      {/* Stats grid skeleton */}
      <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-white border border-keu-black/5 space-y-3"
          >
            <div className="h-10 w-10 bg-keu-red/10 rounded-lg animate-pulse" />
            <div className="h-8 w-24 bg-keu-black/5 rounded animate-pulse" />
            <div className="h-3 w-32 bg-keu-black/5 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="px-6">
        <div className="rounded-xl bg-white border border-keu-black/5 p-10 flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-keu-red animate-spin" />
          <span className="text-sm text-keu-black/50">Carregando…</span>
        </div>
      </div>
    </div>
  );
}
