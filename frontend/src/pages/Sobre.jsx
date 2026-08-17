import { PageShell } from "@/components/PageShell";
import { BUSINESS, fullAddress } from "@/data/business";
import { Award, Download, ShieldCheck, Users } from "lucide-react";

const Sobre = () => (
  <PageShell title="Quem Somos" subtitle="Conheça a TÔ APROVADO Concursos Públicos">
    <p>
      A <strong>{BUSINESS.name}</strong> é uma empresa especializada em preparação para concursos
      públicos, com atuação em todo o Brasil por meio de conteúdo 100% digital. Nascemos com um
      propósito claro: transformar a rotina de estudos de milhares de concurseiros em aprovações reais.
    </p>
    <p>
      Registrada como <strong>{BUSINESS.legalName}</strong>, CNPJ <strong>{BUSINESS.cnpj}</strong>,
      nossa atividade principal são os cursos preparatórios para concursos. Produzimos apostilas,
      cursos em videoaulas e materiais direcionados por banca examinadora, sempre atualizados de
      acordo com os editais mais recentes.
    </p>

    <div className="grid gap-4 py-4 sm:grid-cols-2">
      {[
        { icon: Award, t: "Foco na aprovação", d: "Material direcionado ao edital e ao estilo da banca." },
        { icon: Download, t: "Acesso imediato", d: "Conteúdo digital liberado logo após o pagamento." },
        { icon: ShieldCheck, t: "Empresa registrada", d: "CNPJ ativo e pagamento seguro via Stripe." },
        { icon: Users, t: "Suporte ao aluno", d: "Atendimento por e-mail e WhatsApp." },
      ].map((f, i) => (
        <div key={i} className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-4">
          <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <div className="font-semibold text-slate-900">{f.t}</div>
            <div className="text-sm text-slate-500">{f.d}</div>
          </div>
        </div>
      ))}
    </div>

    <h2>Nossa missão</h2>
    <p>
      Democratizar o acesso a um material de estudo de qualidade, ajudando cada candidato a estudar
      de forma inteligente, organizada e direcionada — do primeiro contato com o edital até a nomeação.
    </p>

    <h2>Onde estamos</h2>
    <p>{fullAddress}</p>
    <p>{BUSINESS.hours}</p>

    <p className="text-sm text-slate-400">
      Importante: a TÔ APROVADO é uma empresa privada de cursos preparatórios e não possui qualquer
      vínculo com órgãos públicos, bancas examinadoras ou o Governo Federal.
    </p>
  </PageShell>
);

export default Sobre;
