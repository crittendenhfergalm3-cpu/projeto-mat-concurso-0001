import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentCancel = () => (
  <div className="mx-auto max-w-xl px-4 py-20 text-center" data-testid="payment-cancel-page">
    <XCircle className="mx-auto h-16 w-16 text-gray-400" />
    <h1 className="mt-4 font-display text-2xl font-bold">Pagamento cancelado</h1>
    <p className="mt-2 text-gray-500">
      Você cancelou o pagamento. Seus itens continuam no carrinho.
    </p>
    <Link to="/checkout">
      <Button className="mt-6 bg-orange-600 hover:bg-orange-700">Tentar novamente</Button>
    </Link>
  </div>
);

export default PaymentCancel;
