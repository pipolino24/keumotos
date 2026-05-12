"use client";

import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { useCurrentUser } from "@/lib/auth/user-context";

/**
 * Barra de ações no topo direito de cada página do dashboard.
 * Por enquanto: bell de notificações (só staff vê).
 * Mobile esconde — bell vai no MobileTopbar.
 */
export function TopActionBar() {
  const user = useCurrentUser();
  const isStaff =
    user.role === "admin" ||
    user.role === "vendedor" ||
    user.role === "afiliado";
  if (!isStaff) return null;

  return (
    <div className="hidden lg:flex fixed top-4 right-6 z-30 items-center gap-2">
      <NotificationsBell />
    </div>
  );
}
