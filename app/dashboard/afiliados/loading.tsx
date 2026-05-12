export default function Loading() {
  return (
    <div className="min-h-screen bg-keu-gray-light">
      <div className="bg-white border-b border-keu-black/5 px-6 py-5 mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-keu-black/5 rounded animate-pulse" />
          <div className="h-4 w-56 bg-keu-black/5 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-keu-red/20 rounded-lg animate-pulse" />
      </div>
      <div className="px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white border border-keu-black/5 p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-keu-black/5 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-keu-black/5 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-2/3 bg-keu-black/5 rounded animate-pulse" />
            <div className="h-8 w-full bg-emerald-500/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
