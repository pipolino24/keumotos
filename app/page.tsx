import Link from "next/link";
import Image from "next/image";
import {
  Bike,
  Wrench,
  Key,
  ShieldCheck,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  Star,
  Award,
  Users,
  TrendingUp,
} from "lucide-react";
import { Instagram } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  KeuLogo,
  KeuMotoPecas,
  KeuLocaMotos,
  KeuMultimarcas,
} from "@/components/keu-logo";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-keu-black/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <KeuLogo size="sm" showSubtitle={false} />
            <span className="hidden sm:inline-block text-xs font-bold tracking-widest text-keu-black/60">
              EMPREENDIMENTOS
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#unidades" className="text-sm font-medium hover:text-keu-red transition">
              Unidades
            </a>
            <a href="#servicos" className="text-sm font-medium hover:text-keu-red transition">
              Serviços
            </a>
            <a href="#destaques" className="text-sm font-medium hover:text-keu-red transition">
              Motos
            </a>
            <a href="#contato" className="text-sm font-medium hover:text-keu-red transition">
              Contato
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Entrar
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
              Cadastre-se
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-keu-gray-light to-white text-keu-black">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "var(--keu-red)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: "var(--keu-red)" }}
        />

        <div className="relative container mx-auto px-4 py-20 md:py-32 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <Badge variant="default" className="text-xs">
                <Star className="h-3 w-3 fill-white" /> #1 em Juazeiro do Norte
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
                Sua moto começa
                <br />
                aqui na{" "}
                <span className="text-keu-red text-shadow-keu inline-block">KEU</span>
              </h1>
              <p className="text-lg md:text-xl text-keu-black/70 max-w-xl">
                Compra, venda, troca, aluguel e peças — tudo num só lugar
                pra realizar seu sonho sobre duas rodas.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/motos"
                  prefetch
                  className={cn(
                    buttonVariants({ size: "xl" }),
                    "shadow-2xl shadow-keu-red/40 ring-2 ring-keu-red/20 ring-offset-2 hover:ring-keu-red/40 hover:scale-[1.03] transition-all"
                  )}
                >
                  Ver Motos Disponíveis
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a href="https://wa.me/5588998505859" target="_blank" rel="noopener">
                  <Button variant="dark" size="lg">
                    <Phone className="h-4 w-4" />
                    Fale Conosco
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap gap-8 pt-6 border-t border-keu-black/10">
                <Stat number="3" label="Unidades" />
                <Stat number="500+" label="Motos vendidas" />
                <Stat number="10+" label="Anos no mercado" />
              </div>
            </div>

            <div className="relative hidden md:flex justify-center items-center">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-keu-red/15 rounded-full blur-3xl" />
                <div className="relative h-full flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logos/moto-rider-2.webp"
                    alt="KEU Motos"
                    width={500}
                    height={400}
                    priority
                    className="object-contain w-full h-full drop-shadow-2xl"
                  />
                </div>
                <div className="absolute -top-4 -right-4 bg-keu-red rounded-2xl p-4 shadow-2xl rotate-12 animate-fade-in">
                  <Award className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UNIDADES */}
      <section id="unidades" className="py-20 md:py-28 bg-keu-gray-light">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="outline">Nossas Unidades</Badge>
            <h2 className="text-4xl md:text-5xl font-black mt-4 mb-4">
              Tudo pra sua <span className="text-keu-red">moto</span>
            </h2>
            <p className="text-keu-black/60 text-lg max-w-2xl mx-auto">
              Cada unidade especializada para te atender melhor — venda,
              aluguel e peças em um só endereço.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <UnidadeCard
              brand={<KeuMotoPecas width={220} height={180} className="max-h-[180px] w-auto mx-auto object-contain" />}
              title="Peças e Borracharia"
              description="Padre Cícero. Peças originais, acessórios e borracharia completa para sua moto."
              phone="(88) 98814-3757"
              instagram="@keumotopecas"
              gradient="from-amber-500/10 to-keu-red/10"
            />
            <UnidadeCard
              brand={<KeuLocaMotos width={220} height={180} className="max-h-[180px] w-auto mx-auto object-contain" />}
              title="Aluguel de Motos"
              description="Realizando sonhos sobre duas rodas. Locação por diária, semana ou mês."
              phone="(88) 98814-3757"
              gradient="from-keu-red/10 to-keu-red-dark/10"
              featured
            />
            <UnidadeCard
              brand={<KeuMultimarcas width={220} height={180} className="max-h-[180px] w-auto mx-auto object-contain" />}
              title="Compra, Vende e Troca"
              description="Multimarcas: as melhores motos seminovas e zero km com FIPE garantida."
              phone="(88) 99850-5859"
              instagram="@keumultimarcass"
              gradient="from-keu-black/5 to-keu-red/10"
            />
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="outline">O que oferecemos</Badge>
            <h2 className="text-4xl md:text-5xl font-black mt-4 mb-4">
              Tudo que sua moto <span className="text-keu-red">precisa</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Bike className="h-6 w-6" />}
              title="Venda de Motos"
              desc="Novas, seminovas e usadas. Multimarcas com financiamento facilitado."
            />
            <FeatureCard
              icon={<Key className="h-6 w-6" />}
              title="Aluguel"
              desc="Diária, semanal e mensal. Documentação em dia, manutenção garantida."
            />
            <FeatureCard
              icon={<Wrench className="h-6 w-6" />}
              title="Peças & Acessórios"
              desc="Originais e paralelas. Borracharia completa com pneus, câmaras e mão de obra."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Compra Segura"
              desc="Avaliação justa com tabela FIPE. Compramos sua moto pelo melhor preço."
            />
          </div>
        </div>
      </section>

      {/* DESTAQUES */}
      <section id="destaques" className="py-20 md:py-28 bg-keu-gray-light">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <Badge variant="default">Destaques</Badge>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-2">
                Motos em <span className="text-keu-red">destaque</span>
              </h2>
              <p className="text-keu-black/60 text-lg">
                Selecionadas pelos nossos especialistas
              </p>
            </div>
            <Link
              href="/motos"
              prefetch
              className={cn(
                buttonVariants({ size: "lg" }),
                "shadow-lg shadow-keu-red/30"
              )}
            >
              Ver todas as motos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                marca: "Honda",
                modelo: "CG 160 Titan",
                ano: "2024",
                km: "8.500",
                valor: "R$ 15.200",
                cor: "Vermelha",
              },
              {
                marca: "Yamaha",
                modelo: "Fazer 250 ABS",
                ano: "2024",
                km: "3.200",
                valor: "R$ 23.800",
                cor: "Preta",
              },
              {
                marca: "Kawasaki",
                modelo: "Ninja 400",
                ano: "2024",
                km: "5.800",
                valor: "R$ 39.800",
                cor: "Verde",
              },
            ].map((m, i) => (
              <Link href="/motos" key={i} className="group block">
                <Card className="overflow-hidden h-full hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="aspect-video bg-gradient-to-br from-keu-gray-light via-white to-keu-red/10 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity group-hover:scale-110 duration-500">
                      <Image
                        src={`/logos/moto-rider-${(i % 3) + 1}.webp`}
                        alt={m.modelo}
                        width={200}
                        height={150}
                        className="object-contain"
                      />
                    </div>
                    <Badge className="absolute top-3 left-3" variant="default">
                      Destaque
                    </Badge>
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-xs font-bold">
                      {m.ano}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-semibold text-keu-red mb-1">
                      {m.marca}
                    </div>
                    <h3 className="font-bold text-lg mb-3">{m.modelo}</h3>
                    <div className="flex gap-3 text-xs text-keu-black/60 mb-4">
                      <span>{m.km} km</span>
                      <span>•</span>
                      <span>{m.cor}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-keu-black/5 pt-4">
                      <div>
                        <div className="text-xs text-keu-black/60">A partir de</div>
                        <div className="text-2xl font-black text-keu-red">{m.valor}</div>
                      </div>
                      <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold transition-all h-8 px-3 bg-gradient-to-br from-keu-red to-keu-red-dark text-white group-hover:shadow-lg group-hover:shadow-keu-red/30">
                        Ver moto <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-keu-gray-light via-white to-keu-gray-light relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="default">Por que KEU?</Badge>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-6">
                Mais de uma década
                <br />
                <span className="text-keu-red">rodando junto com você</span>
              </h2>
              <p className="text-keu-black/70 text-lg mb-8">
                Somos referência em motos no Cariri. Vendemos, alugamos, trocamos
                e oferecemos peças com o compromisso da família KEU.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <WhyItem
                  icon={<Award />}
                  title="Avaliação FIPE"
                  desc="Preço justo, transparente"
                />
                <WhyItem
                  icon={<Users />}
                  title="Equipe especializada"
                  desc="Vendedores experientes"
                />
                <WhyItem
                  icon={<ShieldCheck />}
                  title="Documentação OK"
                  desc="Tudo certinho"
                />
                <WhyItem
                  icon={<TrendingUp />}
                  title="Melhor preço"
                  desc="Garantido na região"
                />
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { n: "500+", l: "Motos vendidas" },
                  { n: "1.2K", l: "Clientes satisfeitos" },
                  { n: "300+", l: "Aluguéis/ano" },
                  { n: "98%", l: "Recomendação" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-white border border-keu-black/5 rounded-2xl p-6 hover:shadow-xl hover:border-keu-red transition-all shadow-sm"
                  >
                    <div className="text-4xl font-black text-keu-red mb-1">
                      {s.n}
                    </div>
                    <div className="text-sm text-keu-black/70">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="contato"
        className="py-20 md:py-28 bg-gradient-to-br from-keu-red to-keu-red-dark text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Vamos realizar
            <br />
            seu próximo sonho?
          </h2>
          <p className="text-white/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Fale com a gente pelo WhatsApp ou venha nos visitar. Estamos prontos
            pra te atender.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
            <a
              href="https://wa.me/5588988143757"
              target="_blank"
              rel="noopener"
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all text-left"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Moto Peças e Aluguel
              </div>
              <div className="text-2xl font-black flex items-center gap-2">
                <Phone className="h-5 w-5" /> (88) 98814-3757
              </div>
              <div className="text-sm mt-2 flex items-center gap-1.5">
                <Instagram className="h-4 w-4" /> @keumotopecas
              </div>
            </a>
            <a
              href="https://wa.me/5588998505859"
              target="_blank"
              rel="noopener"
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all text-left"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Multimarcas
              </div>
              <div className="text-2xl font-black flex items-center gap-2">
                <Phone className="h-5 w-5" /> (88) 99850-5859
              </div>
              <div className="text-sm mt-2 flex items-center gap-1.5">
                <Instagram className="h-4 w-4" /> @keumultimarcass
              </div>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Juazeiro do Norte - CE
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Seg a Sáb 8h-18h
            </span>
          </div>
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
                  <Link href="/dashboard" className="hover:text-keu-red">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>(88) 98814-3757</li>
                <li>(88) 99850-5859</li>
                <li>Juazeiro do Norte - CE</li>
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

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-black text-keu-red">{number}</div>
      <div className="text-xs text-keu-black/60 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function UnidadeCard({
  brand,
  title,
  description,
  phone,
  instagram,
  gradient,
  featured,
}: {
  brand: React.ReactNode;
  title: string;
  description: string;
  phone: string;
  instagram?: string;
  gradient: string;
  featured?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden p-8 hover:shadow-2xl hover:-translate-y-1 transition-all bg-gradient-to-br ${gradient} ${
        featured ? "ring-2 ring-keu-red" : ""
      }`}
    >
      {featured && (
        <Badge className="absolute top-4 right-4" variant="default">
          Mais procurada
        </Badge>
      )}
      <div className="mb-6 min-h-[180px] flex items-center justify-center">
        {brand}
      </div>
      <h3 className="font-bold text-xl mb-2 text-center">{title}</h3>
      <p className="text-sm text-keu-black/70 mb-6 text-center">{description}</p>
      <div className="space-y-2 mb-6 text-sm">
        <div className="flex items-center gap-2 text-keu-black/80">
          <Phone className="h-4 w-4 text-keu-red" />
          <span className="font-semibold">{phone}</span>
        </div>
        {instagram && (
          <div className="flex items-center gap-2 text-keu-black/80">
            <Instagram className="h-4 w-4 text-keu-red" />
            <span>{instagram}</span>
          </div>
        )}
      </div>
      <Button className="w-full">
        Falar pelo WhatsApp <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
      <div className="bg-keu-red/10 text-keu-red w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-keu-red group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-keu-black/60">{desc}</p>
    </Card>
  );
}

function WhyItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="bg-keu-red/20 text-keu-red w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-bold mb-0.5">{title}</div>
        <div className="text-sm text-keu-black/60">{desc}</div>
      </div>
    </div>
  );
}
