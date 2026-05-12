import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Bike,
  ArrowLeft,
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  ShieldCheck,
  Award,
} from "lucide-react";
import { Instagram } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeuLogo } from "@/components/keu-logo";
import { formatCurrency, formatKm } from "@/lib/utils";
import { MotoDetailActions } from "./moto-detail-actions";
import { MotoPhotoGallery } from "./moto-photo-gallery";
import { AffiliateTracker } from "./affiliate-tracker";
import { InterestTracker } from "@/components/motos/interest-tracker";

export const dynamic = "force-dynamic";

interface Moto {
  _id: string;
  marca: string;
  modelo: string;
  versao?: string;
  anoFabricacao: number;
  anoModelo: number;
  cor: string;
  km: number;
  cilindrada: number;
  combustivel: string;
  cambio: string;
  partida?: string;
  potencia?: string;
  valorAnunciado: number;
  valorDiaria?: number;
  valorSemanal?: number;
  valorMensal?: number;
  caucao?: number;
  tipo: "venda" | "aluguel" | "ambos";
  status: string;
  destaque?: boolean;
  fotos: string[];
  descricao?: string;
}

async function fetchMoto(id: string): Promise<Moto | null> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/motos/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.moto as Moto) ?? null;
  } catch {
    return null;
  }
}

async function fetchSimilares(moto: Moto): Promise<Moto[]> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/motos?status=disponivel`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const all = ((data.motos as Moto[]) ?? []).filter(
      (m) => m._id !== moto._id
    );
    const sameMarca = all.filter((m) => m.marca === moto.marca);
    const byPrice = all
      .filter((m) => m.marca !== moto.marca)
      .sort(
        (a, b) =>
          Math.abs(a.valorAnunciado - moto.valorAnunciado) -
          Math.abs(b.valorAnunciado - moto.valorAnunciado)
      );
    return [...sameMarca, ...byPrice].slice(0, 4);
  } catch {
    return [];
  }
}

function combustivelLabel(c: string) {
  return c === "gasolina"
    ? "Gasolina"
    : c === "flex"
      ? "Flex"
      : c === "eletrica"
        ? "Elétrica"
        : c;
}

function cambioLabel(c: string) {
  return c === "manual"
    ? "Manual"
    : c === "automatico"
      ? "Automático"
      : c === "semi-automatico"
        ? "Semi-automático"
        : c === "cvt"
          ? "CVT"
          : c;
}

export default async function MotoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const moto = await fetchMoto(id);
  if (!moto) {
    notFound();
  }
  const similares = await fetchSimilares(moto);

  const isAluguel = moto.tipo === "aluguel";
  const isAmbos = moto.tipo === "ambos";
  const tituloModelo = `${moto.marca} ${moto.modelo}${moto.versao ? ` ${moto.versao}` : ""}`;
  const whatsappTexto = `Tenho interesse na ${tituloModelo} ${moto.anoModelo}`;
  const whatsappUrl = `https://wa.me/5588998505859?text=${encodeURIComponent(whatsappTexto)}`;

  return (
    <div className="min-h-screen flex flex-col bg-keu-gray-light">
      <AffiliateTracker motoId={moto._id} />
      <InterestTracker motoId={moto._id} />

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-keu-black/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <KeuLogo size="sm" showSubtitle={false} />
          </Link>
          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium hover:text-keu-red transition"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar pra home
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
            <a
              href="https://wa.me/5588998505859?text=Quero%20vender%20minha%20moto"
              target="_blank"
              rel="noopener"
            >
              <Button size="sm" className="hidden sm:inline-flex">
                Vender minha moto
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="bg-white border-b border-keu-black/5">
        <div className="container mx-auto px-4 max-w-7xl py-3 text-sm text-keu-black/60 flex items-center gap-2">
          <Link href="/motos" className="hover:text-keu-red">
            Motos
          </Link>
          <span>/</span>
          <span className="font-semibold text-keu-black truncate">
            {tituloModelo}
          </span>
        </div>
      </div>

      {/* MAIN */}
      <section className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8">
            {/* GALLERY */}
            <MotoPhotoGallery
              fotos={moto.fotos ?? []}
              alt={tituloModelo}
              destaque={moto.destaque}
              tipo={moto.tipo}
              ano={moto.anoModelo}
            />

            {/* INFO */}
            <div className="space-y-6">
              <div>
                <div className="text-sm font-semibold text-keu-red mb-1">
                  {moto.marca}
                </div>
                <h1 className="text-3xl md:text-4xl font-black leading-tight">
                  {moto.modelo}
                  {moto.versao && (
                    <span className="text-keu-black/60 font-medium text-2xl md:text-3xl">
                      {" "}
                      {moto.versao}
                    </span>
                  )}
                </h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">Ano {moto.anoModelo}</Badge>
                  <Badge variant="outline">{formatKm(moto.km)}</Badge>
                  <Badge variant="outline">{moto.cor}</Badge>
                </div>
              </div>

              {/* PRICE */}
              <Card className="p-5 bg-gradient-to-br from-keu-red/5 to-keu-red/0 border-keu-red/20">
                {isAluguel || isAmbos ? (
                  <div className="space-y-2">
                    {moto.valorDiaria && (
                      <PriceRow label="Diária" value={moto.valorDiaria} />
                    )}
                    {moto.valorSemanal && (
                      <PriceRow label="Semanal" value={moto.valorSemanal} />
                    )}
                    {moto.valorMensal && (
                      <PriceRow label="Mensal" value={moto.valorMensal} />
                    )}
                    {moto.caucao && (
                      <PriceRow label="Caução" value={moto.caucao} muted />
                    )}
                    {isAmbos && (
                      <div className="pt-3 mt-3 border-t border-keu-red/10">
                        <div className="text-xs text-keu-black/60">
                          Valor de venda
                        </div>
                        <div className="text-3xl font-black text-keu-red">
                          {formatCurrency(moto.valorAnunciado)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-keu-black/60">
                      Valor anunciado
                    </div>
                    <div className="text-4xl md:text-5xl font-black text-keu-red leading-tight">
                      {formatCurrency(moto.valorAnunciado)}
                    </div>
                    <div className="text-xs text-keu-black/60 mt-1">
                      Aceita troca e financiamento
                    </div>
                  </>
                )}
              </Card>

              {/* ACTIONS */}
              <MotoDetailActions
                whatsappUrl={whatsappUrl}
                motoInteresse={`${tituloModelo} ${moto.anoModelo}`}
                shareTitle={tituloModelo}
                valorMoto={moto.valorAnunciado}
                motoId={moto._id}
              />

              {/* SPECS */}
              <Card className="p-5">
                <h3 className="font-bold text-base mb-4">Especificações</h3>
                <div className="grid grid-cols-2 gap-4">
                  <SpecItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="Ano fabricação"
                    value={String(moto.anoFabricacao)}
                  />
                  <SpecItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="Ano modelo"
                    value={String(moto.anoModelo)}
                  />
                  <SpecItem
                    icon={<Gauge className="h-4 w-4" />}
                    label="Quilometragem"
                    value={formatKm(moto.km)}
                  />
                  <SpecItem
                    icon={<Settings2 className="h-4 w-4" />}
                    label="Cilindrada"
                    value={`${moto.cilindrada}cc`}
                  />
                  <SpecItem
                    icon={<Fuel className="h-4 w-4" />}
                    label="Combustível"
                    value={combustivelLabel(moto.combustivel)}
                  />
                  <SpecItem
                    icon={<Settings2 className="h-4 w-4" />}
                    label="Câmbio"
                    value={cambioLabel(moto.cambio)}
                  />
                  <SpecItem
                    icon={<Bike className="h-4 w-4" />}
                    label="Cor"
                    value={moto.cor}
                  />
                  {moto.potencia && (
                    <SpecItem
                      icon={<Gauge className="h-4 w-4" />}
                      label="Potência"
                      value={moto.potencia}
                    />
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          {moto.descricao && (
            <Card className="p-6 md:p-8 mt-10">
              <h2 className="text-2xl font-black mb-3">Descrição</h2>
              <p className="text-keu-black/80 whitespace-pre-line leading-relaxed">
                {moto.descricao}
              </p>
            </Card>
          )}

          {/* SOBRE A KEU */}
          <Card className="p-6 md:p-8 mt-10 bg-gradient-to-br from-keu-gray to-keu-black text-white border-keu-black/20">
            <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <Badge variant="default">Sobre nós</Badge>
                <h2 className="text-2xl md:text-3xl font-black mt-3 mb-3">
                  KEU Multimarcas
                </h2>
                <p className="text-white/70 leading-relaxed mb-4">
                  Mais de uma década rodando junto com o Cariri. Compra, venda
                  e troca de motos seminovas e zero km com avaliação FIPE,
                  documentação em dia e o melhor atendimento da região.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-white/80">
                    <ShieldCheck className="h-4 w-4 text-keu-red" /> FIPE garantida
                  </span>
                  <span className="flex items-center gap-1.5 text-white/80">
                    <Award className="h-4 w-4 text-keu-red" /> 500+ motos vendidas
                  </span>
                  <span className="flex items-center gap-1.5 text-white/80">
                    <MapPin className="h-4 w-4 text-keu-red" /> Juazeiro do Norte
                  </span>
                </div>
              </div>
              <div className="hidden md:block">
                <KeuLogo size="lg" />
              </div>
            </div>
          </Card>

          {/* SIMILARES */}
          {similares.length > 0 && (
            <section className="mt-12">
              <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
                <h2 className="text-2xl md:text-3xl font-black">
                  Motos <span className="text-keu-red">similares</span>
                </h2>
                <Link href="/motos">
                  <Button variant="outline" size="sm">
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {similares.map((m) => (
                  <SimilarCard key={m._id} moto={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-br from-keu-gray to-keu-black text-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <KeuLogo size="md" />
              <p className="text-sm text-white/60 mt-4">
                Compra, venda, troca, aluguel e peças. Tudo num só lugar.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Unidades</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>KEU Moto Peças</li>
                <li>KEU Loca Motos</li>
                <li>KEU Multimarcas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Sistema</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="hover:text-keu-red">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-keu-red">
                    Cadastro
                  </Link>
                </li>
                <li>
                  <Link href="/motos" className="hover:text-keu-red">
                    Motos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> (88) 99850-5859
                </li>
                <li className="flex items-center gap-1.5">
                  <Instagram className="h-3.5 w-3.5" /> @keumultimarcass
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Juazeiro do Norte - CE
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Seg a Sáb 8h-18h
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-wrap justify-between items-center gap-4 text-sm text-white/40">
            <span>© 2026 KEU Empreendimentos. Todos os direitos reservados.</span>
            <span>Feito com paixão pelas duas rodas</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PriceRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-keu-black/60">{label}</span>
      <span
        className={
          muted ? "font-bold text-keu-black/70" : "font-black text-keu-red text-xl"
        }
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="bg-keu-red/10 text-keu-red w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-keu-black/60">{label}</div>
        <div className="font-bold text-sm truncate">{value}</div>
      </div>
    </div>
  );
}

function SimilarCard({ moto }: { moto: Moto }) {
  return (
    <Link href={`/motos/${moto._id}`} className="group block">
      <Card className="overflow-hidden h-full hover:shadow-xl transition-all hover:-translate-y-1">
        <div className="aspect-video bg-gradient-to-br from-keu-black to-keu-gray relative overflow-hidden">
          {moto.fotos?.[0] ? (
            <Image
              src={moto.fotos[0]}
              alt={`${moto.marca} ${moto.modelo}`}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/30">
              <Bike className="h-12 w-12" />
            </div>
          )}
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-md px-2 py-0.5 text-xs font-bold">
            {moto.anoModelo}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs font-semibold text-keu-red mb-0.5">
            {moto.marca}
          </div>
          <h3 className="font-bold text-sm mb-2 truncate">{moto.modelo}</h3>
          <div className="text-lg font-black text-keu-red">
            {formatCurrency(moto.valorAnunciado)}
          </div>
        </div>
      </Card>
    </Link>
  );
}
