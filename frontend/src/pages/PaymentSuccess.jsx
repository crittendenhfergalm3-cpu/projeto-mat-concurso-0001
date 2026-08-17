import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, formatBRL } from "@/lib/api";
import { useCart } from "@/context/CartContext";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { clear } = useCart();
  const [status, setStatus] = useState("checking");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const r = await api.get(`/payments/status/${sessionId}`);
        if (r.data.payment_status === "paid") {
          setStatus("paid");
          setOrder(r.data.order);
          clear();
          return;
        }
        if (r.data.status === "expired" || r.data.payment_status === "failed") {
          setStatus("failed");
          return;
        }
      } catch {
        /* keep polling */
      }
      if (attempts < 10) setTimeout(poll, 2000);
      else setStatus("timeout");
    };
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const downloads = (order?.items || []).filter((i) => i.download_url);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center" data-testid="payment-success-page">
      {status === "checking" && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600" />
          <h1 className="mt-4 font-display text-2xl font-bold">Confirmando seu pagamento...</h1>
          <p className="mt-2 text-slate-500">Aguarde um instante, não feche esta página.</p>
        </>
      )}
      {status === "paid" && (
        <>
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
          <h1 className="mt-4 font-display text-3xl font-bold text-slate-900">Pagamento confirmado!</h1>
          {order && (
            <p className="mt-2 text-slate-600">
              Pedido <strong>#{order.order_number}</strong> · Total <strong>{formatBRL(order.total)}</strong>
            </p>
          )}
          {downloads.length > 0 ? (
            <div className="mx-auto mt-6 max-w-md space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left">
              <p className="text-sm font-semibold text-emerald-800">Seus materiais estão prontos:</p>
              {downloads.map((i, idx) => (
                <a key={idx} href={i.download_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:underline">
                  <Download className="h-4 w-4" /> {i.name}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-slate-500">
              Enviamos o acesso ao seu material para o e-mail informado. Verifique também a caixa de spam.
            </p>
          )}
          <Link to="/apostilas">
            <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700">Ver mais materiais</Button>
          </Link>
        </>
      )}
      {(status === "failed" || status === "error" || status === "timeout") && (
        <>
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 font-display text-2xl font-bold">Não foi possível confirmar</h1>
          <p className="mt-2 text-slate-500">
            {status === "timeout"
              ? "O pagamento está demorando a confirmar. Verifique seu e-mail ou fale conosco."
              : "Houve um problema com o pagamento. Tente novamente."}
          </p>
          <Link to="/checkout">
            <Button variant="outline" className="mt-6">Voltar ao checkout</Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default PaymentSuccess;
