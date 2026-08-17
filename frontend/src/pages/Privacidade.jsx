import { PageShell } from "@/components/PageShell";
import { BUSINESS } from "@/data/business";

const Privacidade = () => (
  <PageShell title="Política de Privacidade" subtitle="Como tratamos os seus dados (LGPD)">
    <p>
      A <strong>{BUSINESS.name}</strong> ({BUSINESS.legalName}, CNPJ {BUSINESS.cnpj}) leva a sua
      privacidade a sério e trata os dados pessoais de acordo com a Lei Geral de Proteção de Dados
      (Lei nº 13.709/2018 - LGPD).
    </p>

    <h2>1. Dados que coletamos</h2>
    <ul>
      <li><strong>Dados de cadastro/compra:</strong> nome, e-mail, telefone e, opcionalmente, CPF.</li>
      <li><strong>Dados de navegação:</strong> informações técnicas como cookies e páginas visitadas.</li>
    </ul>

    <h2>2. Como usamos</h2>
    <ul>
      <li>Processar pedidos e entregar os materiais adquiridos.</li>
      <li>Enviar comunicações sobre a sua compra e suporte ao aluno.</li>
      <li>Melhorar a experiência no site e cumprir obrigações legais.</li>
    </ul>

    <h2>3. Pagamentos</h2>
    <p>
      Os dados de pagamento com cartão são processados diretamente pela <strong>Stripe</strong>, que
      possui certificação de segurança PCI-DSS. Não temos acesso nem armazenamos os dados do seu cartão.
    </p>

    <h2>4. Compartilhamento</h2>
    <p>
      Não vendemos seus dados. Compartilhamos informações apenas com parceiros necessários à operação
      (ex.: processador de pagamento e serviço de e-mail) e quando exigido por lei.
    </p>

    <h2>5. Seus direitos</h2>
    <p>
      Você pode solicitar acesso, correção ou exclusão dos seus dados, bem como revogar consentimentos,
      escrevendo para <strong>{BUSINESS.email}</strong>.
    </p>

    <h2>6. Cookies</h2>
    <p>
      Utilizamos cookies para o funcionamento do site e análise de uso. Você pode gerenciá-los nas
      configurações do seu navegador.
    </p>
  </PageShell>
);

export default Privacidade;
