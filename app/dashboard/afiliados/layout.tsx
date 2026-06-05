import { redirect } from "next/navigation";
import { AFILIADOS_OCULTOS } from "@/lib/feature-flags";

// Layout server-only que intercepta /dashboard/afiliados/* e redireciona
// pro dashboard principal enquanto o sistema estiver oculto. Pages originais
// preservadas — pra reativar mudar AFILIADOS_OCULTOS=false em lib/feature-flags.
export default function DashboardAfiliadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (AFILIADOS_OCULTOS) redirect("/dashboard");
  return children;
}
