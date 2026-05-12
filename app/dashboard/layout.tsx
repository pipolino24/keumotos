import { Sidebar, MobileTopbar } from "@/components/dashboard/sidebar";
import { requireProfile } from "@/lib/auth/server";
import { CurrentUserProvider } from "@/lib/auth/user-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile("/dashboard");

  return (
    <CurrentUserProvider value={profile}>
      <div className="min-h-screen bg-keu-gray-light">
        <Sidebar />
        <MobileTopbar />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-6 md:p-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </CurrentUserProvider>
  );
}
