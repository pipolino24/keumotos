import { AfiliadoSidebar } from "@/components/afiliado/sidebar";

export default function AfiliadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-keu-gray-light">
      <AfiliadoSidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 md:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
