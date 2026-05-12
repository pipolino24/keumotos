"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app:error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-keu-gray-light">
      <div className="max-w-md w-full text-center animate-fade-up">
        <div className="bg-keu-red/10 text-keu-red w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse-soft">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3">
          Algo deu errado
        </h1>
        <p className="text-keu-black/60 mb-6">
          A KEU pediu desculpas — encontramos um problema inesperado. Tente
          novamente ou volte pra home.
        </p>
        {error.digest && (
          <p className="text-xs text-keu-black/40 mb-6 font-mono">
            ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="h-4 w-4" /> Tentar de novo
          </Button>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4" /> Ir pra home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
