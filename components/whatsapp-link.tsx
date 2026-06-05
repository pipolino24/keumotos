"use client";

import type { ReactNode } from "react";
import {
  KEU_UNIDADES,
  whatsappLink,
  unidadePorTipo,
  type KeuUnidade,
  type KeuUnidadeKey,
} from "@/lib/keu-units";

interface WhatsAppLinkProps {
  /** Unidade explícita; ignora `tipo` se passada */
  unidade?: KeuUnidadeKey | KeuUnidade;
  /** Roteia pra unidade certa baseado no tipo da moto/intenção */
  tipo?: "venda" | "aluguel" | "ambos" | "pecas" | "manutencao" | null;
  /** Mensagem pré-preenchida no chat. Não passe encoded — encodamos aqui. */
  texto?: string;
  /** Classes Tailwind extras */
  className?: string;
  /** Aria-label pro botão (acessibilidade) */
  ariaLabel?: string;
  children: ReactNode;
}

/**
 * Botão / link pra abrir WhatsApp da unidade KEU correta.
 *
 * Antes cada lugar do app tinha `https://wa.me/5588998505859?text=...`
 * hardcoded, levando leads de locação e peças pra Multimarcas.
 *
 * Uso:
 *   <WhatsAppLink tipo="aluguel" texto="Tenho interesse na Yamaha FZ25">
 *     Falar no WhatsApp
 *   </WhatsAppLink>
 */
export function WhatsAppLink({
  unidade,
  tipo,
  texto,
  className,
  ariaLabel,
  children,
}: WhatsAppLinkProps) {
  const u = unidade
    ? typeof unidade === "string"
      ? KEU_UNIDADES[unidade]
      : unidade
    : unidadePorTipo(tipo);
  const href = whatsappLink(u, texto);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel ?? `Abrir WhatsApp da ${u.nome}`}
    >
      {children}
    </a>
  );
}
