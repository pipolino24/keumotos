"use client";

import { Phone, Mail, UserCircle2, MessageCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/lib/hooks/use-api";

interface VendedorInfo {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  avatar?: string;
  setor?: string;
  origem: "aluguel" | "venda" | "interesse" | "contato";
  atribuidoEm: string;
}

const origemLabel: Record<VendedorInfo["origem"], string> = {
  aluguel: "Vendedor do seu aluguel",
  venda: "Vendedor da sua compra",
  interesse: "Atendente do seu interesse",
  contato: "Quem te atendeu",
};

export function MeuVendedorWidget({ clienteId }: { clienteId: string }) {
  const { data, loading } = useApi<{ vendedor: VendedorInfo | null }>(
    clienteId ? `/api/clientes/${clienteId}/meu-vendedor` : null,
    [clienteId]
  );
  const v = data?.vendedor;

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-keu-black/5 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-keu-black/5 rounded animate-pulse" />
            <div className="h-3 w-48 bg-keu-black/5 rounded animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  if (!v) {
    return (
      <Card className="p-5 bg-gradient-to-br from-keu-gray-light to-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-keu-red/10 flex items-center justify-center text-keu-red">
            <UserCircle2 className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">Sem vendedor atribuído</div>
            <p className="text-xs text-keu-black/60 mt-0.5">
              Fale com a gente no WhatsApp pra ter atendimento personalizado.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const inicial = v.nome.charAt(0).toUpperCase();
  const wppLink = v.telefone
    ? `https://wa.me/55${v.telefone.replace(/\D/g, "")}`
    : null;

  return (
    <Card className="p-5 overflow-hidden relative group">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-keu-red/5 blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-4">
        {v.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.avatar}
            alt={v.nome}
            loading="lazy"
            className="w-14 h-14 rounded-full object-cover ring-2 ring-keu-red/20 flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-keu-red to-keu-red-dark text-white font-black text-xl flex items-center justify-center flex-shrink-0 shadow-md">
            {inicial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Badge variant="info" className="text-[9px] mb-1">
            {origemLabel[v.origem]}
          </Badge>
          <div className="font-bold text-base truncate">{v.nome}</div>
          {v.setor && (
            <div className="text-xs text-keu-black/60 capitalize truncate">
              KEU {v.setor}
            </div>
          )}
        </div>
      </div>
      <div className="relative flex flex-wrap gap-2 mt-4 pt-3 border-t border-keu-black/5">
        {wppLink && (
          <a
            href={wppLink}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition group/btn"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition" />
          </a>
        )}
        {v.telefone && (
          <a
            href={`tel:${v.telefone}`}
            className="inline-flex items-center gap-1.5 bg-keu-red/10 text-keu-red hover:bg-keu-red/20 px-3 py-1.5 rounded-lg text-xs font-bold transition"
          >
            <Phone className="h-3.5 w-3.5" /> Ligar
          </a>
        )}
        {v.email && (
          <a
            href={`mailto:${v.email}`}
            className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition"
          >
            <Mail className="h-3.5 w-3.5" /> E-mail
          </a>
        )}
      </div>
    </Card>
  );
}
