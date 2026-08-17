import { useState } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { Search, ShoppingCart, Menu, MapPin } from "lucide-react";
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
import { LogoMark } from "@/components/Logo";

const NAV = [
  { to: "/", label: "Início", end: true },
  { to: "/apostilas", label: "Apostilas & Cursos" },
  { to: "/concursos", label: "Concursos" },
  { to: "/noticias", label: "Notícias" },
  { to: "/bancas", label: "Bancas" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
];

const Header = () => {
  const { count, setOpen } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/apostilas?search=${encodeURIComponent(q)}`);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* top bar */}
      <div className="bg-slate-900 text-slate-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            {BUSINESS.address.city}/{BUSINESS.address.state} · {BUSINESS.hours}
          </span>
          <a
            href={waLink("Olá! Vim pelo site TÔ APROVADO e gostaria de tirar uma dúvida.")}
            target="_blank"
            rel="noreferrer"
            data-testid="topbar-whatsapp"
            className="flex items-center gap-1.5 font-medium text-white hover:text-emerald-400"
          >
            <FaWhatsapp className="h-4 w-4 text-[#25D366]" /> {BUSINESS.phone}
          </a>
        </div>
      </div>

      {/* main bar */}
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" data-testid="logo-link" className="flex items-center gap-2.5">
            <LogoMark className="h-11 w-11" />
            <div className="hidden leading-none sm:block">
              <div className="font-display text-lg font-extrabold tracking-tight text-slate-900">
                TÔ APROVADO
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Concursos Públicos
              </div>
            </div>
          </Link>

          <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              data-testid="search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busque por INSS, Polícia Federal, banca, apostila..."
              className="pl-9 focus-visible:ring-emerald-500"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Button
              data-testid="cart-button"
              variant="outline"
              onClick={() => setOpen(true)}
              className="relative gap-2 border-slate-300"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Carrinho</span>
              {count > 0 && (
                <span
                  data-testid="cart-count"
                  className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-bold text-white"
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
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar materiais..."
                    className="pl-9"
                  />
                </form>
                <nav className="flex flex-col gap-1">
                  {NAV.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      end={l.end}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {l.label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* main nav (desktop) */}
        <nav className="hidden border-t border-slate-100 bg-white md:block">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1 px-4">
            {NAV.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                data-testid={`nav-${l.label.split(" ")[0].toLowerCase()}`}
                className={({ isActive }) =>
                  `border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-600 hover:border-emerald-600 hover:text-emerald-600"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
