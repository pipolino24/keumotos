"use client";

import Link from "next/link";
import { use } from "react";
import {
  Bike,
  Phone,
  Ban,
  Loader2,
  ArrowRight,
  Star,
  ShieldCheck,
  MessageCircle,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeuLogo } from "@/components/keu-logo";
import { useApi } from "@/lib/hooks/use-api";
import { formatCurrency, formatKm } from "@/lib/utils";

interface Afiliado {
  _id: string;
  codigo: string;
  nome: string;
  email: string;
  telefone: string;
  avatar?: string;
  bio?: string;
  whatsapp?: string;
  instagram?: string;
  cidade?: string;
  estado?: string;
  status: "ativo" | "pausado" | "bloqueado";
  aprovado: boolean;
}

interface Moto {
  _id: string;
  marca: string;
  modelo: string;
  versao?: string;
  anoModelo: number;
  cor: string;
  km: number;
  valorAnunciado: number;
  fotos: string[];
}

export default function AfiliadoPublicPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = use(params);

  const { data: afData, loading: afLoading, error: afError } = useApi<{
    afiliados: Afiliado[];
  }>(`/api/afiliados?q=${encodeURIComponent(codigo)}`);

  const afiliado = afData?.afiliados?.find(
    (a) => a.codigo.toLowerCase() === codigo.toLowerCase()
  );

  const { data: motosData, loading: motosLoading } = useApi<{ motos: Moto[] }>(
    afiliado && afiliado.status === "ativo" && afiliado.aprovado
      ? `/api/motos?status=disponivel`
      : null
  );

  const motos = motosData?.motos ?? [];

  // Loading inicial
  if (afLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-keu-black text-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-keu-red mx-auto mb-3" />
          <div className="text-sm text-white/60">Carregando...</div>
        </div>
      </div>
    );
  }

  // Não encontrado
  if (afError || !afiliado) {
    return (
      <InactivePage
        title="Afiliado não encontrado"
        message="Este link não existe ou foi removido. Verifique se o endereço está correto."
      />
    );
  }

  // Inativo / não aprovado
  if (afiliado.status !== "ativo" || !afiliado.aprovado) {
    return (
      <InactivePage
        title="Afiliado indisponível"
        message="Esse afiliado não está ativo no momento. Você pode acessar o catálogo principal da KEU Multimarcas."
      />
    );
  }

  const whatsappNumero = (afiliado.whatsapp || afiliado.telefone || "").replace(
    /\D/g,
    ""
  );
  const whatsappE164 = whatsappNumero.startsWith("55")
    ? whatsappNumero
    : `55${whatsappNumero}`;

  function whatsappLink(moto?: Moto) {
    const intro = `Olá ${afiliado!.nome}! Vi sua indicação na KEU`;
    const msg = moto
      ? `${intro} e tenho interesse na ${moto.marca} ${moto.modelo} ${moto.anoModelo} (${formatCurrency(moto.valorAnunciado)}). Pode me passar mais detalhes?`
      : `${intro} e quero conhecer as motos disponíveis. Pode me ajudar?`;
    return `https://wa.me/${whatsappE164}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="min-h-screen flex flex-col bg-keu-gray-light">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-keu-black/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-3">
            <KeuLogo size="sm" showSubtitle={false} />
            <div className="hidden sm:block text-xs">
              <div className="text-keu-black/40 uppercase tracking-wider font-bold">
                Indicado por
              </div>
              <div className="font-bold text-keu-black">{afiliado.nome}</div>
            </div>
          </Link>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener"
          >
            <Button size="sm">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </a>
        </div>
      </header>

      {/* HERO AFILIADO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-keu-gray-light to-white text-white">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: "var(--keu-red)" }}
        />
        <div className="relative container mx-auto px-4 py-16 md:py-20 max-w-5xl">
          <Card className="p-6 md:p-10 bg-white/5 backdrop-blur border-white/10 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
              <div className="relative flex-shrink-0">
                {afiliado.avatar ? (
                  // Avatar do afiliado — pode ser base64 ou URL. Eager (hero).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={afiliado.avatar}
                    alt={afiliado.nome}
                    decoding="async"
                    className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover ring-4 ring-keu-red shadow-2xl"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-keu-red to-keu-red-dark flex items-center justify-center text-5xl md:text-6xl font-black ring-4 ring-keu-red shadow-2xl">
                    {afiliado.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-2 shadow-lg">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant="default" className="mb-3">
                  <Star className="h-3 w-3 fill-white" /> Indicação oficial KEU
                </Badge>
                <h1 className="text-3xl md:text-4xl font-black mb-2 leading-tight">
                  Olá, sou o {afiliado.nome.split(" ")[0]}
                </h1>
                <p className="text-white/80 text-base md:text-lg mb-4">
                  Faço parte da família KEU Empreendimentos e selecionei as
                  melhores motos pra você. Confira o catálogo abaixo!
                </p>
                {afiliado.bio && (
                  <p className="text-white/60 text-sm mb-4 italic">
                    &ldquo;{afiliado.bio}&rdquo;
                  </p>
                )}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm">
                  {afiliado.cidade && (
                    <span className="flex items-center gap-1.5 text-white/70">
                      <MapPin className="h-3.5 w-3.5" />
                      {afiliado.cidade}
                      {afiliado.estado && `, ${afiliado.estado}`}
                    </span>
                  )}
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1.5 text-keu-red font-semibold hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" /> Falar comigo
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* LISTAGEM MOTOS */}
      <section className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <Badge variant="default">Catálogo</Badge>
              <h2 className="text-3xl md:text-4xl font-black mt-3">
                Motos <span className="text-keu-red">disponíveis</span>
              </h2>
              <p className="text-keu-black/60 mt-1">
                {motosLoading
                  ? "Carregando..."
                  : `${motos.length} ${motos.length === 1 ? "moto pronta" : "motos prontas"} pra te atender`}
              </p>
            </div>
          </div>

          {motosLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-keu-red mx-auto mb-3" />
              <div className="text-sm text-keu-black/60">
                Carregando motos...
              </div>
            </div>
          ) : motos.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="bg-keu-red/10 text-keu-red w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bike className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-lg mb-1">
                Nenhuma moto disponível no momento
              </h3>
              <p className="text-sm text-keu-black/60 mb-6 max-w-md mx-auto">
                Em breve teremos novidades! Fale com {afiliado.nome.split(" ")[0]}{" "}
                pelo WhatsApp pra avisar quando chegar a moto que você procura.
              </p>
              <a href={whatsappLink()} target="_blank" rel="noopener">
                <Button>
                  <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                </Button>
              </a>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {motos.map((moto) => (
                <Card
                  key={moto._id}
                  className="overflow-hidden group hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <div className="aspect-video bg-gradient-to-br from-keu-gray-light via-white to-keu-red/10 relative overflow-hidden">
                    {moto.fotos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={moto.fotos[0]}
                        alt={`${moto.marca} ${moto.modelo}`}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/30">
                        <Bike className="h-16 w-16" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-xs font-bold">
                      {moto.anoModelo}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-semibold text-keu-red mb-1">
                      {moto.marca}
                    </div>
                    <h3 className="font-bold text-lg mb-3 truncate">
                      {moto.modelo}
                      {moto.versao && (
                        <span className="text-keu-black/60 font-medium">
                          {" "}
                          {moto.versao}
                        </span>
                      )}
                    </h3>
                    <div className="flex gap-3 text-xs text-keu-black/60 mb-4">
                      <span>{formatKm(moto.km)}</span>
                      <span>•</span>
                      <span>{moto.cor}</span>
                    </div>
                    <div className="border-t border-keu-black/5 pt-4">
                      <div className="text-xs text-keu-black/60">A partir de</div>
                      <div className="text-2xl font-black text-keu-red mb-3">
                        {formatCurrency(moto.valorAnunciado)}
                      </div>
                      <a
                        href={whatsappLink(moto)}
                        target="_blank"
                        rel="noopener"
                        className="block"
                      >
                        <Button className="w-full">
                          Tenho interesse <ArrowRight className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-br from-keu-gray to-keu-black text-white py-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <KeuLogo size="sm" showSubtitle={false} />
              <span className="text-xs text-white/40">
                © 2026 KEU Empreendimentos
              </span>
            </div>
            <Link
              href="/"
              className="text-sm text-white/70 hover:text-keu-red transition inline-flex items-center gap-1"
            >
              Ir para o catálogo principal <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InactivePage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-keu-gray-light">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-keu-black/5">
        <div className="container mx-auto px-4 h-16 flex items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <KeuLogo size="sm" showSubtitle={false} />
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="p-10 md:p-12 max-w-lg w-full text-center">
          <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
            <Ban className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black mb-2">{title}</h1>
          <p className="text-keu-black/60 mb-8">{message}</p>
          <Link href="/">
            <Button size="lg">
              Ver catálogo KEU <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </main>
      <footer className="bg-gradient-to-br from-keu-gray to-keu-black text-white py-6 text-center text-xs text-white/40">
        © 2026 KEU Empreendimentos
      </footer>
    </div>
  );
}
