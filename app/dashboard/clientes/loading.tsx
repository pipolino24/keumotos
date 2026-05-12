export default function Loading() {
  return (
    <div className="min-h-screen bg-keu-gray-light">
      <div className="bg-white border-b border-keu-black/5 px-6 py-5 mb-6 space-y-2">
        <div className="h-7 w-40 bg-keu-black/5 rounded animate-pulse" />
        <div className="h-4 w-60 bg-keu-black/5 rounded animate-pulse" />
      </div>
      <div className="px-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white border border-keu-black/5 p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-keu-red/10 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-keu-black/5 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-keu-black/5 rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-keu-red/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
