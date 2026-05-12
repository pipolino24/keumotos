import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KEU Empreendimentos - Motos, Peças e Aluguel",
  description:
    "KEU Empreendimentos: KEU Moto Peças, KEU Loca Motos e KEU Multimarcas. Compra, venda, troca, aluguel e peças.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-keu-black">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="light"
          toastOptions={{
            classNames: {
              toast:
                "rounded-xl shadow-lg border-keu-black/5 font-medium",
              title: "font-bold",
              success: "!bg-emerald-50 !text-emerald-900 !border-emerald-200",
              error: "!bg-red-50 !text-red-900 !border-red-200",
              warning: "!bg-amber-50 !text-amber-900 !border-amber-200",
              info: "!bg-blue-50 !text-blue-900 !border-blue-200",
            },
          }}
        />
        <ConfirmDialogProvider />
      </body>
    </html>
  );
}
