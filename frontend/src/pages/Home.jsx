import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, ShieldCheck, Headphones, Award, Newspaper, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { TrustStrip } from "@/components/TrustBadges";
import { STATUS_META } from "@/data/status";

const HERO = "https://images.unsplash.com/photo-1625426078245-6911839409dd?crop=entropy&cs=srgb&fm=jpg&w=1400&q=80&ixlib=rb-4.1.0";

const Home = () => {
  const [cats, setCats] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [concursos, setConcursos] = useState([]);
  const [noticias, setNoticias] = useState([]);

  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data)).catch(() => {});
    api.get("/products", { params: { featured: true, limit: 8 } }).then((r) => setFeatured(r.data.products)).catch(() => {});
    api.get("/concursos", { params: { limit: 4 } }).then((r) => setConcursos(r.data)).catch(() => {});
    api.get("/noticias", { params: { limit: 3 } }).then((r) => setNoticias(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-900">
        <img src={HERO} alt="Concursos públicos no Brasil" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/85 to-slate-900/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
              <Award className="h-3.5 w-3.5" /> Sua aprovação começa aqui
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Estude para concursos com quem <span className="text-emerald-500">te leva à aprovação</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-300 md:text-lg">
              Apostilas e cursos atualizados, direcionados por banca, para os principais concursos
              públicos do Brasil. Conteúdo digital com acesso imediato.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/apostilas">
                <Button size="lg" className="gap-2 bg-emerald-600 py-6 text-base hover:bg-emerald-700" data-testid="hero-shop-button">
                  Ver apostilas e cursos <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/concursos">
                <Button size="lg" variant="outline" className="border-slate-400 bg-white/10 py-6 text-base text-white hover:bg-white/20">
                  Concursos abertos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* feature strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {[
            { icon: Download, t: "Acesso imediato", s: "Conteúdo digital na hora" },
            { icon: ShieldCheck, t: "Compra segura", s: "Pagamento via Stripe" },
            { icon: Award, t: "Direcionado por banca", s: "CEBRASPE, FGV, FCC..." },
            { icon: Headphones, t: "Suporte ao aluno", s: "Atendimento no WhatsApp" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-50">
                <f.icon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{f.t}</div>
                <div className="text-xs text-slate-500">{f.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* áreas */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">Áreas de concurso</h2>
            <p className="mt-1 text-sm text-slate-500">Escolha a sua área e estude de forma direcionada</p>
          </div>
          <Link to="/apostilas" className="hidden text-sm font-semibold text-emerald-600 hover:underline sm:block">
            Ver tudo →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cats.map((c) => (
            <Link
              key={c.slug}
              to={`/area/${c.slug}`}
              data-testid={`home-cat-${c.slug}`}
              className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900"
            >
              <img src={c.image} alt={c.name} className="h-36 w-full object-cover opacity-60 transition-transform duration-300 group-hover:scale-110 md:h-44" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 to-transparent" />
              <div className="absolute bottom-0 p-4">
                <h3 className="font-display text-base font-bold text-white">{c.name}</h3>
                <span className="text-xs text-emerald-300">{c.count} materiais</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* destaques */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">Materiais em destaque</h2>
            <p className="mt-1 text-sm text-slate-500">Os mais procurados pelos nossos alunos</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* concursos */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-slate-900 md:text-3xl">
              <CalendarDays className="h-6 w-6 text-emerald-600" /> Concursos em foco
            </h2>
            <p className="mt-1 text-sm text-slate-500">Abertos, com edital publicado e previstos</p>
          </div>
          <Link to="/concursos" className="hidden text-sm font-semibold text-emerald-600 hover:underline sm:block">
            Ver todos →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {concursos.map((c) => {
            const st = STATUS_META[c.status] || STATUS_META.previsto;
            return (
              <Link key={c.id} to="/concursos" data-testid={`home-concurso-${c.id}`} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-emerald-300">
                <div>
                  <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase ${st.badge}`}>{st.label}</span>
                  <h3 className="mt-2 font-display font-bold text-slate-900">{c.orgao}</h3>
                  <p className="text-sm text-slate-500">{c.cargo}</p>
                  <p className="mt-1 text-xs text-slate-400">Banca: {c.banca || "—"} · {c.vagas} vagas · {c.uf}</p>
                </div>
                <div className="text-right text-sm font-semibold text-emerald-700">{c.salario}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* noticias */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-slate-900 md:text-3xl">
                <Newspaper className="h-6 w-6 text-emerald-600" /> Últimas notícias
              </h2>
              <p className="mt-1 text-sm text-slate-500">Fique por dentro do mundo dos concursos</p>
            </div>
            <Link to="/noticias" className="hidden text-sm font-semibold text-emerald-600 hover:underline sm:block">
              Ver todas →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {noticias.map((n) => (
              <Link key={n.id} to={`/noticias/${n.slug}`} data-testid={`home-noticia-${n.slug}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md">
                <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                  <img src={n.image} alt={n.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">{n.category}</span>
                  <h3 className="mt-1 line-clamp-2 font-display font-bold text-slate-900 group-hover:text-emerald-700">{n.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{n.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-10">
        <div className="mx-auto max-w-7xl px-4">
          <TrustStrip />
        </div>
      </section>
    </div>
  );
};

export default Home;
