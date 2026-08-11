import { PageShell } from "@/components/PageShell";
import { BUSINESS } from "@/data/business";

const Trocas = () => (
  <PageShell title="Trocas e Devoluções" subtitle="Seus direitos como consumidor">
    <p>
      A <strong>{BUSINESS.name}</strong> segue o Código de Defesa do Consumidor (CDC). Confira as
      condições para trocas e devoluções.
    </p>

    <h2>1. Direito de arrependimento (compras online)</h2>
    <p>
      Você pode desistir da compra em até <strong>7 dias corridos</strong> após o recebimento do
      produto, conforme o Art. 49 do CDC. O produto deve estar sem uso, na embalagem original e
      acompanhado da nota fiscal.
    </p>

    <h2>2. Produtos com defeito</h2>
    <p>
      Em caso de defeito de fabricação, entre em contato em até 90 dias (bens duráveis) para
      avaliarmos a troca ou o reparo, conforme o Art. 26 do CDC.
    </p>

    <h2>3. Como solicitar</h2>
    <ul>
      <li>Entre em contato pelo e-mail <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> ou pelo WhatsApp {BUSINESS.phone}.</li>
      <li>Informe o número do pedido e o motivo da troca/devolução.</li>
      <li>Nossa equipe orientará sobre o envio ou a coleta do produto.</li>
    </ul>

    <h2>4. Reembolso</h2>
    <p>
      Após o recebimento e a análise do produto, o reembolso é realizado pelo mesmo meio de
      pagamento em até 10 dias úteis. Compras via cartão são estornadas pela Stripe.
    </p>

    <h2>5. Itens não elegíveis</h2>
    <p>
      Produtos cortados sob medida, misturados ou usados podem não ser elegíveis para devolução,
      salvo em caso de defeito.
    </p>
  </PageShell>
);

export default Trocas;
