"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bike,
  Link2,
  DollarSign,
  User,
  LogOut,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KeuLogo } from "@/components/keu-logo";

const navItems = [
  { href: "/afiliado", icon: LayoutDashboard, label: "Painel" },
  { href: "/afiliado/motos", icon: Bike, label: "Motos disponíveis" },
  { href: "/afiliado/links", icon: Link2, label: "Meus links" },
  { href: "/afiliado/vendas", icon: DollarSign, label: "Comissões" },
  { href: "/afiliado/perfil", icon: User, label: "Meu perfil" },
];

export function AfiliadoSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-keu-black/10 text-keu-black flex-col fixed inset-y-0 left-0 z-40">
      <div className="p-5 border-b border-keu-black/5">
        <Link href="/" className="block">
          <KeuLogo size="md" />
        </Link>
      </div>

      <div className="px-3 pt-3">
        <div className="bg-gradient-to-br from-purple-500 to-keu-red rounded-xl p-3 flex items-center gap-2 text-white">
          <Handshake className="h-5 w-5" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              Área do Afiliado
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/afiliado" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-keu-red text-white shadow-md shadow-keu-red/25"
                  : "text-keu-black/70 hover:bg-keu-gray-light hover:text-keu-black"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-keu-black/5">
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-keu-black/70 hover:bg-keu-red hover:text-white text-left"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
