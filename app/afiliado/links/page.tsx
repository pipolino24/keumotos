"use client";

import { useState } from "react";
import {
  Link2,
  Copy,
  ExternalLink,
  Share2,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { toast } from "sonner";

const me = { codigo: "joao-silva-keu" };

const motosCompartilhadas = [
  {
    id: "1",
    moto: "Honda CG 160 Titan",
    ano: 2024,
    cliques: 47,
    conversoes: 1,
    link: "/m/joao-silva-keu/1",
  },
  {
    id: "2",
    moto: "Yamaha Fazer 250 ABS",
    ano: 2024,
    cliques: 23,
    conversoes: 0,
    link: "/m/joao-silva-keu/2",
  },
  {
    id: "3",
    moto: "Honda PCX 160",
    ano: 2025,
    cliques: 89,
    conversoes: 2,
    link: "/m/joao-silva-keu/3",
  },
];

export default function MeusLinksPage() {
  function copy(link: string) {
    navigator.clipboard.writeText(`${window.location.origin}${link}`);
    toast.success("Link copiado");
  }

  const linkPrincipal =
    typeof window !== "undefined"
      ? `${window.location.origin}/m/${me.codigo}`
      : `/m/${me.codigo}`;

  return (
    <div>
      <PageHeader
        title="Meus links"
        description="Acompanhe o desempenho de cada link que você compartilhou"
      />

      {/* LINK PRINCIPAL */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-purple-500 via-keu-red to-keu-red-dark text-white">
        <div className="text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
          Link principal (catálogo completo)
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-4 py-3 font-mono text-base flex-1 min-w-0 truncate">
            {linkPrincipal}
          </div>
          <Button
            variant="white"
            onClick={() => copy(`/m/${me.codigo}`)}
            className="text-keu-red font-bold"
          >
            <Copy className="h-4 w-4" /> Copiar
          </Button>
        </div>
      </Card>

      {/* LINKS POR MOTO */}
      <Card>
        <div className="p-5 border-b border-keu-black/5">
          <h2 className="font-bold text-lg">Links por moto</h2>
          <p className="text-sm text-keu-black/60">
            Vá em "Motos disponíveis" pra gerar mais links
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-keu-gray-light text-xs uppercase font-semibold text-keu-black/60">
              <tr>
                <th className="text-left p-4">Moto</th>
                <th className="text-left p-4">Link</th>
                <th className="text-center p-4">Cliques</th>
                <th className="text-center p-4">Vendas</th>
                <th className="text-right p-4">Conversão</th>
                <th className="text-right p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-keu-black/5">
              {motosCompartilhadas.map((m) => {
                const conv =
                  m.cliques > 0
                    ? ((m.conversoes / m.cliques) * 100).toFixed(1)
                    : "0";
                return (
                  <tr key={m.id} className="hover:bg-keu-gray-light transition">
                    <td className="p-4 font-semibold">
                      {m.moto}
                      <div className="text-xs text-keu-black/60 font-normal">
                        {m.ano}
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="bg-keu-gray-light px-2 py-1 rounded text-xs font-mono">
                        {m.link}
                      </code>
                    </td>
                    <td className="p-4 text-center font-semibold">
                      {m.cliques}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={m.conversoes > 0 ? "success" : "outline"}>
                        {m.conversoes}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-bold text-keu-red">{conv}%</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copy(m.link)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <a href={m.link} target="_blank" rel="noopener">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
