import Link from "next/link";
import Image from "next/image";
import {
  Bike,
  ArrowRight,
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  Search,
} from "lucide-react";
import { Instagram } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { KeuLogo } from "@/components/keu-logo";
import { formatCurrency, formatKm } from "@/lib/utils";
import { connectMongo } from "@/lib/mongodb";
import { Moto as MotoModel } from "@/lib/models/moto";

export const revalidate = 60; // cache de 1 min — alivia carga no Mongo

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
  valorAnunciado: number;
  valorDiaria?: number;
  valorMensal?: number;
  tipo: "venda" | "aluguel" | "ambos";
  status: string;
  destaque?: boolean;
  fotos: string[];
  descricao?: string;
}

interface SearchParams {
  q?: string;
  tipo?: string;
  marca?: string;
  precoMin?: string;
  precoMax?: string;
  anoMin?: string;
  anoMax?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 12;

/**
 * Lê motos direto do Mongo (sem HTTP intermediário pra própria API)
 * e projeta apenas a primeira foto pra reduzir o payload — fotos base64
 * podem ter 200KB+ cada e antes o servidor mandava o array inteiro.
 */
async function getMotos(): Promise<Moto[]> {
  try {
    await connectMongo();
    const docs = await MotoModel.find(
      { status: "disponivel" },
      {
        marca: 1,
        modelo: 1,
        versao: 1,
        anoFabricacao: 1,
        anoModelo: 1,
        cor: 1,
        km: 1,
        cilindrada: 1,
        combustivel: 1,
        cambio: 1,
        valorAnunciado: 1,
        valorDiaria: 1,
        valorMensal: 1,
        tipo: 1,
        status: 1,
        destaque: 1,
        descricao: 1,
        fotos: { $slice: 1 }, // só a capa
      }
    )
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((d) => ({
      ...d,
      _id: String(d._id),
    })) as unknown as Moto[];
  } catch {
    return [];
  }
}

function applyFilters(motos: Moto[], sp: SearchParams): Moto[] {
  let result = motos;
  if (sp.q) {
    const q = sp.q.toLowerCase();
    result = result.filter(
      (m) =>
        m.marca.toLowerCase().includes(q) ||
        m.modelo.toLowerCase().includes(q) ||
        (m.versao ?? "").toLowerCase().includes(q)
    );
  }
  if (sp.tipo && sp.tipo !== "todos") {
    if (sp.tipo === "venda") {
      result = result.filter((m) => m.tipo === "venda" || m.tipo === "ambos");
    } else if (sp.tipo === "aluguel") {
      result = result.filter((m) => m.tipo === "aluguel" || m.tipo === "ambos");
    }
  }
  if (sp.marca) {
    result = result.filter(
      (m) => m.marca.toLowerCase() === sp.marca!.toLowerCase()
    );
  }
  if (sp.precoMin) {
    const v = parseFloat(sp.precoMin);
    if (!isNaN(v)) result = result.filter((m) => m.valorAnunciado >= v);
  }
  if (sp.precoMax) {
    const v = parseFloat(sp.precoMax);
    if (!isNaN(v)) result = result.filter((m) => m.valorAnunciado <= v);
  }
  if (sp.anoMin) {
    const v = parseInt(sp.anoMin, 10);
    if (!isNaN(v)) result = result.filter((m) => m.anoModelo >= v);
  }
  if (sp.anoMax) {
    const v = parseInt(sp.anoMax, 10);
    if (!isNaN(v)) result = result.filter((m) => m.anoModelo <= v);
  }
  // Ordenação (default: mais recentes via createdAt já vem do query, então
  // não altera). Outras opções deslocam-na.
  switch (sp.sort) {
    case "preco-asc":
      result = [...result].sort((a, b) => a.valorAnunciado - b.valorAnunciado);
      break;
    case "preco-desc":
      result = [...result].sort((a, b) => b.valorAnunciado - a.valorAnunciado);
      break;
    case "ano-desc":
      result = [...result].sort((a, b) => b.anoModelo - a.anoModelo);
      break;
    case "km-asc":
      result = [...result].sort((a, b) => a.km - b.km);
      break;
  }
  return result;
}

function buildPageHref(sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.tipo) params.set("tipo", sp.tipo);
  if (sp.marca) params.set("marca", sp.marca);
  if (sp.precoMin) params.set("precoMin", sp.precoMin);
  if (sp.precoMax) params.set("precoMax", sp.precoMax);
  if (sp.anoMin) params.set("anoMin", sp.anoMin);
  if (sp.anoMax) params.set("anoMax", sp.anoMax);
  if (sp.sort) params.set("sort", sp.sort);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/motos${qs ? `?${qs}` : ""}`;
}

function buildSortHref(sp: SearchParams, sort: string): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.tipo) params.set("tipo", sp.tipo);
  if (sp.marca) params.set("marca", sp.marca);
  if (sp.precoMin) params.set("precoMin", sp.precoMin);
  if (sp.precoMax) params.set("precoMax", sp.precoMax);
  if (sp.anoMin) params.set("anoMin", sp.anoMin);
  if (sp.anoMax) params.set("anoMax", sp.anoMax);
  if (sort && sort !== "recente") params.set("sort", sort);
  const qs = params.toString();
  return `/motos${qs ? `?${qs}` : ""}`;
}

export default async function MotosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const allMotos = await getMotos();

  const marcas = Array.from(new Set(allMotos.map((m) => m.marca))).sort();
  const filtered = applyFilters(allMotos, sp);
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="min-h-screen flex flex-col bg-keu-gray-light">
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

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-keu-gray-light to-white text-keu-black">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ background: "var(--keu-red)" }}
        />
        <div className="relative container mx-auto px-4 py-14 md:py-20 max-w-5xl">
          <div className="text-center space-y-5">
            <Badge variant="default">Catálogo</Badge>
            <h1 className="text-4xl md:text-6xl font-black leading-[1] tracking-tight">
              Motos <span className="text-keu-red">KEU Multimarcas</span>
            </h1>
            <p className="text-keu-black/70 text-lg max-w-2xl mx-auto">
              Encontre a moto perfeita pra você. FIPE garantida, documentação em
              dia e os melhores preços do Cariri.
            </p>
            <form
              action="/motos"
              method="get"
              className="max-w-2xl mx-auto mt-4 flex items-center gap-2 bg-white rounded-xl shadow-2xl p-2"
            >
              <Search className="h-5 w-5 text-keu-black/40 ml-2 flex-shrink-0" />
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                type="text"
                placeholder="Busque por marca ou modelo (ex: Honda CG)"
                className="flex-1 bg-transparent outline-none text-keu-black text-base px-2 py-2"
              />
              <Button type="submit" size="lg">
                Buscar
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="flex-1 py-10 md:py-14">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            {/* FILTERS */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <Card className="p-5">
                <form action="/motos" method="get" className="space-y-4">
                  {sp.q && <input type="hidden" name="q" value={sp.q} />}
                  <div>
                    <h3 className="font-bold text-sm mb-3">Filtrar</h3>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-keu-black/60 uppercase tracking-wider mb-1.5 block">
                      Tipo
                    </label>
                    <Select name="tipo" defaultValue={sp.tipo ?? "todos"}>
                      <option value="todos">Todos</option>
                      <option value="venda">Venda</option>
                      <option value="aluguel">Aluguel</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-keu-black/60 uppercase tracking-wider mb-1.5 block">
                      Marca
                    </label>
                    <Select name="marca" defaultValue={sp.marca ?? ""}>
                      <option value="">Todas</option>
                      {marcas.map((marca) => (
                        <option key={marca} value={marca}>
                          {marca}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-keu-black/60 uppercase tracking-wider mb-1.5 block">
                      Faixa de preço (R$)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        name="precoMin"
                        placeholder="Mín"
                        defaultValue={sp.precoMin ?? ""}
                      />
                      <Input
                        type="number"
                        name="precoMax"
                        placeholder="Máx"
                        defaultValue={sp.precoMax ?? ""}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-keu-black/60 uppercase tracking-wider mb-1.5 block">
                      Ano modelo
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        name="anoMin"
                        placeholder="De"
                        defaultValue={sp.anoMin ?? ""}
                      />
                      <Input
                        type="number"
                        name="anoMax"
                        placeholder="Até"
                        defaultValue={sp.anoMax ?? ""}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Aplicar filtros
                  </Button>
                  <Link href="/motos" className="block">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-xs"
                    >
                      Limpar filtros
                    </Button>
                  </Link>
                </form>
              </Card>
            </aside>

            {/* GRID */}
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-2xl font-black">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "moto encontrada" : "motos encontradas"}
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-keu-black/50">Ordenar:</span>
                    {(
                      [
                        ["recente", "Recentes"],
                        ["preco-asc", "Menor preço"],
                        ["preco-desc", "Maior preço"],
                        ["ano-desc", "Mais novo"],
                        ["km-asc", "Menor KM"],
                      ] as const
                    ).map(([key, label]) => {
                      const active = (sp.sort ?? "recente") === key;
                      return (
                        <Link key={key} href={buildSortHref(sp, key)}>
                          <span
                            className={
                              active
                                ? "px-3 py-1 rounded-full bg-keu-red text-white text-xs font-bold shadow-md shadow-keu-red/20"
                                : "px-3 py-1 rounded-full bg-white text-keu-black/70 hover:bg-keu-gray-light text-xs font-medium border border-keu-black/10 transition"
                            }
                          >
                            {label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="text-sm text-keu-black/60">
                    Página {safePage} de {totalPages}
                  </div>
                </div>
              </div>

              {pageItems.length === 0 ? (
                <Card className="p-12 text-center overflow-hidden relative">
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-keu-red/5 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-keu-red/5 blur-3xl pointer-events-none" />
                  <div className="relative">
                    <div className="relative w-20 h-20 mx-auto mb-5">
                      <div className="absolute inset-0 bg-keu-red/10 rounded-full animate-pulse-soft" />
                      <div className="relative w-full h-full bg-gradient-to-br from-keu-red/20 to-keu-red/5 rounded-full flex items-center justify-center">
                        <Bike className="h-10 w-10 text-keu-red" />
                      </div>
                    </div>
                    <h3 className="font-black text-xl mb-2">
                      Nenhuma moto encontrada
                    </h3>
                    <p className="text-sm text-keu-black/60 max-w-md mx-auto mb-6">
                      Tente ajustar os filtros ou volte mais tarde — nosso estoque
                      é renovado toda semana. Você também pode falar direto com a gente:
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link href="/motos">
                        <Button>Limpar filtros</Button>
                      </Link>
                      <a
                        href="https://wa.me/5588998505859?text=Procuro%20uma%20moto%20espec%C3%ADfica"
                        target="_blank"
                        rel="noopener"
                        className="inline-flex"
                      >
                        <Button variant="outline">
                          Falar no WhatsApp
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                  {pageItems.map((moto) => (
                    <MotoCard key={moto._id} moto={moto} />
                  ))}
                </div>
              )}

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center items-center gap-2 flex-wrap">
                  {safePage > 1 && (
                    <Link href={buildPageHref(sp, safePage - 1)}>
                      <Button variant="outline" size="sm">
                        <ArrowLeft className="h-3 w-3" /> Anterior
                      </Button>
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <Link key={p} href={buildPageHref(sp, p)}>
                        <Button
                          variant={p === safePage ? "default" : "ghost"}
                          size="sm"
                          className="min-w-[40px]"
                        >
                          {p}
                        </Button>
                      </Link>
                    )
                  )}
                  {safePage < totalPages && (
                    <Link href={buildPageHref(sp, safePage + 1)}>
                      <Button variant="outline" size="sm">
                        Próxima <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA / CONTATO */}
      <section className="py-16 bg-gradient-to-br from-keu-red to-keu-red-dark text-white">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Não encontrou sua moto?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Fale com a gente pelo WhatsApp — temos mais opções chegando toda
            semana.
          </p>
          <a
            href="https://wa.me/5588998505859"
            target="_blank"
            rel="noopener"
            className="inline-block"
          >
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-keu-red"
            >
              <Phone className="h-4 w-4" /> (88) 99850-5859
            </Button>
          </a>
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

function MotoCard({ moto }: { moto: Moto }) {
  const isAluguel = moto.tipo === "aluguel";
  const isAmbos = moto.tipo === "ambos";
  // "NOVO" — moto seminova com até 1 ano de fabricação até o ano atual
  const anoCorrente = new Date().getFullYear();
  const isNova = moto.anoModelo >= anoCorrente - 1;

  return (
    <Link href={`/motos/${moto._id}`} className="group block">
      <Card className="overflow-hidden h-full card-hover border border-keu-black/5 relative">
        {/* IMAGEM */}
        <div className="aspect-[4/3] bg-gradient-to-br from-keu-gray-light via-white to-keu-red/10 relative overflow-hidden">
          {moto.fotos?.[0] ? (
            <Image
              src={moto.fotos[0]}
              alt={`${moto.marca} ${moto.modelo}`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-keu-red/15">
              <Bike className="h-20 w-20" />
            </div>
          )}
          {/* Gradient overlay sutil pra dar profundidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-keu-black/40 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {moto.destaque && (
              <span className="shine-on-hover inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-keu-red text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-lg">
                ★ Destaque
              </span>
            )}
            {isNova && !moto.destaque && (
              <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-lg">
                NOVO
              </span>
            )}
            {isAluguel && (
              <Badge variant="dark" className="shadow-lg">
                Aluguel
              </Badge>
            )}
            {isAmbos && (
              <Badge variant="info" className="shadow-lg">
                Venda · Aluguel
              </Badge>
            )}
          </div>
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur rounded-md px-2 py-1 text-xs font-bold shadow-lg">
            {moto.anoModelo}
          </div>

          {/* Marca em overlay no rodapé da imagem */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <span className="bg-white/95 backdrop-blur rounded-md px-2.5 py-1 text-xs font-bold text-keu-red shadow">
              {moto.marca}
            </span>
          </div>

          {/* Hover overlay: "Ver detalhes" */}
          <div className="absolute inset-0 bg-keu-red/0 group-hover:bg-keu-red/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="bg-white/95 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-keu-red shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              Ver detalhes →
            </span>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="p-5 flex flex-col">
          <h3 className="font-bold text-lg leading-tight mb-1 truncate">
            {moto.modelo}
            {moto.versao && (
              <span className="text-keu-black/60 font-medium">
                {" "}
                {moto.versao}
              </span>
            )}
          </h3>

          {/* Specs em chips */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-[11px] bg-keu-gray-light rounded-md px-2 py-0.5 text-keu-black/70">
              {formatKm(moto.km)}
            </span>
            <span className="text-[11px] bg-keu-gray-light rounded-md px-2 py-0.5 text-keu-black/70">
              {moto.cilindrada}cc
            </span>
            <span className="text-[11px] bg-keu-gray-light rounded-md px-2 py-0.5 text-keu-black/70">
              {moto.cor}
            </span>
          </div>

          {/* Preço + CTA */}
          <div className="border-t border-keu-black/5 pt-4 flex items-end justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-keu-black/50 font-semibold">
                {isAluguel ? "Diária" : "À vista"}
              </div>
              <div className="text-2xl font-black text-keu-red leading-tight">
                {formatCurrency(
                  isAluguel && moto.valorDiaria
                    ? moto.valorDiaria
                    : moto.valorAnunciado
                )}
                {isAluguel && (
                  <span className="text-sm font-medium text-keu-black/60">
                    /dia
                  </span>
                )}
              </div>
            </div>
            <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg text-xs font-semibold h-9 px-3 bg-gradient-to-br from-keu-red to-keu-red-dark text-white shadow-md group-hover:shadow-lg group-hover:shadow-keu-red/40 group-hover:scale-105 transition-all">
              Ver <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
