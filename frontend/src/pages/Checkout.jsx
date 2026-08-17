import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, ShoppingCart, ArrowLeft, Download } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, fileUrl, formatBRL } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { PaymentBadges } from "@/components/TrustBadges";
import { waLink } from "@/data/business";
import { toast } from "sonner";

const Checkout = () => {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "" });
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const total = subtotal;

  const validate = () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error("Preencha nome, e-mail e telefone");
      return false;
    }
    return true;
  };

  const payload = () => ({
    items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    customer: form,
  });

  const payStripe = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const r = await api.post("/checkout/create-session", {
        ...payload(),
        origin_url: window.location.origin,
      });
      window.location.href = r.data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao iniciar pagamento");
      setSubmitting(false);
    }
  };

  const payWhatsApp = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const r = await api.post("/checkout/whatsapp", payload());
      clear();
      window.open(waLink(r.data.message), "_blank");
      toast.success(`Pedido #${r.data.order_number} registrado! Finalize no WhatsApp.`);
      navigate("/");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao criar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 font-display text-2xl font-bold">Seu carrinho está vazio</h1>
        <Link to="/apostilas">
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Ver materiais</Button>
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/apostilas" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600">
        <ArrowLeft className="h-4 w-4" /> Continuar escolhendo
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-slate-900 md:text-3xl">Finalizar compra</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Seus dados</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input id="name" value={form.name} onChange={set("name")} data-testid="checkout-name" />
              </div>
              <div>
                <Label htmlFor="email">E-mail * (para receber o material)</Label>
                <Input id="email" type="email" value={form.email} onChange={set("email")} data-testid="checkout-email" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                <Input id="phone" value={form.phone} onChange={set("phone")} data-testid="checkout-phone" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="cpf">CPF (para emissão de recibo)</Label>
                <Input id="cpf" value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" data-testid="checkout-cpf" />
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
              <Download className="h-4 w-4 shrink-0" /> Este é um produto digital. Após a confirmação do pagamento, o acesso é liberado no seu e-mail imediatamente.
            </p>
          </div>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Resumo do pedido</h2>
            <ul className="max-h-64 space-y-3 overflow-y-auto">
              {items.map((i) => (
                <li key={i.product_id} className="flex gap-3">
                  <img src={fileUrl(i.image)} alt={i.name} className="h-12 w-12 rounded border border-slate-200 object-cover" />
                  <div className="flex-1 text-sm">
                    <div className="line-clamp-2 font-medium text-slate-800">{i.name}</div>
                    <div className="text-slate-500">{i.quantity} x {formatBRL(i.price)}</div>
                  </div>
                  <span className="text-sm font-semibold">{formatBRL(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span data-testid="summary-subtotal">{formatBRL(subtotal)}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold"><span>Total</span><span data-testid="summary-total">{formatBRL(total)}</span></div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Button onClick={payStripe} disabled={submitting} className="w-full gap-2 bg-emerald-600 py-6 text-base hover:bg-emerald-700" data-testid="pay-stripe-button">
                <Lock className="h-4 w-4" /> Pagar online (cartão)
              </Button>
              <Button onClick={payWhatsApp} disabled={submitting} variant="outline" className="w-full gap-2 border-[#25D366] py-6 text-base text-[#128C4A] hover:bg-[#25D366]/10" data-testid="pay-whatsapp-button">
                <FaWhatsapp className="h-5 w-5 text-[#25D366]" /> Finalizar pelo WhatsApp
              </Button>
            </div>

            <div className="mt-5 flex justify-center">
              <PaymentBadges />
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Pagamento processado com segurança pela Stripe (SSL).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
