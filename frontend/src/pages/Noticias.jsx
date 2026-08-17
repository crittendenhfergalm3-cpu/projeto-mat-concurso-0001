import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper } from "lucide-react";
import { api } from "@/lib/api";

const Noticias = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/noticias").then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-slate-900 md:text-4xl">
            <Newspaper className="h-8 w-8 text-emerald-600" /> Notícias de Concursos
          </h1>
          <p className="mt-2 text-slate-500">Editais, autorizações, dicas de estudo e tudo sobre o mundo dos concursos públicos.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Carregando notícias...</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground" data-testid="no-noticias">Nenhuma notícia publicada.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {items.map((n) => (
              <Link key={n.id} to={`/noticias/${n.slug}`} data-testid={`noticia-${n.slug}`} className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md">
                <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                  <img src={n.image} alt={n.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">{n.category}</span>
                  <h2 className="mt-1 line-clamp-2 font-display font-bold text-slate-900 group-hover:text-emerald-700">{n.title}</h2>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-500">{n.summary}</p>
                  <span className="mt-auto pt-3 text-sm font-semibold text-emerald-600">Ler mais →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Noticias;
