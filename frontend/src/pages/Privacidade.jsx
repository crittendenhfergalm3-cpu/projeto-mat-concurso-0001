import { PageShell } from "@/components/PageShell";
import { BUSINESS, fullAddress } from "@/data/business";

const Privacidade = () => (
  <PageShell title="Política de Privacidade" subtitle="Última atualização: 2026">
    <p>
      A <strong>{BUSINESS.name}</strong> ({BUSINESS.legalName}, CNPJ {BUSINESS.cnpj}) respeita a
      sua privacidade e está comprometida em proteger os dados pessoais dos seus clientes,
      em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
    </p>

    <h2>1. Dados que coletamos</h2>
    <ul>
      <li>Dados de identificação: nome, e-mail e telefone.</li>
      <li>Dados de entrega: CEP e endereço.</li>
      <li>Dados de pagamento processados de forma segura pela Stripe (não armazenamos dados de cartão).</li>
      <li>Dados de navegação, como cookies e páginas visitadas.</li>
    </ul>

    <h2>2. Como usamos os dados</h2>
    <ul>
      <li>Processar e entregar pedidos.</li>
      <li>Enviar confirmações e comunicações sobre a sua compra.</li>
      <li>Prestar atendimento e suporte.</li>
      <li>Melhorar a experiência de navegação na loja.</li>
    </ul>

    <h2>3. Compartilhamento</h2>
    <p>
      Não vendemos seus dados. Compartilhamos informações apenas com parceiros essenciais à
      operação (ex.: processador de pagamento Stripe e transportadoras), sempre no limite
      necessário para concluir o seu pedido.
    </p>

    <h2>4. Segurança</h2>
    <p>
      Utilizamos certificado SSL (https) e boas práticas de segurança para proteger seus dados
      durante a navegação e o pagamento.
    </p>

    <h2>5. Seus direitos</h2>
    <p>
      Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo
      e-mail <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
    </p>

    <h2>6. Contato do controlador</h2>
    <p>{BUSINESS.legalName} — {fullAddress} — {BUSINESS.email}</p>
  </PageShell>
);

export default Privacidade;
