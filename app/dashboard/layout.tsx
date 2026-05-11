import { Sidebar, MobileTopbar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-keu-gray-light">
      <Sidebar />
      <MobileTopbar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 md:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
