import { Bike } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-keu-gray-light">
      {/* HEADER skeleton */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-keu-black/5">
        <div className="container mx-auto px-4 h-16 flex items-center max-w-7xl">
          <div className="h-8 w-24 bg-keu-black/5 rounded animate-pulse" />
        </div>
      </div>

      {/* HERO skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-keu-gray-light to-white py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-5">
          <div className="inline-block h-6 w-24 bg-keu-red/10 rounded-full animate-pulse" />
          <div className="h-12 md:h-16 w-3/4 mx-auto bg-keu-black/5 rounded-lg animate-pulse" />
          <div className="h-6 w-1/2 mx-auto bg-keu-black/5 rounded animate-pulse" />
          <div className="h-14 max-w-2xl mx-auto bg-white shadow-2xl rounded-xl animate-pulse mt-4" />
        </div>
      </section>

      {/* GRID skeleton */}
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar filtros */}
            <aside className="space-y-4 hidden lg:block">
              <div className="h-56 bg-white rounded-lg animate-pulse" />
            </aside>

            <div>
              <div className="flex items-center justify-between mb-6 gap-3">
                <div className="h-8 w-48 bg-keu-black/5 rounded animate-pulse" />
                <div className="h-8 w-32 bg-keu-black/5 rounded animate-pulse" />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white border border-keu-black/5 overflow-hidden"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-keu-gray-light via-white to-keu-red/5 flex items-center justify-center">
                      <Bike className="h-12 w-12 text-keu-red/10 animate-pulse" />
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="h-5 w-3/4 bg-keu-black/5 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-keu-black/5 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-keu-black/5 rounded animate-pulse" />
                      <div className="border-t border-keu-black/5 pt-3 flex justify-between items-center">
                        <div className="h-7 w-24 bg-keu-red/10 rounded animate-pulse" />
                        <div className="h-7 w-16 bg-keu-red rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
