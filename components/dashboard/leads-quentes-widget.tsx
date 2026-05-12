"use client";

import Link from "next/link";
import { useState } from "react";
import { Flame, Phone, ArrowRight, Loader2, Users, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { useCurrentUser, isAdmin } from "@/lib/auth/user-context";

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
  const me = useCurrentUser();
  const userIsAdmin = isAdmin(me);
  const { data, loading } = useApi<{ leads: LeadQuente[] }>(
    `/api/leads-quentes?limit=${limit}`
  );
  const [showInfo, setShowInfo] = useState(false);

  const leads = data?.leads ?? [];

  return (
    <Card>
      <div className="p-5 border-b border-keu-black/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" /> Leads quentes
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                className="text-keu-black/30 hover:text-keu-red transition"
                aria-label="Como funciona"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </h2>
            <p className="text-xs text-keu-black/50">
              Clientes com mais engajamento — atender primeiro!
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={userIsAdmin ? "warning" : "info"} className="text-[9px]">
              {userIsAdmin ? "Toda equipe" : "Seus leads"}
            </Badge>
            <Link
              href="/dashboard/clientes"
              className="text-xs text-keu-red hover:underline font-semibold"
            >
              Clientes →
            </Link>
          </div>
        </div>
        {showInfo && (
          <div className="mt-3 p-3 rounded-lg bg-orange-50 border border-orange-200 text-[11px] text-orange-900 leading-relaxed">
            <strong>Como classificamos:</strong> agrupamos os Interesses por
            cliente nos últimos 30 dias e calculamos um score:
            <br />
            <code className="text-[10px]">
              score = (eventos quentes × 5) + total interações + nº motos
              distintas
            </code>
            <br />
            <strong>Eventos quentes:</strong> enviou lead, solicitou
            aluguel/compra, simulou financiamento, favoritou.
            <br />
            <strong>Quem você vê aqui:</strong>{" "}
            {userIsAdmin
              ? "TODOS os leads quentes da equipe (você é admin)."
              : "só os leads que você está atendendo. Leads livres aparecem em ‘Leads esfriados’ pra você puxar."}
          </div>
        )}
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
