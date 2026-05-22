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
  Heart,
  Banknote,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KeuLogo } from "@/components/keu-logo";
import { useCurrentUser, isAdmin } from "@/lib/auth/user-context";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { AvatarMenu } from "@/components/dashboard/avatar-menu";
import { useNotifications } from "@/lib/hooks/use-notifications";

const staffNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Meu painel" },
  { href: "/dashboard/vendas", icon: ShoppingCart, label: "Vendas" },
  { href: "/dashboard/aluguel", icon: KeyRound, label: "Aluguel" },
  {
    href: "/dashboard/inadimplencia",
    icon: AlertTriangle,
    label: "Inadimplência",
  },
  { href: "/dashboard/estoque", icon: Package, label: "Estoque" },
  { href: "/dashboard/contatos", icon: Phone, label: "Leads" },
  { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
];

const clienteNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Meu painel" },
  { href: "/motos", icon: Bike, label: "Catálogo" },
  { href: "/dashboard/favoritos", icon: Heart, label: "Favoritos" },
];

// Aquisições não entra no menu — acessada via botão "Compra/Repasse" no /estoque
const adminNavItems = [
  { href: "/dashboard/administracao", icon: Crown, label: "Administração" },
  { href: "/dashboard/contratos", icon: FileText, label: "Contratos" },
  { href: "/dashboard/emprestimos", icon: Banknote, label: "Empréstimos" },
  { href: "/dashboard/proprietarios", icon: Users, label: "Fornecedores" },
  { href: "/dashboard/usuarios", icon: Users, label: "Usuários" },
  { href: "/dashboard/afiliados", icon: Handshake, label: "Afiliados" },
];

/**
 * Renderiza o conteúdo do link (ícone + label + badge). Recebe `unreadCount`
 * já calculado pelo parent — antes esse componente chamava useNotifications
 * em cada link do nav (6+ pollings paralelos a cada 25s).
 */
function NavLinkInner({
  icon: Icon,
  label,
  unread,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  unread: number;
}) {
  return (
    <>
      <span className="relative flex-shrink-0">
        <Icon className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-keu-red text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </span>
      <span className="flex-1">{label}</span>
    </>
  );
}

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
  // 1 polling do hook por instância do sidebar — não por item de nav
  const { unreadCount } = useNotifications();
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
          // Badge de notificações não lidas ao lado de "Meu painel"
          const showBadge = item.href === "/dashboard";
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
              <NavLinkInner
                icon={item.icon}
                label={item.label}
                unread={showBadge ? unreadCount : 0}
              />
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
    // setTimeout 0 evita "setState in effect" do React 19; comportamento
    // prático é fechar o menu quando a rota muda.
    const t = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(t);
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
          <div className="flex items-center gap-2">
            {user.role !== "cliente" && <NotificationsBell />}
            <AvatarMenu compact />
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
