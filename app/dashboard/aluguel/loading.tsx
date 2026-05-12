export default function Loading() {
  return (
    <div className="min-h-screen bg-keu-gray-light">
      <div className="bg-white border-b border-keu-black/5 px-6 py-5 mb-6 space-y-2">
        <div className="h-7 w-32 bg-keu-black/5 rounded animate-pulse" />
        <div className="h-4 w-56 bg-keu-black/5 rounded animate-pulse" />
      </div>
      <div className="px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-white border border-keu-black/5 space-y-3"
          >
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg animate-pulse" />
            <div className="h-7 w-24 bg-keu-black/5 rounded animate-pulse" />
            <div className="h-3 w-32 bg-keu-black/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="px-6 rounded-xl bg-white border border-keu-black/5 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="px-5 py-4 flex items-center gap-4 border-b border-keu-black/5 last:border-0"
          >
            <div className="w-12 h-12 rounded-lg bg-keu-red/10 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-keu-black/5 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-keu-black/5 rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-emerald-500/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
