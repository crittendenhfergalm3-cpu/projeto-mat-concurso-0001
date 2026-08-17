import { Link } from "react-router-dom";
import { Lightbulb, CheckCircle2 } from "lucide-react";
import { BANCAS } from "@/data/bancas";

const Bancas = () => (
  <div className="bg-slate-50">
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-slate-900 md:text-4xl">Bancas Examinadoras</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Cada banca tem um jeito próprio de cobrar o conteúdo. Conhecer o perfil da banca do seu concurso
          é um passo decisivo para estudar de forma inteligente e conquistar a aprovação.
        </p>
      </div>
    </div>

    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      {BANCAS.map((b) => (
        <div key={b.sigla} data-testid={`banca-${b.sigla}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-4 border-b border-slate-100 p-5">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ${b.cor} font-display text-xs font-extrabold text-white`}>
              {b.sigla.length > 5 ? b.sigla.slice(0, 5) : b.sigla}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">{b.sigla}</h2>
              <p className="text-sm text-slate-500">{b.nome}</p>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium text-slate-700">{b.resumo}</p>
            <ul className="mt-4 space-y-2">
              {b.caracteristicas.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {c}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span><strong>Dica de ouro:</strong> {b.dica}</span>
            </div>
            <p className="mt-4 text-xs text-slate-400">Concursos frequentes: {b.concursos}</p>
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-display text-lg font-bold text-slate-900">Estude direcionado pela sua banca</p>
        <p className="mt-1 text-sm text-slate-600">Nossas apostilas e cursos são feitos com foco no estilo de cada banca.</p>
        <Link to="/apostilas" className="mt-4 inline-block rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
          Ver materiais por banca
        </Link>
      </div>
    </div>
  </div>
);

export default Bancas;
