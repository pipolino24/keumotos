"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  motoId: string;
  motoLabel?: string;
  variant?: "icon" | "full";
}

/**
 * Botão pra cliente favoritar uma moto. Cria Interesse "favoritou" no POST,
 * remove via DELETE no segundo clique. Inicia checando se já existe.
 *
 * Anônimo: silenciosamente faz nada (e exibe toast pedindo login).
 */
export function FavoriteButton({ motoId, motoLabel, variant = "full" }: Props) {
  const [favorited, setFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/interesses?motoId=${motoId}&tipo=favoritou&limit=1`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : { interesses: [] }))
      .then((json) => {
        if (cancelled) return;
        const list = json.interesses ?? [];
        if (list.length > 0) {
          setFavorited(true);
          setFavoriteId(list[0]._id);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [motoId]);

  async function toggle() {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!favorited) {
        const res = await fetch("/api/interesses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            motoId,
            tipo: "favoritou",
            origem: "site",
          }),
        });
        if (res.status === 401) {
          toast.info("Faça login pra salvar nos favoritos");
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Erro");
        }
        const json = await res.json();
        setFavorited(true);
        setFavoriteId(json.interesse?.id ?? null);
        toast.success(motoLabel ? `${motoLabel} salva nos favoritos` : "Favoritado!");
      } else if (favoriteId) {
        const res = await fetch(`/api/interesses/${favoriteId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Erro ao desfavoritar");
        setFavorited(false);
        setFavoriteId(null);
        toast.success("Removido dos favoritos");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={loading || submitting}
        aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
          "bg-white/95 backdrop-blur shadow-lg hover:scale-110",
          "disabled:opacity-50"
        )}
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-all",
            favorited ? "fill-keu-red text-keu-red" : "text-keu-black/40"
          )}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || submitting}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg",
        "text-sm font-bold transition-all border-2",
        favorited
          ? "border-keu-red bg-keu-red/5 text-keu-red hover:bg-keu-red/10"
          : "border-keu-black/10 text-keu-black/70 hover:border-keu-red/40 hover:text-keu-red",
        "disabled:opacity-50"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all",
          favorited && "fill-keu-red"
        )}
      />
      {favorited ? "Favoritado" : "Favoritar"}
    </button>
  );
}
