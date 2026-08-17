import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, ShieldCheck, Lock } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { BUSINESS, fullAddress, waLink } from "@/data/business";
import { PaymentBadges } from "@/components/TrustBadges";
import { LogoMark } from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <LogoMark className="h-10 w-10" />
              <span className="font-display text-lg font-extrabold text-white">
                TÔ APROVADO
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Apostilas, cursos e conteúdos de estudo para concursos públicos de todo o Brasil.
              Material atualizado, direcionado por banca e feito para a sua aprovação.
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
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span data-testid="footer-address">{fullAddress}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-500" />
                <span data-testid="footer-phone">{BUSINESS.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-500" />
                <span className="break-all" data-testid="footer-email">{BUSINESS.email}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span>{BUSINESS.hours}</span>
              </li>
              <li>
                <a
                  href={waLink("Olá! Gostaria de falar com a TÔ APROVADO Concursos Públicos.")}
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
              Navegação
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/apostilas" className="hover:text-emerald-400" data-testid="footer-link-apostilas">Apostilas & Cursos</Link></li>
              <li><Link to="/concursos" className="hover:text-emerald-400" data-testid="footer-link-concursos">Concursos Abertos</Link></li>
              <li><Link to="/noticias" className="hover:text-emerald-400" data-testid="footer-link-noticias">Notícias</Link></li>
              <li><Link to="/bancas" className="hover:text-emerald-400" data-testid="footer-link-bancas">Bancas Examinadoras</Link></li>
              <li><Link to="/sobre" className="hover:text-emerald-400" data-testid="footer-link-sobre">Quem Somos</Link></li>
              <li><Link to="/contato" className="hover:text-emerald-400" data-testid="footer-link-contato">Contato</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-white">
              Institucional
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/entrega" className="hover:text-emerald-400" data-testid="footer-link-entrega">Entrega dos Materiais</Link></li>
              <li><Link to="/reembolso" className="hover:text-emerald-400" data-testid="footer-link-reembolso">Reembolso e Arrependimento</Link></li>
              <li><Link to="/termos" className="hover:text-emerald-400" data-testid="footer-link-termos">Termos de Uso</Link></li>
              <li><Link to="/politica-de-privacidade" className="hover:text-emerald-400" data-testid="footer-link-privacidade">Política de Privacidade</Link></li>
            </ul>
            <ul className="mt-4 space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-emerald-500" /> Site com SSL (https)</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Pagamento via Stripe</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6">
          <p className="text-xs leading-relaxed text-slate-500" data-testid="footer-legal">
            <span className="font-semibold text-slate-400">{BUSINESS.legalName}</span> · CNPJ{" "}
            <span className="font-semibold text-slate-400">{BUSINESS.cnpj}</span> · {fullAddress}
          </p>
          <p className="mt-2 text-xs text-slate-600">
            © {new Date().getFullYear()} {BUSINESS.name}. Todos os direitos reservados. Este site não possui vínculo com órgãos governamentais ou bancas examinadoras.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
