"use client";

import { useState } from "react";
import Link from "next/link";
import { Snowflake, Phone, ArrowRight, Loader2, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/lib/hooks/use-api";
import { useCurrentUser, isAdmin } from "@/lib/auth/user-context";

interface ColdLead {
  _id: string;
  clienteId?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  motoModelo: string;
  motoMarca?: string;
  motoId: string;
  tipo: string;
  mensagem?: string;
  createdAt: string;
}

const tipoLabel: Record<string, string> = {
  enviou_lead: "Lead",
  solicitou_aluguel: "Aluguel",
  solicitou_compra: "Compra",
  simulou_financiamento: "Simulação",
  favoritou: "Favorito",
};

function diasAtras(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/**
 * Widget de leads esfriados — Interesses quentes não atendidos há ≥3 dias.
 * Botão "Atender" puxa o lead pro vendedor logado.
 */
export function ColdLeadsWidget({ limit = 6 }: { limit?: number }) {
  const me = useCurrentUser();
  const userIsAdmin = isAdmin(me);
  const [snapshotNow] = useState(() => 0);
  const [showInfo, setShowInfo] = useState(false);
  const { data, loading, refetch } = useApi<{ interesses: ColdLead[] }>(
    `/api/interesses/cold-leads?limit=${limit}`
  );

  const list = data?.interesses ?? [];
  void snapshotNow;

  async function atender(id: string) {
    try {
      const res = await fetch(`/api/interesses/${id}/atender`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || "Lead já foi atendido");
        return;
      }
      toast.success("Você é o responsável agora — entre em contato!");
      refetch();
    } catch {
      toast.error("Erro de rede");
    }
  }

  return (
    <Card>
      <div className="p-5 border-b border-keu-black/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-500" /> Leads esfriados
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
              Interesses sem atendente há mais de 3 dias — puxe pra você
            </p>
          </div>
          <Badge variant={userIsAdmin ? "warning" : "info"} className="text-[9px] flex-shrink-0">
            {userIsAdmin ? "Toda equipe" : "Livres pra você"}
          </Badge>
        </div>
        {showInfo && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
            <strong>Como entram aqui:</strong> Interesses identificados (com
            nome/telefone) marcados como{" "}
            <em>enviou lead / solicitou aluguel / solicitou compra / simulou
            financiamento / favoritou</em>, criados há mais de 3 dias e que
            ninguém atendeu ainda.
            <br />
            <strong>O que aparece pra você:</strong>{" "}
            {userIsAdmin
              ? "TODOS os leads esfriados da equipe (admin)."
              : "leads LIVRES — ainda sem vendedor responsável. Clica em ‘Atender’ pra puxar pra você."}
          </div>
        )}
      </div>
      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-keu-red mx-auto" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Check className="h-7 w-7" />}
          variant="success"
          title="Nada esfriado por aqui"
          description="Todos os leads quentes estão sendo atendidos."
        />
      ) : (
        <div className="divide-y divide-keu-black/5">
          {list.map((lead) => {
            const dias = diasAtras(lead.createdAt);
            const nome = lead.clienteNome || "Visitante";
            return (
              <div
                key={lead._id}
                className="p-3 px-5 flex items-center gap-3 hover:bg-keu-gray-light transition"
              >
                <div className="bg-blue-500/10 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  {dias}d
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate flex items-center gap-2">
                    {nome}
                    <Badge variant="info" className="text-[9px]">
                      {tipoLabel[lead.tipo] ?? lead.tipo}
                    </Badge>
                  </div>
                  <div className="text-xs text-keu-black/60 truncate">
                    <Link
                      href={`/motos/${lead.motoId}`}
                      className="hover:text-keu-red"
                    >
                      {lead.motoMarca ? `${lead.motoMarca} ` : ""}
                      {lead.motoModelo}
                    </Link>
                    {lead.clienteTelefone && (
                      <span className="text-keu-black/40">
                        {" "}
                        · {lead.clienteTelefone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {lead.clienteTelefone && (
                    <a
                      href={`https://wa.me/55${lead.clienteTelefone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener"
                      onClick={() => atender(lead._id)}
                      className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 px-2 py-1 rounded-full font-bold transition"
                    >
                      <Phone className="h-2.5 w-2.5" /> Falar
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => atender(lead._id)}
                    className="text-[10px] bg-keu-red text-white hover:bg-keu-red-dark px-2.5 py-1 rounded-full font-bold transition shadow-sm flex items-center gap-1"
                  >
                    Atender <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
