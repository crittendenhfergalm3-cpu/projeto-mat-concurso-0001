import { useEffect, useState } from "react";
import { CalendarDays, Search, MapPin, Users, GraduationCap, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STATUS_META, STATUS_OPTIONS } from "@/data/status";

const FILTERS = [{ value: "", label: "Todos" }, ...STATUS_OPTIONS];

const Concursos = () => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = {};
    if (status) params.status = status;
    if (q) params.search = q;
    api.get("/concursos", { params }).then((r) => setItems(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  return (
    <div className="bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-slate-900 md:text-4xl">
            <CalendarDays className="h-8 w-8 text-emerald-600" /> Concursos Públicos
          </h1>
          <p className="mt-2 text-slate-500">Acompanhe os concursos abertos, com edital publicado e previstos em todo o Brasil.</p>
          <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mt-5 flex max-w-lg gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por órgão, cargo ou banca..." className="pl-9" data-testid="concurso-search" />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="concurso-search-btn">Buscar</Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                data-testid={`concurso-filter-${f.value || "all"}`}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  status === f.value ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Carregando concursos...</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground" data-testid="no-concursos">Nenhum concurso encontrado.</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {items.map((c) => {
              const st = STATUS_META[c.status] || STATUS_META.previsto;
              return (
                <div key={c.id} data-testid={`concurso-${c.id}`} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${st.badge}`}>{st.label}</span>
                    <span className="text-right text-sm font-bold text-emerald-700">{c.salario}</span>
                  </div>
                  <h2 className="mt-3 font-display text-lg font-bold text-slate-900">{c.orgao}</h2>
                  <p className="text-sm font-medium text-slate-600">{c.cargo}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{c.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-emerald-600" /> {c.vagas} vagas</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-600" /> {c.uf}</span>
                    <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-emerald-600" /> {c.escolaridade}</span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-600">Banca: {c.banca || "—"}</span>
                  </div>
                  {c.link && (
                    <a href={c.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline">
                      Ver edital <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Concursos;
