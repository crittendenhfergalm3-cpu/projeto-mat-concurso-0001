import { PageShell } from "@/components/PageShell";
import { BUSINESS, fullAddress, waLink } from "@/data/business";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const Contato = () => (
  <PageShell title="Contato" subtitle="Fale com a nossa equipe">
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <div>
            <div className="font-semibold text-gray-900">Endereço</div>
            <div data-testid="contato-address">{fullAddress}</div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-4">
          <Phone className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <div>
            <div className="font-semibold text-gray-900">Telefone</div>
            <div data-testid="contato-phone">{BUSINESS.phone}</div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-4">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <div>
            <div className="font-semibold text-gray-900">E-mail</div>
            <div className="break-all" data-testid="contato-email">{BUSINESS.email}</div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <div>
            <div className="font-semibold text-gray-900">Horário de funcionamento</div>
            <div>{BUSINESS.hours}</div>
          </div>
        </div>
        <a href={waLink("Olá! Gostaria de um orçamento.")} target="_blank" rel="noreferrer" data-testid="contato-whatsapp">
          <Button className="w-full gap-2 bg-[#25D366] py-6 text-base text-white hover:bg-[#1eb355]">
            <FaWhatsapp className="h-5 w-5" /> Falar no WhatsApp
          </Button>
        </a>
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <iframe
          title="Mapa da loja"
          src={`https://www.google.com/maps?q=${BUSINESS.mapsQuery}&output=embed`}
          className="h-full min-h-[380px] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>

    <div className="mt-8 rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500">
      <strong className="text-gray-900">{BUSINESS.legalName}</strong> · CNPJ {BUSINESS.cnpj}
    </div>
  </PageShell>
);

export default Contato;
