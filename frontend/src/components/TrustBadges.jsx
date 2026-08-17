import { Link } from "react-router-dom";
import { ShieldCheck, Lock, CreditCard, Download } from "lucide-react";
import { FaWhatsapp, FaStripe } from "react-icons/fa";

export const TrustStrip = () => (
  <div
    data-testid="trust-strip"
    className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600"
  >
    <span className="flex items-center gap-1.5">
      <Lock className="h-4 w-4 text-emerald-600" /> Conexão segura (SSL)
    </span>
    <span className="flex items-center gap-1.5">
      <Download className="h-4 w-4 text-emerald-600" /> Acesso imediato ao material
    </span>
    <span className="flex items-center gap-1.5">
      <CreditCard className="h-4 w-4 text-emerald-600" /> Pagamento via Stripe
    </span>
    <span className="flex items-center gap-1.5">
      <FaWhatsapp className="h-4 w-4 text-[#25D366]" /> Suporte no WhatsApp
    </span>
  </div>
);

export const PaymentBadges = () => (
  <div className="flex items-center gap-3" data-testid="payment-badges">
    <span className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
      <FaStripe className="h-5 w-5 text-[#635BFF]" /> Stripe
    </span>
    <span className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
      <FaWhatsapp className="h-5 w-5 text-[#25D366]" /> WhatsApp
    </span>
    <span className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
      <Lock className="h-4 w-4" /> SSL
    </span>
  </div>
);
