import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Newspaper } from "lucide-react";
import { api } from "@/lib/api";

const NoticiaDetail = () => {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/noticias/${slug}`).then((r) => setItem(r.data)).catch(() => setNotFound(true));
  }, [slug]);

  if (notFound)
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <Newspaper className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 font-display text-2xl font-bold">Notícia não encontrada</h1>
        <Link to="/noticias" className="mt-4 inline-block text-emerald-600 hover:underline">Voltar às notícias</Link>
      </div>
    );

  if (!item) return <div className="py-24 text-center text-muted-foreground">Carregando...</div>;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/noticias" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600">
        <ArrowLeft className="h-4 w-4" /> Todas as notícias
      </Link>
      <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">{item.category}</span>
      <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-slate-900 md:text-4xl" data-testid="noticia-title">{item.title}</h1>
      {item.image && (
        <img src={item.image} alt={item.title} className="mt-6 aspect-[16/9] w-full rounded-lg object-cover" />
      )}
      <div className="mt-6 space-y-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700" data-testid="noticia-content">
        {item.content || item.summary}
      </div>
      <div className="mt-10 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-display text-lg font-bold text-slate-900">Quer se preparar para este concurso?</p>
        <p className="mt-1 text-sm text-slate-600">Confira nossas apostilas e cursos direcionados por banca.</p>
        <Link to="/apostilas" className="mt-4 inline-block rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
          Ver materiais de estudo
        </Link>
      </div>
    </article>
  );
};

export default NoticiaDetail;
