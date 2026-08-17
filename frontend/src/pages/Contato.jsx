import { PageShell } from "@/components/PageShell";
import { BUSINESS, fullAddress, waLink } from "@/data/business";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const Contato = () => (
  <PageShell title="Contato" subtitle="Fale com a equipe da TÔ APROVADO">
    <p>
      Tem dúvidas sobre qual material escolher para o seu concurso? Precisa de ajuda com um pedido?
      Fale com a gente pelos canais abaixo — teremos prazer em ajudar na sua jornada rumo à aprovação.
    </p>

    <div className="grid gap-4 py-4 sm:grid-cols-2">
      <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-4">
        <Phone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <div className="font-semibold text-slate-900">Telefone / WhatsApp</div>
          <div className="text-sm text-slate-600" data-testid="contato-phone">{BUSINESS.phone}</div>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-4">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <div className="font-semibold text-slate-900">E-mail</div>
          <div className="break-all text-sm text-slate-600" data-testid="contato-email">{BUSINESS.email}</div>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-4">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <div className="font-semibold text-slate-900">Endereço</div>
          <div className="text-sm text-slate-600">{fullAddress}</div>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <div className="font-semibold text-slate-900">Atendimento</div>
          <div className="text-sm text-slate-600">{BUSINESS.hours}</div>
        </div>
      </div>
    </div>

    <a
      href={waLink("Olá! Vim pelo site TÔ APROVADO e gostaria de mais informações.")}
      target="_blank"
      rel="noreferrer"
      data-testid="contato-whatsapp"
      className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-5 py-3 font-semibold text-white no-underline hover:bg-[#1eb355]"
    >
      <FaWhatsapp className="h-5 w-5" /> Falar agora no WhatsApp
    </a>

    <h2>Dados da empresa</h2>
    <p>
      <strong>{BUSINESS.legalName}</strong><br />
      CNPJ: {BUSINESS.cnpj}<br />
      {fullAddress}
    </p>
  </PageShell>
);

export default Contato;
