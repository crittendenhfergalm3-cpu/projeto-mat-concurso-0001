import { PageShell } from "@/components/PageShell";
import { BUSINESS, fullAddress } from "@/data/business";

const Termos = () => (
  <PageShell title="Termos de Uso" subtitle="Condições de uso do site e dos materiais">
    <p>
      Ao acessar o site da <strong>{BUSINESS.name}</strong> ({BUSINESS.legalName}, CNPJ {BUSINESS.cnpj})
      e adquirir nossos produtos, você concorda com os termos descritos abaixo.
    </p>

    <h2>1. Objeto</h2>
    <p>
      A TÔ APROVADO comercializa materiais digitais de estudo (apostilas em PDF e cursos em videoaulas)
      voltados à preparação para concursos públicos. As informações sobre concursos e bancas têm caráter
      informativo e não substituem os editais e canais oficiais dos órgãos.
    </p>

    <h2>2. Licença de uso do material</h2>
    <ul>
      <li>Os materiais são de uso <strong>pessoal e intransferível</strong> do comprador.</li>
      <li>É proibida a reprodução, revenda, compartilhamento ou distribuição, total ou parcial, do conteúdo.</li>
      <li>O conteúdo é protegido por direitos autorais (Lei nº 9.610/98).</li>
    </ul>

    <h2>3. Pagamentos</h2>
    <p>
      Os pagamentos com cartão são processados de forma segura pela <strong>Stripe</strong>. A TÔ APROVADO
      não armazena os dados do seu cartão. Também é possível finalizar a compra via WhatsApp.
    </p>

    <h2>4. Entrega e reembolso</h2>
    <p>
      Consulte as páginas <strong>Entrega dos Materiais</strong> e <strong>Reembolso e Arrependimento</strong>
      para detalhes sobre prazos e o direito de arrependimento de 7 dias previsto no CDC.
    </p>

    <h2>5. Responsabilidades</h2>
    <p>
      A aprovação em concursos depende de diversos fatores individuais. A TÔ APROVADO oferece material de
      apoio ao estudo, mas não garante aprovação. Não temos vínculo com bancas ou órgãos públicos.
    </p>

    <h2>6. Contato</h2>
    <p>
      Dúvidas sobre estes termos podem ser enviadas para <strong>{BUSINESS.email}</strong>.<br />
      {fullAddress}
    </p>
  </PageShell>
);

export default Termos;
