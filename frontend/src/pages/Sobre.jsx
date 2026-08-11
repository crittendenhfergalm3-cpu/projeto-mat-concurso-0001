import { PageShell } from "@/components/PageShell";
import { BUSINESS, fullAddress } from "@/data/business";
import { Store, Truck, ShieldCheck, Users } from "lucide-react";

const Sobre = () => (
  <PageShell title="Quem Somos" subtitle="Conheça a São José Material de Construção">
    <p>
      A <strong>{BUSINESS.name}</strong> é uma loja de materiais de construção
      localizada em {BUSINESS.address.city}/{BUSINESS.address.state}. Nascemos com o
      propósito de oferecer tudo o que a sua obra precisa — do prego à betoneira — com
      preço justo, atendimento próximo e entrega rápida para toda a região.
    </p>
    <p>
      Registrada como <strong>{BUSINESS.legalName}</strong>, CNPJ{" "}
      <strong>{BUSINESS.cnpj}</strong>, atuamos no comércio varejista de materiais de
      construção em geral, atendendo consumidores finais, pedreiros e pequenos
      empreiteiros com produtos de marcas reconhecidas no mercado.

    </p>

    <div className="grid gap-4 py-4 sm:grid-cols-2">
      {[
        { icon: Store, t: "Loja física", d: "Endereço próprio e CNPJ ativo em São Luís/MA." },
        { icon: Truck, t: "Entrega rápida", d: "Levamos seu material direto na obra." },
        { icon: ShieldCheck, t: "Compra segura", d: "Pagamento protegido e nota fiscal." },
        { icon: Users, t: "Atendimento próximo", d: "Suporte por telefone e WhatsApp." },
      ].map((f, i) => (
        <div key={i} className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-4">
          <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <div>
            <div className="font-semibold text-gray-900">{f.t}</div>
            <div className="text-sm text-gray-500">{f.d}</div>
          </div>
        </div>
      ))}
    </div>

    <h2>Nossa missão</h2>
    <p>
      Ser a referência em materiais de construção na nossa região, ajudando cada cliente a
      construir e reformar com segurança, economia e confiança.
    </p>

    <h2>Onde estamos</h2>
    <p>{fullAddress}</p>
    <p>Horário de funcionamento: {BUSINESS.hours}</p>
  </PageShell>
);

export default Sobre;
