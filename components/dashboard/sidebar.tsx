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
import { useCurrentUser, isAdmin } from "@/lib/auth/user-context";

const staffNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Meu painel" },
  { href: "/dashboard/vendas", icon: ShoppingCart, label: "Vendas" },
  { href: "/dashboard/aluguel", icon: KeyRound, label: "Aluguel" },
  { href: "/dashboard/estoque", icon: Package, label: "Estoque" },
  { href: "/dashboard/contatos", icon: Phone, label: "Contatos" },
];

const clienteNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Meu painel" },
  { href: "/motos", icon: Bike, label: "Catálogo" },
];

const adminNavItems = [
  { href: "/dashboard/administracao", icon: Crown, label: "Administração" },
  { href: "/dashboard/aquisicoes", icon: ShoppingBag, label: "Aquisições" },
  { href: "/dashboard/proprietarios", icon: Users, label: "Pessoas" },
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
      <div className="p-5 border-b border-keu-black/5">
        <Link href="/" className="block" onClick={onItemClick}>
          <KeuLogo size="md" />
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-keu-black/40 px-3 mb-2 mt-1">
          Principal
        </div>
        {(userRole === "cliente" ? clienteNavItems : staffNavItems).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group",
                isActive
                  ? "bg-keu-red text-white shadow-md shadow-keu-red/25"
                  : "text-keu-black/70 hover:bg-keu-gray-light hover:text-keu-black"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}

        {userIsAdmin && (
          <>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-keu-black/40 px-3 mb-2 mt-6">
              <Shield className="h-3 w-3 text-amber-500" />
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                    isActive
                      ? "bg-keu-black text-white shadow-md"
                      : "text-keu-black/70 hover:bg-amber-500/10 hover:text-keu-black"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      !isActive && "text-amber-600"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-keu-black/5 space-y-0.5">
        <Link
          href="/perfil"
          onClick={onItemClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-keu-black/70 hover:bg-keu-gray-light hover:text-keu-black"
        >
          <Settings className="h-4 w-4" /> Meu perfil
        </Link>
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            onClick={onItemClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-keu-black/70 hover:bg-keu-red hover:text-white text-left"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </form>
      </div>

      <div
        className={cn(
          "px-3 py-3 border-t flex items-center gap-3",
          userIsAdmin ? "border-amber-200 bg-amber-50/40" : "border-keu-red/15 bg-keu-red/5"
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0",
            userIsAdmin
              ? "bg-gradient-to-br from-amber-500 to-amber-600"
              : "bg-gradient-to-br from-keu-red to-keu-red-dark"
          )}
        >
          {userName.charAt(0)}
        </div>
        <div className="text-xs flex-1 min-w-0">
          <div className="font-semibold truncate text-keu-black">
            {userName}
          </div>
          <div className="text-keu-black/50 capitalize flex items-center gap-1">
            {userIsAdmin && <Crown className="h-3 w-3 text-amber-500" />}
            {userRole}
          </div>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const userIsAdmin = isAdmin(user);

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-keu-black/10 text-keu-black flex-col fixed inset-y-0 left-0 z-40">
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
  const user = useCurrentUser();
  const userIsAdmin = isAdmin(user);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-keu-black/10">
        <div className="flex items-center justify-between p-3">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-md hover:bg-keu-gray-light"
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
              "w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs",
              userIsAdmin
                ? "bg-gradient-to-br from-amber-500 to-amber-600"
                : "bg-gradient-to-br from-keu-red to-keu-red-dark"
            )}
          >
            {user.nome.charAt(0)}
          </div>
        </div>
      </div>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute left-0 inset-y-0 w-72 bg-white text-keu-black flex flex-col animate-slide-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-md hover:bg-keu-gray-light z-10"
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
