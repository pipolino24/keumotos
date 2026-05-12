"use client";

import Link from "next/link";
import { Flame, Phone, ArrowRight, Loader2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";

interface LeadQuente {
  clienteId?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  totalInteresses: number;
  eventosQuentes: number;
  motosCount: number;
  ultimoTipo: string;
  ultimaMoto?: string;
  score: number;
  ultimoAt: string;
}

const tipoLabel: Record<string, string> = {
  visualizou: "visualizou",
  simulou_financiamento: "simulou financiamento",
  enviou_lead: "enviou lead",
  solicitou_aluguel: "solicitou aluguel",
  solicitou_compra: "solicitou compra",
  favoritou: "favoritou",
};

function tempo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "agora";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function LeadsQuentesWidget({ limit = 5 }: { limit?: number }) {
  const { data, loading } = useApi<{ leads: LeadQuente[] }>(
    `/api/leads-quentes?limit=${limit}`
  );

  const leads = data?.leads ?? [];

  return (
    <Card>
      <div className="p-5 border-b border-keu-black/5 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" /> Leads quentes
          </h2>
          <p className="text-xs text-keu-black/50">
            Clientes com mais engajamento — atender primeiro!
          </p>
        </div>
        <Link
          href="/dashboard/clientes"
          className="text-xs text-keu-red hover:underline font-semibold"
        >
          Clientes →
        </Link>
      </div>
      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-keu-red mx-auto" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Sem leads quentes ainda"
          description="Conforme os clientes interagirem mais (≥3 ações em 30 dias), aparecem aqui priorizados pelo engajamento."
        />
      ) : (
        <div className="divide-y divide-keu-black/5">
          {leads.map((lead, i) => {
            const nome = lead.clienteNome || "Cliente";
            const inicial = nome.charAt(0).toUpperCase();
            return (
              <div
                key={`${lead.clienteId ?? "anon"}-${i}`}
                className="p-3 px-5 flex items-center gap-3 hover:bg-keu-gray-light transition"
              >
                <div className="bg-gradient-to-br from-orange-400 to-keu-red text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm shadow-md">
                  {inicial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate flex items-center gap-2">
                    {nome}
                    <Badge variant="warning" className="text-[9px]">
                      🔥 {lead.score}
                    </Badge>
                  </div>
                  <div className="text-xs text-keu-black/60 truncate">
                    {lead.totalInteresses} ações · {lead.motosCount} moto
                    {lead.motosCount > 1 ? "s" : ""} ·{" "}
                    {tipoLabel[lead.ultimoTipo] ?? lead.ultimoTipo}{" "}
                    {lead.ultimaMoto && `"${lead.ultimaMoto}"`} ·{" "}
                    {tempo(lead.ultimoAt)} atrás
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {lead.clienteTelefone && (
                    <a
                      href={`https://wa.me/55${lead.clienteTelefone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold transition"
                    >
                      <Phone className="h-2.5 w-2.5" /> WhatsApp
                    </a>
                  )}
                  {lead.clienteId && (
                    <Link
                      href={`/dashboard/clientes/${lead.clienteId}`}
                      className="text-[10px] text-keu-red hover:underline font-semibold flex items-center gap-1"
                    >
                      perfil <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
