import { Link } from "react-router-dom";
import { ShoppingCart, FileText, Video, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { fileUrl, formatBRL } from "@/lib/api";
import { toast } from "sonner";

const TYPE_META = {
  apostila: { label: "Apostila", icon: FileText, color: "bg-emerald-600" },
  curso: { label: "Curso", icon: Video, color: "bg-blue-700" },
  combo: { label: "Combo", icon: Layers, color: "bg-amber-600" },
};

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const meta = TYPE_META[product.type] || TYPE_META.apostila;
  const Icon = meta.icon;

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product, 1);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  return (
    <div
      data-testid={`product-card-${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <Link to={`/apostila/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={fileUrl(product.images?.[0])}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className={`absolute left-2 top-2 flex items-center gap-1 rounded ${meta.color} px-2 py-0.5 text-[11px] font-bold uppercase text-white`}>
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
        {product.featured && (
          <span className="absolute right-2 top-2 rounded bg-amber-400 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-900">
            Destaque
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {product.banca && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">
            Banca: {product.banca}
          </span>
        )}
        <Link to={`/apostila/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-900 hover:text-emerald-600">
            {product.name}
          </h3>
        </Link>
        <span className="mt-1 text-xs text-slate-500">{product.format}{product.pages ? ` · ${product.pages} págs` : ""}</span>
        <div className="mt-auto pt-3">
          <div className="text-lg font-extrabold text-slate-900">{formatBRL(product.price)}</div>
          <Button
            onClick={handleAdd}
            className="mt-3 w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            data-testid={`add-to-cart-${product.slug}`}
          >
            <ShoppingCart className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
