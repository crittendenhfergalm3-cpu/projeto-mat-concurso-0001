import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { api, formatBRL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const statusColor = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  novo: "bg-blue-100 text-blue-700",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/admin/orders").then((r) => setOrders(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-gray-900">Pedidos ({orders.length})</h1>
      {orders.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 py-16 text-center text-muted-foreground">
          <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2">Nenhum pedido ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-md border border-gray-200 bg-white p-5" data-testid={`order-${o.order_number}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="font-display font-bold text-gray-900">#{o.order_number}</div>
                  <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString("pt-BR")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColor[o.status] || "bg-gray-100 text-gray-700"}>{o.status}</Badge>
                  <Badge variant="outline">{o.method === "stripe" ? "Cartão" : "WhatsApp"}</Badge>
                </div>
              </div>
              <div className="grid gap-4 py-3 sm:grid-cols-2">
                <div className="text-sm">
                  <div className="font-semibold text-gray-800">{o.customer.name}</div>
                  <div className="text-gray-500">{o.customer.email}</div>
                  <div className="text-gray-500">{o.customer.phone}</div>
                  {o.customer.address && <div className="text-gray-500">{o.customer.address}</div>}
                </div>
                <ul className="space-y-1 text-sm">
                  {o.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="text-gray-600">{i.quantity}x {i.name}</span>
                      <span className="font-medium">{formatBRL(i.price * i.quantity)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between text-gray-500">
                    <span>Frete</span><span>{formatBRL(o.shipping_cost)}</span>
                  </li>
                  <li className="flex justify-between border-t border-gray-100 pt-1 font-bold">
                    <span>Total</span><span>{formatBRL(o.total)}</span>
                  </li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
