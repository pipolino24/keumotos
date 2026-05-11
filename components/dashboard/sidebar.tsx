"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  KeyRound,
  Package,
  Users,
  Phone,
  LogOut,
  Settings,
  Bike,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KeuLogo } from "@/components/keu-logo";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Visão Geral" },
  { href: "/dashboard/vendas", icon: ShoppingCart, label: "Vendas" },
  { href: "/dashboard/aluguel", icon: KeyRound, label: "Aluguel" },
  { href: "/dashboard/estoque", icon: Package, label: "Estoque" },
  { href: "/dashboard/contatos", icon: Phone, label: "Contatos" },
  { href: "/dashboard/usuarios", icon: Users, label: "Usuários" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 bg-keu-black text-white flex-col fixed inset-y-0 left-0 z-40">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="block">
          <KeuLogo size="sm" showSubtitle={false} />
          <span className="block text-[10px] font-bold tracking-[0.3em] text-white/40 mt-1">
            EMPREENDIMENTOS
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="text-xs font-bold uppercase tracking-wider text-white/40 px-3 mb-2">
          Principal
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
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

      <div className="p-4 border-t border-white/10 space-y-1">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <Settings className="h-4 w-4" /> Configurações
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-keu-red hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sair
        </Link>
      </div>

      <div className="p-4 bg-keu-red/10 border-t border-keu-red/20 m-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="bg-keu-red w-10 h-10 rounded-full flex items-center justify-center font-bold">
            M
          </div>
          <div className="text-xs">
            <div className="font-semibold">Marcos V. Lima</div>
            <div className="text-white/50">Vendedor</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileTopbar() {
  return (
    <div className="lg:hidden sticky top-0 z-30 bg-keu-black text-white border-b border-white/10">
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <Bike className="h-5 w-5 text-keu-red" />
          <span className="font-black text-xl">KEU</span>
        </Link>
        <nav className="flex gap-1">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-2 rounded-md hover:bg-white/10"
            >
              <item.icon className="h-4 w-4" />
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
