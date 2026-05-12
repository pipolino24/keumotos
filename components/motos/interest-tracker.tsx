"use client";

import { useEffect } from "react";

interface Props {
  motoId: string;
}

/**
 * Registra silenciosamente uma visualização da página de detalhe da moto.
 * Se o usuário estiver logado como cliente, o backend infere `clienteId`
 * via cookie de sessão e a visualização vira lead "morno" pro vendedor.
 *
 * Deduplica via sessionStorage pra não criar 10 interesses se o cliente
 * abre e fecha a mesma página.
 */
export function InterestTracker({ motoId }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `keu_view_${motoId}`;
    if (sessionStorage.getItem(key)) return;

    // Pequeno delay pra evitar contar bounces (<2s)
    const timer = setTimeout(() => {
      const ac = new AbortController();
      fetch("/api/interesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motoId, tipo: "visualizou" }),
        signal: ac.signal,
      })
        .then(() => {
          try {
            sessionStorage.setItem(key, "1");
          } catch {
            // sessionStorage pode estar bloqueada (modo privado em iOS, por ex.)
          }
        })
        .catch(() => {
          // silent: tracking não pode quebrar a UX
        });
      return () => ac.abort();
    }, 2000);

    return () => clearTimeout(timer);
  }, [motoId]);

  return null;
}
