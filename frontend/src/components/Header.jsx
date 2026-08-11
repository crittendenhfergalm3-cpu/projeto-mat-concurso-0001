import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Menu, Phone, MapPin } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { BUSINESS, waLink } from "@/data/business";
import { api } from "@/lib/api";

const Header = () => {
  const { count, setOpen } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cats, setCats] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data)).catch(() => {});
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/produtos?search=${encodeURIComponent(q)}`);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* top bar */}
      <div className="bg-gray-900 text-gray-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-orange-500" />
            {BUSINESS.address.city}/{BUSINESS.address.state} · {BUSINESS.hours}
          </span>
          <a
            href={waLink("Olá! Vim pelo site e gostaria de um orçamento.")}
            target="_blank"
            rel="noreferrer"
            data-testid="topbar-whatsapp"
            className="flex items-center gap-1.5 font-medium text-white hover:text-orange-400"
          >
            <FaWhatsapp className="h-4 w-4 text-[#25D366]" /> {BUSINESS.phone}
          </a>
        </div>
      </div>

      {/* main bar */}
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" data-testid="logo-link" className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-orange-600 font-display text-xl font-extrabold text-white">
              SJ
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="font-display text-base font-bold text-gray-900">São José</div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Material de Construção
              </div>
            </div>
          </Link>

          <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              data-testid="search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cimento, tijolo, ferramenta, tinta..."
              className="pl-9 focus-visible:ring-orange-500"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Button
              data-testid="cart-button"
              variant="outline"
              onClick={() => setOpen(true)}
              className="relative gap-2 border-gray-300"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Carrinho</span>
              {count > 0 && (
                <span
                  data-testid="cart-count"
                  className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-xs font-bold text-white"
                >
                  {count}
                </span>
              )}
            </Button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-button">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <form onSubmit={submitSearch} className="relative mb-5 mt-6">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar produtos..."
                    className="pl-9"
                  />
                </form>
                <nav className="flex flex-col gap-1">
                  {cats.map((c) => (
                    <Link
                      key={c.slug}
                      to={`/categoria/${c.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                    >
                      {c.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* categories nav (desktop) */}
        <nav className="hidden border-t border-gray-100 bg-white md:block">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1 px-4">
            <Link
              to="/produtos"
              className="border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-gray-900 hover:border-orange-600 hover:text-orange-600"
              data-testid="nav-all-products"
            >
              Todos os produtos
            </Link>
            {cats.map((c) => (
              <Link
                key={c.slug}
                to={`/categoria/${c.slug}`}
                data-testid={`nav-cat-${c.slug}`}
                className="border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-orange-600 hover:text-orange-600"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
