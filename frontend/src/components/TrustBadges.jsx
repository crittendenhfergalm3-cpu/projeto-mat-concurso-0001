import { Link } from "react-router-dom";
import { ShieldCheck, Lock, CreditCard } from "lucide-react";
import { FaWhatsapp, FaStripe } from "react-icons/fa";

export const TrustStrip = () => (
  <div
    data-testid="trust-strip"
    className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-600"
  >
    <span className="flex items-center gap-1.5">
      <Lock className="h-4 w-4 text-green-600" /> Conexão segura (SSL)
    </span>
    <span className="flex items-center gap-1.5">
      <ShieldCheck className="h-4 w-4 text-green-600" /> Compra 100% protegida
    </span>
    <span className="flex items-center gap-1.5">
      <CreditCard className="h-4 w-4 text-orange-600" /> Pagamento via Stripe
    </span>
    <span className="flex items-center gap-1.5">
      <FaWhatsapp className="h-4 w-4 text-[#25D366]" /> Atendimento no WhatsApp
    </span>
  </div>
);

export const PaymentBadges = () => (
  <div className="flex items-center gap-3" data-testid="payment-badges">
    <span className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
      <FaStripe className="h-5 w-5 text-[#635BFF]" /> Stripe
    </span>
    <span className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
      <FaWhatsapp className="h-5 w-5 text-[#25D366]" /> WhatsApp
    </span>
    <span className="flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
      <Lock className="h-4 w-4" /> SSL
    </span>
  </div>
);
