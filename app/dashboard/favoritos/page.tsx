"use client";

import Link from "next/link";
import { Heart, Bike, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonMotoCard } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useApi } from "@/lib/hooks/use-api";

interface FavoritoItem {
  _id: string;
  motoId: string;
  motoMarca?: string;
  motoModelo: string;
  motoValor?: number;
  createdAt: string;
}

export default function FavoritosPage() {
  const { data, loading, refetch } = useApi<{ interesses: FavoritoItem[] }>(
    "/api/interesses?tipo=favoritou&limit=100"
  );

  const favoritos = data?.interesses ?? [];

  async function unfavorite(id: string) {
    await fetch(`/api/interesses/${id}`, { method: "DELETE" });
    refetch();
  }

  return (
    <div>
      <PageHeader
        title="Meus favoritos"
        description="Motos que você marcou como favoritas — clique pra ver de novo ou abrir conversa com o vendedor"
      >
        <Link href="/motos">
          <Button variant="outline">
            Ver catálogo <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </PageHeader>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonMotoCard />
          <SkeletonMotoCard />
          <SkeletonMotoCard />
        </div>
      ) : favoritos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Heart className="h-7 w-7" />}
            title="Nenhuma moto favoritada ainda"
            description="Quando você curtir uma moto no catálogo, ela aparece aqui pra fácil acesso."
            action={
              <Link href="/motos">
                <Button>
                  <Bike className="h-4 w-4" /> Explorar catálogo
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {favoritos.map((fav) => (
            <Card
              key={fav._id}
              className="overflow-hidden card-hover relative group"
            >
              <Link href={`/motos/${fav.motoId}`} className="block">
                <div className="aspect-[4/3] bg-gradient-to-br from-keu-gray-light to-keu-red/10 relative overflow-hidden flex items-center justify-center">
                  <Bike className="h-20 w-20 text-keu-red/15 group-hover:scale-110 transition-transform" />
                  <div className="absolute top-3 left-3">
                    <Badge variant="danger" className="shadow-lg">
                      <Heart className="h-3 w-3 fill-current" /> Favorito
                    </Badge>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs font-semibold text-keu-red mb-0.5">
                    {fav.motoMarca}
                  </div>
                  <h3 className="font-bold text-base mb-2 truncate">
                    {fav.motoModelo}
                  </h3>
                  {fav.motoValor && (
                    <div className="text-xl font-black text-keu-red">
                      {formatCurrency(fav.motoValor)}
                    </div>
                  )}
                </div>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  unfavorite(fav._id);
                }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur shadow-lg flex items-center justify-center hover:bg-keu-red hover:text-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Remover dos favoritos"
              >
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
