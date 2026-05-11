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
    <aside className="hidden lg:flex w-64 bg-gradient-to-b from-keu-black via-keu-gray to-keu-black text-white flex-col fixed inset-y-0 left-0 z-40">
      <div className="p-6 border-b border-white/10 bg-white">
        <Link href="/" className="block">
          <KeuLogo size="md" />
        </Link>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-gradient-to-br from-purple-500 to-keu-red rounded-xl p-3 flex items-center gap-2">
          <Handshake className="h-5 w-5 text-white" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-white/80">
              Área do Afiliado
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
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
                  ? "bg-keu-red text-white shadow-lg shadow-keu-red/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-keu-red hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sair
        </Link>
      </div>
    </aside>
  );
}
