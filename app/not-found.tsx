import Link from "next/link";
import { Bike, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-keu-gray-light">
      <div className="max-w-md w-full text-center animate-fade-up">
        <div className="relative mb-6">
          <div className="text-[140px] font-black leading-none text-keu-red/10 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Bike className="h-20 w-20 text-keu-red animate-float" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3">
          Página não encontrada
        </h1>
        <p className="text-keu-black/60 mb-6">
          Essa moto deu pinote e sumiu. Mas tem várias outras esperando você no
          catálogo.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4" /> Home
            </Button>
          </Link>
          <Link href="/motos">
            <Button>
              <Search className="h-4 w-4" /> Ver motos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
