import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, Package, ClipboardList, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const links = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
];

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-600 font-display text-sm font-extrabold text-white">
            SJ
          </div>
          <span className="font-display text-sm font-bold text-gray-900">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={`admin-nav-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-3">
          <Link to="/" target="_blank" className="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
            <ExternalLink className="h-4 w-4" /> Ver loja
          </Link>
          <button onClick={handleLogout} data-testid="admin-logout" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Sair
          </button>
          <p className="mt-2 truncate px-3 text-xs text-gray-400">{user?.email}</p>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
