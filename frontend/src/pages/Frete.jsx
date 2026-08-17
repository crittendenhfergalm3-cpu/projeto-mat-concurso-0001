import { PageShell } from "@/components/PageShell";
import { BUSINESS } from "@/data/business";

const Entrega = () => (
  <PageShell title="Entrega dos Materiais" subtitle="Como você recebe seu conteúdo digital">
    <p>
      Todos os produtos vendidos pela <strong>{BUSINESS.name}</strong> são <strong>digitais</strong>
      (apostilas em PDF e cursos em videoaulas). Não há envio de materiais físicos e, portanto,
      <strong> não há cobrança de frete</strong>.
    </p>

    <h2>Prazo de entrega</h2>
    <ul>
      <li><strong>Pagamento por cartão (Stripe):</strong> o acesso é liberado imediatamente após a confirmação do pagamento, geralmente em poucos minutos.</li>
      <li><strong>Compra pelo WhatsApp:</strong> após a confirmação do pagamento combinado com nossa equipe, o material é enviado em até 24 horas úteis.</li>
    </ul>

    <h2>Como você recebe</h2>
    <ul>
      <li>Um link de acesso/download é exibido na tela de confirmação da compra.</li>
      <li>Também enviamos o acesso para o <strong>e-mail cadastrado</strong> no checkout. Verifique a caixa de entrada e a pasta de spam.</li>
    </ul>

    <h2>Não recebeu?</h2>
    <p>
      Se o material não chegar no prazo informado, entre em contato pelo e-mail{" "}
      <strong>{BUSINESS.email}</strong> ou pelo WhatsApp <strong>{BUSINESS.phone}</strong> informando o
      número do pedido. Resolveremos o mais rápido possível.
    </p>
  </PageShell>
);

export default Entrega;
