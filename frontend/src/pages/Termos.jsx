import { PageShell } from "@/components/PageShell";
import { BUSINESS } from "@/data/business";

const Termos = () => (
  <PageShell title="Termos de Uso" subtitle="Condições de uso da loja online">
    <p>
      Ao utilizar o site da <strong>{BUSINESS.name}</strong> ({BUSINESS.legalName}, CNPJ{" "}
      {BUSINESS.cnpj}), você concorda com os termos descritos abaixo.
    </p>

    <h2>1. Cadastro e pedidos</h2>
    <p>
      As informações fornecidas no checkout devem ser verdadeiras e completas. O cliente é
      responsável pela exatidão dos dados de contato e entrega.
    </p>

    <h2>2. Produtos e preços</h2>
    <p>
      Nos esforçamos para manter as informações de produtos, estoque e preços sempre corretas.
      Preços e disponibilidade podem ser alterados sem aviso prévio. Em caso de divergência,
      entraremos em contato antes de concluir o pedido.
    </p>

    <h2>3. Pagamentos</h2>
    <p>
      Os pagamentos online são processados pela Stripe com segurança. Também oferecemos a opção
      de finalizar a compra pelo WhatsApp, quando a negociação e o pagamento são combinados
      diretamente com a nossa equipe.
    </p>

    <h2>4. Entrega</h2>
    <p>
      Os prazos e valores de frete são informados no momento da compra, conforme o CEP de entrega.
      Consulte também a nossa <a href="/frete">Política de Entrega/Frete</a>.
    </p>

    <h2>5. Trocas e devoluções</h2>
    <p>
      As condições de troca e devolução estão descritas na página{" "}
      <a href="/trocas-e-devolucoes">Trocas e Devoluções</a>.
    </p>

    <h2>6. Propriedade intelectual</h2>
    <p>
      Todo o conteúdo do site (marca, textos e imagens) pertence à {BUSINESS.name} ou é utilizado
      mediante autorização, sendo vedada a reprodução sem consentimento.
    </p>

    <h2>7. Foro</h2>
    <p>
      Fica eleito o foro da comarca de {BUSINESS.address.city}/{BUSINESS.address.state} para
      dirimir eventuais controvérsias.
    </p>
  </PageShell>
);

export default Termos;
