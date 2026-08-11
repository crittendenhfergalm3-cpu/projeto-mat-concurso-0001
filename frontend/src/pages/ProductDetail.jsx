import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  Lock,
  Package,
  ChevronRight,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, fileUrl, formatBRL } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { waLink } from "@/data/business";
import { toast } from "sonner";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [cep, setCep] = useState("");
  const [shipping, setShipping] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setQty(1);
    setActiveImg(0);
    setShipping(null);
    api
      .get(`/products/${slug}`)
      .then((r) => setProduct(r.data))
      .catch(() => setNotFound(true));
  }, [slug]);

  const calcShipping = async () => {
    setCalcLoading(true);
    try {
      const r = await api.post("/shipping/calculate", { cep, subtotal: product.price * qty });
      setShipping(r.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Não foi possível calcular o frete");
    } finally {
      setCalcLoading(false);
    }
  };

  if (notFound)
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <Package className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 font-display text-2xl font-bold">Produto não encontrado</h1>
        <Link to="/produtos" className="mt-4 inline-block text-orange-600 hover:underline">
          Voltar ao catálogo
        </Link>
      </div>
    );

  if (!product) return <div className="py-24 text-center text-muted-foreground">Carregando...</div>;

  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    addItem(product, qty);
    toast.success("Produto adicionado ao carrinho");
  };

  const waText = `Olá! Tenho interesse no produto *${product.name}* (${formatBRL(product.price)}). Quantidade: ${qty}. Ainda está disponível?`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1 text-xs text-gray-500">
        <Link to="/" className="hover:text-orange-600">Início</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/categoria/${product.category}`} className="hover:text-orange-600">
          {product.category}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* images */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <img
              src={fileUrl(product.images?.[activeImg])}
              alt={product.name}
              className="aspect-square w-full object-cover"
              data-testid="product-main-image"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 overflow-hidden rounded-md border-2 ${
                    activeImg === i ? "border-orange-600" : "border-gray-200"
                  }`}
                >
                  <img src={fileUrl(img)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info + buy box */}
        <div>
          {product.brand && (
            <span className="text-xs font-semibold uppercase tracking-wide text-orange-600">
              {product.brand}
            </span>
          )}
          <h1 className="mt-1 font-display text-2xl font-bold text-gray-900 md:text-3xl" data-testid="product-title">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900" data-testid="product-price">
              {formatBRL(product.price)}
            </span>
            <span className="text-sm text-gray-500">/{product.unit}</span>
          </div>

          <div className="mt-2">
            {outOfStock ? (
              <span className="text-sm font-semibold text-red-600">Sem estoque</span>
            ) : (
              <span className="text-sm font-medium text-green-700">
                Em estoque · {product.stock} {product.unit} disponíveis
              </span>
            )}
          </div>

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-gray-600" data-testid="product-description">
            {product.description}
          </p>

          {/* buy box */}
          <div className="mt-6 rounded-md border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Quantidade</span>
              <div className="flex items-center rounded-md border border-gray-200">
                <button className="px-3 py-2 text-gray-600 hover:text-orange-600" onClick={() => setQty(Math.max(1, qty - 1))} data-testid="qty-decr">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-10 text-center font-semibold" data-testid="qty-value">{qty}</span>
                <button className="px-3 py-2 text-gray-600 hover:text-orange-600" onClick={() => setQty(qty + 1)} data-testid="qty-incr">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Button
                onClick={handleAdd}
                disabled={outOfStock}
                className="w-full gap-2 bg-orange-600 py-6 text-base hover:bg-orange-700"
                data-testid="pdp-add-to-cart"
              >
                <ShoppingCart className="h-5 w-5" /> Adicionar ao carrinho
              </Button>
              <a href={waLink(waText)} target="_blank" rel="noreferrer" data-testid="pdp-whatsapp">
                <Button variant="outline" className="w-full gap-2 border-[#25D366] py-6 text-base text-[#128C4A] hover:bg-[#25D366]/10">
                  <FaWhatsapp className="h-5 w-5 text-[#25D366]" /> Comprar pelo WhatsApp
                </Button>
              </a>
            </div>

            {/* CEP shipping calculator */}
            <div className="mt-5 border-t border-gray-100 pt-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Truck className="h-4 w-4 text-orange-600" /> Calcular frete e prazo
              </label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="Digite seu CEP"
                  maxLength={9}
                  data-testid="cep-input"
                />
                <Button onClick={calcShipping} disabled={calcLoading} variant="secondary" data-testid="cep-calc-button">
                  {calcLoading ? "..." : "Calcular"}
                </Button>
              </div>
              {shipping && (
                <ul className="mt-3 space-y-2" data-testid="shipping-results">
                  {shipping.options.map((o, i) => (
                    <li key={i} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                      <div>
                        <div className="font-medium text-gray-800">{o.label}</div>
                        <div className="text-xs text-gray-500">{o.days}</div>
                      </div>
                      <span className={`font-semibold ${o.free ? "text-green-600" : "text-gray-900"}`}>
                        {o.free ? "Grátis" : formatBRL(o.cost)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-green-600" /> Pagamento seguro</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Nota fiscal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
