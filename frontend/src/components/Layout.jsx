import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { waLink } from "@/data/business";
import { FaWhatsapp } from "react-icons/fa";

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <a
        href={waLink("Olá! Vim pelo site e gostaria de tirar uma dúvida.")}
        target="_blank"
        rel="noreferrer"
        data-testid="floating-whatsapp"
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform duration-200 hover:scale-110"
        aria-label="Falar no WhatsApp"
      >
        <FaWhatsapp className="h-7 w-7 text-white" />
      </a>
    </div>
  );
};

export default Layout;
