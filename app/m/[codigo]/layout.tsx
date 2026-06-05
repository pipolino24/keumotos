import { redirect } from "next/navigation";
import { AFILIADOS_OCULTOS } from "@/lib/feature-flags";

// Layout server-only que intercepta /m/[codigo] e redireciona pra catálogo
// enquanto o sistema de afiliados estiver oculto. Page original preservada
// no page.tsx — pra reativar mudar AFILIADOS_OCULTOS=false em lib/feature-flags.
export default function MCodigoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (AFILIADOS_OCULTOS) redirect("/motos");
  return children;
}
