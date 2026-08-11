import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, Headphones, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { TrustStrip } from "@/components/TrustBadges";
import { BUSINESS } from "@/data/business";

const HERO = "https://images.unsplash.com/photo-1774273177331-4c19e9912071?crop=entropy&cs=srgb&fm=jpg&w=1400&q=80&ixlib=rb-4.1.0";

const Home = () => {
  const [cats, setCats] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data)).catch(() => {});
    api.get("/products", { params: { featured: true, limit: 8 } })
      .then((r) => setFeatured(r.data.products))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gray-900">
        <img src={HERO} alt="Loja de material de construção" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-600/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-400">
              <Store className="h-3.5 w-3.5" /> Loja física em {BUSINESS.address.city}/{BUSINESS.address.state}
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Tudo para sua obra, <span className="text-orange-500">do prego à betoneira</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-gray-300 md:text-lg">
              Cimento, tijolo, hidráulica, elétrica, tintas e ferramentas com preço justo
              e entrega rápida em São Luís e região.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/produtos">
                <Button size="lg" className="gap-2 bg-orange-600 py-6 text-base hover:bg-orange-700" data-testid="hero-shop-button">
                  Ver produtos <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contato">
                <Button size="lg" variant="outline" className="border-gray-400 bg-white/10 py-6 text-base text-white hover:bg-white/20">
                  Fazer orçamento
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* feature strip */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {[
            { icon: Truck, t: "Entrega rápida", s: "São Luís e região" },
            { icon: ShieldCheck, t: "Compra segura", s: "Pagamento via Stripe" },
            { icon: Headphones, t: "Atendimento", s: "Suporte no WhatsApp" },
            { icon: Store, t: "Loja física", s: "CNPJ ativo e nota fiscal" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-orange-50">
                <f.icon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{f.t}</div>
                <div className="text-xs text-gray-500">{f.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* categories */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900 md:text-3xl">Categorias</h2>
            <p className="mt-1 text-sm text-gray-500">Encontre tudo o que a sua obra precisa</p>
          </div>
          <Link to="/produtos" className="hidden text-sm font-semibold text-orange-600 hover:underline sm:block">
            Ver tudo →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cats.map((c) => (
            <Link
              key={c.slug}
              to={`/categoria/${c.slug}`}
              data-testid={`home-cat-${c.slug}`}
              className="group relative overflow-hidden rounded-md border border-gray-200 bg-gray-900"
            >
              <img src={c.image} alt={c.name} className="h-36 w-full object-cover opacity-70 transition-transform duration-300 group-hover:scale-110 md:h-44" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
              <div className="absolute bottom-0 p-4">
                <h3 className="font-display text-base font-bold text-white">{c.name}</h3>
                <span className="text-xs text-gray-300">{c.count} produtos</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* featured */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-gray-900 md:text-3xl">Destaques da semana</h2>
            <p className="mt-1 text-sm text-gray-500">Os produtos mais procurados pelos nossos clientes</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* trust */}
      <section className="bg-gray-50 py-10">
        <div className="mx-auto max-w-7xl px-4">
          <TrustStrip />
        </div>
      </section>
    </div>
  );
};

export default Home;
