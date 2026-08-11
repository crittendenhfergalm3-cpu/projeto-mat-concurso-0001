import { PageShell } from "@/components/PageShell";
import { BUSINESS } from "@/data/business";

const Frete = () => (
  <PageShell title="Política de Entrega e Frete" subtitle="Prazos, regiões e valores">
    <p>
      A <strong>{BUSINESS.name}</strong> realiza entregas em {BUSINESS.address.city} e região.
      O valor e o prazo do frete são calculados automaticamente no site a partir do seu CEP.
    </p>

    <h2>1. Entrega local (São Luís e região)</h2>
    <ul>
      <li>Prazo estimado: 1 a 2 dias úteis.</li>
      <li>Frete grátis para compras acima de R$ 300,00.</li>
      <li>Opção de retirada gratuita na loja (Parque Atlântico).</li>
    </ul>

    <h2>2. Outras regiões</h2>
    <ul>
      <li>Enviamos via transportadora com prazo de 5 a 10 dias úteis (padrão) ou 3 a 5 dias úteis (expressa).</li>
      <li>O valor é calculado conforme o CEP e o volume do pedido.</li>
    </ul>

    <h2>3. Prazo de postagem</h2>
    <p>
      Pedidos aprovados são separados e despachados em até 2 dias úteis. O prazo de entrega começa
      a contar após a confirmação do pagamento.
    </p>

    <h2>4. Recebimento</h2>
    <p>
      Confira o produto no ato da entrega. Havendo qualquer avaria no transporte, recuse o
      recebimento ou registre a ocorrência e entre em contato conosco.
    </p>

    <h2>5. Dúvidas</h2>
    <p>
      Fale com a gente pelo WhatsApp {BUSINESS.phone} ou pelo e-mail{" "}
      <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
    </p>
  </PageShell>
);

export default Frete;
