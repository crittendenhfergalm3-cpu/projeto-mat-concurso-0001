import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle, Package } from "lucide-react";
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

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center" data-testid="payment-success-page">
      {status === "checking" && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-600" />
          <h1 className="mt-4 font-display text-2xl font-bold">Confirmando seu pagamento...</h1>
          <p className="mt-2 text-gray-500">Aguarde um instante, não feche esta página.</p>
        </>
      )}
      {status === "paid" && (
        <>
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
          <h1 className="mt-4 font-display text-3xl font-bold text-gray-900">Pagamento confirmado!</h1>
          {order && (
            <p className="mt-2 text-gray-600">
              Pedido <strong>#{order.order_number}</strong> · Total{" "}
              <strong>{formatBRL(order.total)}</strong>
            </p>
          )}
          <p className="mt-2 text-gray-500">
            Enviamos a confirmação para o seu e-mail. Em breve entraremos em contato para combinar a entrega.
          </p>
          <Link to="/produtos">
            <Button className="mt-6 bg-orange-600 hover:bg-orange-700">Continuar comprando</Button>
          </Link>
        </>
      )}
      {(status === "failed" || status === "error" || status === "timeout") && (
        <>
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 font-display text-2xl font-bold">Não foi possível confirmar</h1>
          <p className="mt-2 text-gray-500">
            {status === "timeout"
              ? "O pagamento está demorando a confirmar. Verifique seu e-mail ou fale conosco."
              : "Houve um problema com o pagamento. Tente novamente."}
          </p>
          <Link to="/checkout">
            <Button variant="outline" className="mt-6 gap-2">
              <Package className="h-4 w-4" /> Voltar ao checkout
            </Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default PaymentSuccess;
