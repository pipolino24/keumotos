"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface UserMini {
  nome: string;
  role: string;
}

/**
 * Mostra avatar+atalho pro painel se o usuário estiver logado,
 * senão mostra o botão "Entrar". Usado no header da /motos (ISR-cached,
 * por isso a detecção tem que rodar no cliente).
 */
export function HeaderUserButton() {
  const [user, setUser] = useState<UserMini | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) {
        setUser({
          nome:
            (data.user.user_metadata?.nome as string) ||
            data.user.email?.split("@")[0] ||
            "Você",
          role: (data.user.user_metadata?.role as string) || "cliente",
        });
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <div className="w-20 h-9 rounded-md bg-keu-black/5 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          <LogIn className="h-3.5 w-3.5" /> Entrar
        </Button>
      </Link>
    );
  }

  const inicial = user.nome.charAt(0).toUpperCase();
  const isAdmin = user.role === "admin";

  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-keu-black/5 transition group"
      aria-label="Ir para o painel"
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 ${
          isAdmin
            ? "bg-gradient-to-br from-amber-500 to-amber-600"
            : "bg-gradient-to-br from-keu-red to-keu-red-dark"
        }`}
      >
        {inicial}
      </div>
      <div className="hidden sm:flex flex-col items-start leading-tight">
        <span className="text-xs text-keu-black/50">Olá,</span>
        <span className="text-sm font-bold text-keu-black max-w-[100px] truncate">
          {user.nome.split(" ")[0]}
        </span>
      </div>
      <LayoutDashboard className="h-3.5 w-3.5 text-keu-black/40 hidden sm:inline group-hover:text-keu-red transition" />
    </Link>
  );
}
