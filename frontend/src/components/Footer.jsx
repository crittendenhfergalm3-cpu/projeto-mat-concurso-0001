import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, ShieldCheck, Lock } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { BUSINESS, fullAddress, waLink } from "@/data/business";
import { PaymentBadges } from "@/components/TrustBadges";
import { LogoMark } from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="mt-16 bg-gray-900 text-gray-300" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <LogoMark className="h-10 w-10" />
              <span className="font-display text-lg font-bold text-white">São José</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Materiais de construção com entrega rápida em {BUSINESS.address.city} e região.
              Do prego à betoneira, tudo para a sua obra.
            </p>
            <div className="mt-4">
              <PaymentBadges />
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-white">
              Contato
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <span data-testid="footer-address">{fullAddress}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-500" />
                <span data-testid="footer-phone">{BUSINESS.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-500" />
                <span className="break-all" data-testid="footer-email">{BUSINESS.email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>{BUSINESS.hours}</span>
              </li>
              <li>
                <a
                  href={waLink("Olá! Gostaria de falar com a São José Material de Construção.")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1eb355]"
                  data-testid="footer-whatsapp"
                >
                  <FaWhatsapp className="h-4 w-4" /> Falar no WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-white">
              Institucional
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/sobre" className="hover:text-orange-400" data-testid="footer-link-sobre">Sobre / Quem Somos</Link></li>
              <li><Link to="/contato" className="hover:text-orange-400" data-testid="footer-link-contato">Contato</Link></li>
              <li><Link to="/frete" className="hover:text-orange-400" data-testid="footer-link-frete">Política de Entrega/Frete</Link></li>
              <li><Link to="/trocas-e-devolucoes" className="hover:text-orange-400" data-testid="footer-link-trocas">Trocas e Devoluções</Link></li>
              <li><Link to="/termos" className="hover:text-orange-400" data-testid="footer-link-termos">Termos de Uso</Link></li>
              <li><Link to="/politica-de-privacidade" className="hover:text-orange-400" data-testid="footer-link-privacidade">Política de Privacidade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-white">
              Segurança
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-500" /> Site com certificado SSL (https)
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" /> Pagamento processado pela Stripe
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" /> Loja física com CNPJ ativo
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6">
          <p className="text-xs leading-relaxed text-gray-500" data-testid="footer-legal">
            <span className="font-semibold text-gray-400">{BUSINESS.legalName}</span> · CNPJ{" "}
            <span className="font-semibold text-gray-400">{BUSINESS.cnpj}</span> · {fullAddress}
          </p>
          <p className="mt-2 text-xs text-gray-600">
            © {new Date().getFullYear()} {BUSINESS.name}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
