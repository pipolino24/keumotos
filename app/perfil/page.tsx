import { requireProfile } from "@/lib/auth/server";
import { CurrentUserProvider } from "@/lib/auth/user-context";
import { PerfilForm } from "./perfil-form";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const profile = await requireProfile("/perfil");

  return (
    <CurrentUserProvider value={profile}>
      <div className="min-h-screen bg-keu-gray-light py-8">
        <div className="max-w-3xl mx-auto px-4">
          <PerfilForm profile={profile} />
        </div>
      </div>
    </CurrentUserProvider>
  );
}
