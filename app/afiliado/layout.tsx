import { redirect } from "next/navigation";
import { AfiliadoSidebar } from "@/components/afiliado/sidebar";
import { requireProfile } from "@/lib/auth/server";
import { CurrentUserProvider } from "@/lib/auth/user-context";
import { AFILIADOS_OCULTOS } from "@/lib/feature-flags";

export default async function AfiliadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sistema oculto desde 2026-06-05 — toda /afiliado/* redireciona pra
  // landing. Pra reativar, mudar AFILIADOS_OCULTOS=false em lib/feature-flags.
  if (AFILIADOS_OCULTOS) redirect("/");
  const profile = await requireProfile("/afiliado");

  return (
    <CurrentUserProvider value={profile}>
      <div className="min-h-screen bg-keu-gray-light">
        <AfiliadoSidebar />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-6 md:p-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </CurrentUserProvider>
  );
}
