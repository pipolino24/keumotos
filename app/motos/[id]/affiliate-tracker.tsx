"use client";

import { useEffect } from "react";

interface Props {
  motoId: string;
}

export function AffiliateTracker({ motoId }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const codigo =
      params.get("ref") ??
      params.get("afiliado") ??
      params.get("utm_source") ??
      null;
    if (!codigo) return;

    const tracked = sessionStorage.getItem(`keu_ref_${codigo}_${motoId}`);
    if (tracked) return;

    fetch("/api/afiliados/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, motoId }),
    })
      .then(() => {
        sessionStorage.setItem(`keu_ref_${codigo}_${motoId}`, "1");
      })
      .catch(() => {
        // silent
      });
  }, [motoId]);

  return null;
}
