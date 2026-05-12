"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, User, LogOut, Settings, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser, isAdmin } from "@/lib/auth/user-context";

/**
 * Avatar com dropdown — fica no header (TopActionBar / MobileTopbar).
 * Mostra inicial colorida + nome (desktop) + menu com Perfil/Sair.
 */
export function AvatarMenu({ compact = false }: { compact?: boolean }) {
  const user = useCurrentUser();
  const userIsAdmin = isAdmin(user);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 transition-all rounded-full",
          compact ? "p-0.5" : "px-1 py-0.5 pr-2 hover:bg-keu-black/5",
          open && "bg-keu-black/5"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0",
            compact ? "w-9 h-9" : "w-8 h-8",
            userIsAdmin
              ? "bg-gradient-to-br from-amber-500 to-amber-600"
              : "bg-gradient-to-br from-keu-red to-keu-red-dark"
          )}
        >
          {user.nome.charAt(0).toUpperCase()}
        </div>
        {!compact && (
          <>
            <span className="text-xs font-semibold text-keu-black hidden sm:inline max-w-[120px] truncate">
              {user.nome.split(" ")[0]}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-keu-black/40 transition-transform hidden sm:inline",
                open && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-60 bg-white",
            "rounded-2xl shadow-2xl border border-keu-black/10",
            "overflow-hidden z-50 origin-top-right animate-slide-down"
          )}
        >
          <div className="px-4 py-3 border-b border-keu-black/5 flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0",
                userIsAdmin
                  ? "bg-gradient-to-br from-amber-500 to-amber-600"
                  : "bg-gradient-to-br from-keu-red to-keu-red-dark"
              )}
            >
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm truncate">{user.nome}</div>
              <div className="text-[10px] text-keu-black/50 uppercase tracking-wider font-semibold flex items-center gap-1">
                {userIsAdmin && <Crown className="h-3 w-3 text-amber-500" />}
                {user.role}
              </div>
            </div>
          </div>
          <div className="p-1">
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-keu-black/80 hover:bg-keu-gray-light"
            >
              <User className="h-4 w-4 text-keu-black/50" /> Meu perfil
            </Link>
            {userIsAdmin && (
              <Link
                href="/dashboard/administracao"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-keu-black/80 hover:bg-keu-gray-light"
              >
                <Settings className="h-4 w-4 text-keu-black/50" /> Administração
              </Link>
            )}
            <form action="/auth/logout" method="post">
              <button
                type="submit"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-keu-red hover:bg-keu-red/10 text-left"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
