import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Truck, ShoppingCart, ArrowLeft } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api, fileUrl, formatBRL } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { PaymentBadges } from "@/components/TrustBadges";
import { waLink } from "@/data/business";
import { toast } from "sonner";

const Checkout = () => {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", cep: "", address: "" });
  const [shipping, setShipping] = useState(null);
  const [selectedShip, setSelectedShip] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const shippingCost = selectedShip ? selectedShip.cost : 0;
  const total = subtotal + shippingCost;

  const calcShipping = async () => {
    if (!form.cep) return toast.error("Digite o CEP");
    setCalcLoading(true);
    try {
      const r = await api.post("/shipping/calculate", { cep: form.cep, subtotal });
      setShipping(r.data);
      setSelectedShip(r.data.options[0]);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao calcular frete");
    } finally {
      setCalcLoading(false);
    }
  };

  const validate = () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error("Preencha nome, e-mail e telefone");
      return false;
    }
    if (!selectedShip) {
      toast.error("Calcule e selecione uma opção de frete");
      return false;
    }
    return true;
  };

  const payload = () => ({
    items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    customer: form,
    shipping_cost: shippingCost,
    shipping_label: selectedShip?.label || "",
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
        <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 font-display text-2xl font-bold">Seu carrinho está vazio</h1>
        <Link to="/produtos">
          <Button className="mt-4 bg-orange-600 hover:bg-orange-700">Ir às compras</Button>
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/produtos" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600">
        <ArrowLeft className="h-4 w-4" /> Continuar comprando
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900 md:text-3xl">Finalizar compra</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* form */}
        <div className="space-y-6">
          <div className="rounded-md border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Seus dados</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input id="name" value={form.name} onChange={set("name")} data-testid="checkout-name" />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" value={form.email} onChange={set("email")} data-testid="checkout-email" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                <Input id="phone" value={form.phone} onChange={set("phone")} data-testid="checkout-phone" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Endereço de entrega</Label>
                <Textarea id="address" value={form.address} onChange={set("address")} placeholder="Rua, número, bairro, complemento" data-testid="checkout-address" />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
              <Truck className="h-5 w-5 text-orange-600" /> Frete
            </h2>
            <div className="flex gap-2">
              <Input value={form.cep} onChange={set("cep")} placeholder="CEP de entrega" maxLength={9} data-testid="checkout-cep" />
              <Button onClick={calcShipping} disabled={calcLoading} variant="secondary" data-testid="checkout-calc-shipping">
                {calcLoading ? "..." : "Calcular"}
              </Button>
            </div>
            {shipping && (
              <RadioGroup
                className="mt-4 space-y-2"
                value={selectedShip?.label}
                onValueChange={(v) => setSelectedShip(shipping.options.find((o) => o.label === v))}
              >
                {shipping.options.map((o, i) => (
                  <label
                    key={i}
                    className="flex cursor-pointer items-center justify-between rounded-md border border-gray-200 p-3 hover:border-orange-400 [&:has([data-state=checked])]:border-orange-600 [&:has([data-state=checked])]:bg-orange-50"
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={o.label} data-testid={`ship-option-${i}`} />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{o.label}</div>
                        <div className="text-xs text-gray-500">{o.days}</div>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${o.free ? "text-green-600" : "text-gray-900"}`}>
                      {o.free ? "Grátis" : formatBRL(o.cost)}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            )}
          </div>
        </div>

        {/* summary */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-md border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Resumo do pedido</h2>
            <ul className="max-h-64 space-y-3 overflow-y-auto">
              {items.map((i) => (
                <li key={i.product_id} className="flex gap-3">
                  <img src={fileUrl(i.image)} alt={i.name} className="h-12 w-12 rounded border border-gray-200 object-cover" />
                  <div className="flex-1 text-sm">
                    <div className="line-clamp-1 font-medium text-gray-800">{i.name}</div>
                    <div className="text-gray-500">{i.quantity} x {formatBRL(i.price)}</div>
                  </div>
                  <span className="text-sm font-semibold">{formatBRL(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span data-testid="summary-subtotal">{formatBRL(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Frete</span><span data-testid="summary-shipping">{selectedShip ? (selectedShip.free ? "Grátis" : formatBRL(shippingCost)) : "—"}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold"><span>Total</span><span data-testid="summary-total">{formatBRL(total)}</span></div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Button onClick={payStripe} disabled={submitting} className="w-full gap-2 bg-orange-600 py-6 text-base hover:bg-orange-700" data-testid="pay-stripe-button">
                <Lock className="h-4 w-4" /> Pagar online (cartão)
              </Button>
              <Button onClick={payWhatsApp} disabled={submitting} variant="outline" className="w-full gap-2 border-[#25D366] py-6 text-base text-[#128C4A] hover:bg-[#25D366]/10" data-testid="pay-whatsapp-button">
                <FaWhatsapp className="h-5 w-5 text-[#25D366]" /> Finalizar pelo WhatsApp
              </Button>
            </div>

            <div className="mt-5 flex justify-center">
              <PaymentBadges />
            </div>
            <p className="mt-3 text-center text-xs text-gray-400">
              Pagamento processado com segurança pela Stripe (SSL).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
