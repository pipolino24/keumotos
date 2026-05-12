export default function Loading() {
  return (
    <div className="min-h-screen bg-keu-gray-light">
      <div className="bg-white border-b border-keu-black/5 px-6 py-5 mb-6 space-y-2">
        <div className="h-7 w-40 bg-keu-black/5 rounded animate-pulse" />
        <div className="h-4 w-56 bg-keu-black/5 rounded animate-pulse" />
      </div>
      <div className="px-6 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-white border border-keu-black/5 p-4 flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-keu-red/10 animate-pulse flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 w-2/3 bg-keu-black/5 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-keu-black/5 rounded animate-pulse" />
            </div>
            <div className="h-3 w-10 bg-keu-black/5 rounded animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
