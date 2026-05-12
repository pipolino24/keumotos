"use client";

import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { AvatarMenu } from "@/components/dashboard/avatar-menu";
import { useCurrentUser } from "@/lib/auth/user-context";

/**
 * Barra de ações no topo direito de cada página do dashboard.
 * - Bell de notificações (só staff)
 * - Avatar dropdown com Perfil/Logout (todos)
 */
export function TopActionBar() {
  const user = useCurrentUser();
  const isStaff =
    user.role === "admin" ||
    user.role === "vendedor" ||
    user.role === "afiliado";

  return (
    <div className="hidden lg:flex fixed top-4 right-6 z-30 items-center gap-2">
      {isStaff && <NotificationsBell />}
      <AvatarMenu />
    </div>
  );
}
