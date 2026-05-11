"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  Handshake,
  Shield,
  Crown,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KeuLogo } from "@/components/keu-logo";
import { getCurrentUser, isAdmin } from "@/lib/current-user";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Meu painel" },
  { href: "/dashboard/vendas", icon: ShoppingCart, label: "Vendas" },
  { href: "/dashboard/aluguel", icon: KeyRound, label: "Aluguel" },
  { href: "/dashboard/estoque", icon: Package, label: "Estoque" },
  { href: "/dashboard/contatos", icon: Phone, label: "Contatos" },
];

const adminNavItems = [
  { href: "/dashboard/administracao", icon: Crown, label: "Administração" },
  { href: "/dashboard/aquisicoes", icon: ShoppingBag, label: "Aquisições" },
  { href: "/dashboard/proprietarios", icon: Users, label: "Proprietários" },
  { href: "/dashboard/usuarios", icon: Users, label: "Usuários" },
  { href: "/dashboard/afiliados", icon: Handshake, label: "Afiliados" },
];

function SidebarContent({
  pathname,
  userIsAdmin,
  userName,
  userRole,
  onItemClick,
}: {
  pathname: string;
  userIsAdmin: boolean;
  userName: string;
  userRole: string;
  onItemClick?: () => void;
}) {
  return (
    <>
      <div className="p-6 border-b border-white/10 bg-white">
        <Link href="/" className="block" onClick={onItemClick}>
          <KeuLogo size="md" />
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
              onClick={onItemClick}
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

        {userIsAdmin && (
          <>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 px-3 mb-2 mt-6">
              <Shield className="h-3 w-3" />
              Restrito Admin
            </div>
            {adminNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-amber-500 text-white shadow-lg"
                      : "text-amber-300/80 hover:bg-amber-500/10 hover:text-amber-200"
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
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <Link
          href="#"
          onClick={onItemClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <Settings className="h-4 w-4" /> Configurações
        </Link>
        <Link
          href="/"
          onClick={() => {
            document.cookie = "keu_role=; path=/; max-age=0";
            onItemClick?.();
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-keu-red hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sair
        </Link>
      </div>

      <div
        className={cn(
          "p-4 border-t m-4 rounded-xl",
          userIsAdmin
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-keu-red/10 border-keu-red/20"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold",
              userIsAdmin ? "bg-amber-500" : "bg-keu-red"
            )}
          >
            {userName.charAt(0)}
          </div>
          <div className="text-xs flex-1 min-w-0">
            <div className="font-semibold truncate">{userName}</div>
            <div className="text-white/50 capitalize flex items-center gap-1">
              {userIsAdmin && <Crown className="h-3 w-3" />}
              {userRole}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = getCurrentUser();
  const userIsAdmin = isAdmin(user);

  return (
    <aside className="hidden lg:flex w-64 bg-gradient-to-b from-keu-gray via-keu-black to-keu-gray text-white flex-col fixed inset-y-0 left-0 z-40 shadow-2xl">
      <SidebarContent
        pathname={pathname}
        userIsAdmin={userIsAdmin}
        userName={user.nome}
        userRole={user.role}
      />
    </aside>
  );
}

export function MobileTopbar() {
  const pathname = usePathname();
  const user = getCurrentUser();
  const userIsAdmin = isAdmin(user);
  const [open, setOpen] = useState(false);

  // Fecha o drawer quando muda de rota
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 bg-gradient-to-r from-keu-gray to-keu-black text-white border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-md hover:bg-white/10"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Bike className="h-5 w-5 text-keu-red" />
            <span className="font-black text-xl">KEU</span>
          </Link>
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs",
              userIsAdmin ? "bg-amber-500" : "bg-keu-red"
            )}
          >
            {user.nome.charAt(0)}
          </div>
        </div>
      </div>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute left-0 inset-y-0 w-72 bg-gradient-to-b from-keu-gray via-keu-black to-keu-gray text-white flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-md hover:bg-white/10 z-10"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              userIsAdmin={userIsAdmin}
              userName={user.nome}
              userRole={user.role}
              onItemClick={() => setOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
