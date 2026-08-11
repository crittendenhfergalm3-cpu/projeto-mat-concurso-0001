import { useEffect, useState } from "react";
import { Package, ClipboardList, DollarSign, Clock } from "lucide-react";
import { api, formatBRL } from "@/lib/api";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="rounded-md border border-gray-200 bg-white p-5" data-testid={`stat-${label}`}>
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="mt-3 font-display text-2xl font-bold text-gray-900">{value}</div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900">Painel</h1>
      {!stats ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={DollarSign} label="Faturamento (pago)" value={formatBRL(stats.revenue)} color="bg-green-100 text-green-700" />
          <StatCard icon={ClipboardList} label="Pedidos" value={stats.total_orders} color="bg-blue-100 text-blue-700" />
          <StatCard icon={Clock} label="Pendentes" value={stats.pending} color="bg-yellow-100 text-yellow-700" />
          <StatCard icon={Package} label="Produtos ativos" value={stats.total_products} color="bg-orange-100 text-orange-700" />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
