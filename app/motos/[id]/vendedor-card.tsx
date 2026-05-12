"use client";

import { useEffect, useState } from "react";
import { User, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  motoId: string;
  motoLabel: string;
}

interface Vendedor {
  nome: string;
  telefone: string | null;
}

/**
 * Card público mostrando o vendedor responsável pela moto. Carrega
 * lazy pra não bloquear renderização da página de detalhe. Se a moto
 * não tem vendedor responsável, o componente não renderiza nada.
 */
export function VendedorCard({ motoId, motoLabel }: Props) {
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/motos/${motoId}/vendedor`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { vendedor: null }))
      .then((json) => {
        if (cancelled) return;
        if (json?.vendedor) setVendedor(json.vendedor);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [motoId]);

  if (!loaded || !vendedor) return null;

  const whatsapp = vendedor.telefone
    ? `https://wa.me/55${vendedor.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá ${vendedor.nome}! Tenho interesse na ${motoLabel}.`
      )}`
    : null;

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 border-emerald-500/20 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
          {vendedor.nome.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-keu-black/50 font-semibold flex items-center gap-1">
            <User className="h-3 w-3" /> Atendido por
          </div>
          <div className="font-bold text-sm truncate">{vendedor.nome}</div>
        </div>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Chamar
          </a>
        )}
      </div>
    </Card>
  );
}
