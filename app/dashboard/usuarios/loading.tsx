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
      <div className="px-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white border border-keu-black/5 p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/20 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-keu-black/5 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-keu-black/5 rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-blue-500/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
