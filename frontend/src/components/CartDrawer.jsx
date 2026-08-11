import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingCart, Lock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { fileUrl, formatBRL } from "@/lib/api";

const CartDrawer = () => {
  const { items, open, setOpen, updateQty, removeItem, subtotal, count } = useCart();
  const navigate = useNavigate();

  const goCheckout = () => {
    setOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-md" data-testid="cart-drawer">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingCart className="h-5 w-5 text-orange-600" />
            Seu carrinho ({count})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 text-gray-300" />
            <p>Seu carrinho está vazio.</p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Continuar comprando
            </Button>
          </div>
        ) : (
          <>
            <div className="-mx-6 flex-1 overflow-y-auto px-6 py-4">
              <ul className="space-y-4">
                {items.map((i) => (
                  <li key={i.product_id} className="flex gap-3" data-testid={`cart-item-${i.product_id}`}>
                    <img
                      src={fileUrl(i.image)}
                      alt={i.name}
                      className="h-16 w-16 shrink-0 rounded-md border border-gray-200 object-cover"
                    />
                    <div className="flex flex-1 flex-col">
                      <Link
                        to={`/produto/${i.slug}`}
                        onClick={() => setOpen(false)}
                        className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-orange-600"
                      >
                        {i.name}
                      </Link>
                      <span className="text-sm font-bold text-orange-600">{formatBRL(i.price)}</span>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center rounded-md border border-gray-200">
                          <button
                            className="px-2 py-1 text-gray-600 hover:text-orange-600"
                            onClick={() => updateQty(i.product_id, i.quantity - 1)}
                            data-testid={`cart-decr-${i.product_id}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-8 text-center text-sm font-medium">{i.quantity}</span>
                          <button
                            className="px-2 py-1 text-gray-600 hover:text-orange-600"
                            onClick={() => updateQty(i.product_id, i.quantity + 1)}
                            data-testid={`cart-incr-${i.product_id}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          className="ml-auto text-gray-400 hover:text-red-600"
                          onClick={() => removeItem(i.product_id)}
                          data-testid={`cart-remove-${i.product_id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <SheetFooter className="flex-col gap-3 sm:flex-col">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span data-testid="cart-subtotal">{formatBRL(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Frete calculado no checkout.</p>
              <Button
                onClick={goCheckout}
                className="w-full bg-orange-600 py-6 text-base hover:bg-orange-700"
                data-testid="cart-checkout-button"
              >
                <Lock className="mr-2 h-4 w-4" /> Finalizar compra
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
