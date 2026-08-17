import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import ProductDetail from "@/pages/ProductDetail";
import Concursos from "@/pages/Concursos";
import Noticias from "@/pages/Noticias";
import NoticiaDetail from "@/pages/NoticiaDetail";
import Bancas from "@/pages/Bancas";
import Checkout from "@/pages/Checkout";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import Sobre from "@/pages/Sobre";
import Contato from "@/pages/Contato";
import Privacidade from "@/pages/Privacidade";
import Termos from "@/pages/Termos";
import Reembolso from "@/pages/Trocas";
import Entrega from "@/pages/Frete";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminConcursos from "@/pages/admin/AdminConcursos";
import AdminNoticias from "@/pages/admin/AdminNoticias";
import AdminOrders from "@/pages/admin/AdminOrders";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster position="top-center" richColors />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/apostilas" element={<Catalog />} />
                <Route path="/area/:slug" element={<Catalog />} />
                <Route path="/apostila/:slug" element={<ProductDetail />} />
                <Route path="/concursos" element={<Concursos />} />
                <Route path="/noticias" element={<Noticias />} />
                <Route path="/noticias/:slug" element={<NoticiaDetail />} />
                <Route path="/bancas" element={<Bancas />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/pagamento/sucesso" element={<PaymentSuccess />} />
                <Route path="/pagamento/cancelado" element={<PaymentCancel />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/politica-de-privacidade" element={<Privacidade />} />
                <Route path="/termos" element={<Termos />} />
                <Route path="/reembolso" element={<Reembolso />} />
                <Route path="/entrega" element={<Entrega />} />
              </Route>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="materiais" element={<AdminProducts />} />
                <Route path="concursos" element={<AdminConcursos />} />
                <Route path="noticias" element={<AdminNoticias />} />
                <Route path="pedidos" element={<AdminOrders />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
