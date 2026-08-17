import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  Download,
  ShieldCheck,
  Lock,
  FileText,
  ChevronRight,
  BookOpen,
  User,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { api, fileUrl, formatBRL } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { waLink } from "@/data/business";
import { toast } from "sonner";

const TYPE_LABEL = { apostila: "Apostila", curso: "Curso", combo: "Combo" };

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    api
      .get(`/products/${slug}`)
      .then((r) => setProduct(r.data))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound)
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 font-display text-2xl font-bold">Material não encontrado</h1>
        <Link to="/apostilas" className="mt-4 inline-block text-emerald-600 hover:underline">
          Voltar ao catálogo
        </Link>
      </div>
    );

  if (!product) return <div className="py-24 text-center text-muted-foreground">Carregando...</div>;

  const handleAdd = () => {
    addItem(product, 1);
    toast.success("Material adicionado ao carrinho");
  };

  const waText = `Olá! Tenho interesse no material *${product.name}* (${formatBRL(product.price)}). Pode me ajudar?`;

  const specs = [
    { icon: FileText, label: "Formato", value: product.format },
    product.pages ? { icon: BookOpen, label: "Páginas", value: `${product.pages}` } : null,
    product.banca ? { icon: ShieldCheck, label: "Banca", value: product.banca } : null,
    product.author ? { icon: User, label: "Autor", value: product.author } : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1 text-xs text-slate-500">
        <Link to="/" className="hover:text-emerald-600">Início</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/area/${product.category}`} className="hover:text-emerald-600">{product.category}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img
              src={fileUrl(product.images?.[0])}
              alt={product.name}
              className="aspect-[4/3] w-full object-cover"
              data-testid="product-main-image"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold uppercase text-white">
              {TYPE_LABEL[product.type] || "Material"}
            </span>
            {product.banca && (
              <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">Banca: {product.banca}</span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 md:text-3xl" data-testid="product-title">
            {product.name}
          </h1>

          <div className="mt-4 text-3xl font-extrabold text-slate-900" data-testid="product-price">
            {formatBRL(product.price)}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Download className="h-4 w-4" /> Conteúdo digital · acesso imediato após o pagamento
          </p>

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-600" data-testid="product-description">
            {product.description}
          </p>

          {specs.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {specs.map((s, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-3">
                  <s.icon className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase text-slate-400">{s.label}</div>
                    <div className="truncate text-sm font-semibold text-slate-800">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleAdd}
                className="w-full gap-2 bg-emerald-600 py-6 text-base hover:bg-emerald-700"
                data-testid="pdp-add-to-cart"
              >
                <ShoppingCart className="h-5 w-5" /> Adicionar ao carrinho
              </Button>
              <a href={waLink(waText)} target="_blank" rel="noreferrer" data-testid="pdp-whatsapp">
                <Button variant="outline" className="w-full gap-2 border-[#25D366] py-6 text-base text-[#128C4A] hover:bg-[#25D366]/10">
                  <FaWhatsapp className="h-5 w-5 text-[#25D366]" /> Tirar dúvida no WhatsApp
                </Button>
              </a>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-emerald-600" /> Pagamento seguro</span>
              <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5 text-emerald-600" /> Acesso imediato</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
