import { Link } from "react-router-dom";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { fileUrl, formatBRL } from "@/lib/api";
import { toast } from "sonner";

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const outOfStock = product.stock <= 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (outOfStock) return;
    addItem(product, 1);
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  return (
    <div
      data-testid={`product-card-${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <Link to={`/produto/${product.slug}`} className="relative block aspect-square overflow-hidden bg-gray-100">
        <img
          src={fileUrl(product.images?.[0])}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.featured && (
          <span className="absolute left-2 top-2 rounded bg-yellow-500 px-2 py-0.5 text-[11px] font-bold uppercase text-gray-900">
            Destaque
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded bg-gray-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">
            Sem estoque
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {product.brand}
          </span>
        )}
        <Link to={`/produto/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-gray-900 hover:text-orange-600">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-gray-900">{formatBRL(product.price)}</span>
            <span className="text-xs text-gray-500">/{product.unit}</span>
          </div>
          <Button
            onClick={handleAdd}
            disabled={outOfStock}
            className="mt-3 w-full gap-2 bg-orange-600 hover:bg-orange-700"
            data-testid={`add-to-cart-${product.slug}`}
          >
            <ShoppingCart className="h-4 w-4" />
            {outOfStock ? "Indisponível" : "Adicionar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
