import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, DollarSign, CalendarDays, Newspaper } from "lucide-react";
import { api, formatBRL } from "@/lib/api";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-md border border-slate-200 bg-white p-5" data-testid={`stat-${label}`}>
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="mt-3 font-display text-2xl font-bold text-slate-900">{value}</div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-slate-900">Painel</h1>
      {!stats ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={DollarSign} label="Faturamento (pago)" value={formatBRL(stats.revenue)} color="bg-emerald-100 text-emerald-700" />
          <StatCard icon={ClipboardList} label="Pedidos" value={stats.total_orders} color="bg-blue-100 text-blue-700" />
          <StatCard icon={BookOpen} label="Materiais ativos" value={stats.total_products} color="bg-amber-100 text-amber-700" />
          <StatCard icon={CalendarDays} label="Concursos" value={stats.total_concursos} color="bg-indigo-100 text-indigo-700" />
          <StatCard icon={Newspaper} label="Notícias" value={stats.total_noticias} color="bg-rose-100 text-rose-700" />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
