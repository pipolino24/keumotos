import { Bike } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-keu-gray-light">
      {/* HEADER skeleton */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-keu-black/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="h-8 w-24 bg-keu-black/5 rounded animate-pulse" />
          <div className="h-8 w-28 bg-keu-red/20 rounded animate-pulse" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Gallery skeleton */}
          <div className="space-y-3">
            <div className="aspect-[4/3] bg-gradient-to-br from-keu-gray-light via-white to-keu-red/5 rounded-xl flex items-center justify-center border border-keu-black/5">
              <Bike className="h-16 w-16 text-keu-red/10 animate-pulse" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-keu-black/5 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Info panel skeleton */}
          <div className="space-y-4">
            <div className="rounded-xl bg-white border border-keu-black/5 p-6 space-y-4">
              <div className="h-4 w-20 bg-keu-red/10 rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-keu-black/5 rounded animate-pulse" />
              <div className="h-12 w-1/2 bg-keu-red/10 rounded animate-pulse" />
              <div className="border-t border-keu-black/5 pt-4 grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 w-1/2 bg-keu-black/5 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-keu-black/5 rounded animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-12 bg-keu-red rounded-lg animate-pulse mt-4" />
              <div className="h-10 bg-emerald-500/20 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
