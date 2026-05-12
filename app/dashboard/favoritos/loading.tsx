import { Heart } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-keu-gray-light">
      <div className="bg-white border-b border-keu-black/5 px-6 py-5 mb-6 space-y-2">
        <div className="h-7 w-36 bg-keu-black/5 rounded animate-pulse" />
        <div className="h-4 w-60 bg-keu-black/5 rounded animate-pulse" />
      </div>
      <div className="px-6 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white border border-keu-black/5 overflow-hidden"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-keu-gray-light via-white to-pink-100/30 flex items-center justify-center">
              <Heart className="h-10 w-10 text-pink-300/40 animate-pulse" />
            </div>
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-keu-black/5 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-keu-black/5 rounded animate-pulse" />
              <div className="h-6 w-24 bg-keu-red/10 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
