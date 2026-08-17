import { PageShell } from "@/components/PageShell";
import { BUSINESS } from "@/data/business";

const Reembolso = () => (
  <PageShell title="Reembolso e Direito de Arrependimento" subtitle="Sua compra protegida pelo Código de Defesa do Consumidor">
    <p>
      A <strong>{BUSINESS.name}</strong> respeita integralmente o Código de Defesa do Consumidor (CDC).
      Como nossos produtos são digitais, esta política explica como funciona o direito de arrependimento
      e o reembolso.
    </p>

    <h2>Direito de arrependimento (7 dias)</h2>
    <p>
      Conforme o <strong>art. 49 do CDC</strong>, você pode desistir da compra em até <strong>7 (sete)
      dias corridos</strong> a contar da data da aquisição do material, sem necessidade de justificativa.
      Nesse caso, o valor pago será <strong>integralmente reembolsado</strong>.
    </p>

    <h2>Como solicitar</h2>
    <ul>
      <li>Envie um e-mail para <strong>{BUSINESS.email}</strong> ou mensagem para o WhatsApp <strong>{BUSINESS.phone}</strong>.</li>
      <li>Informe o número do pedido e o e-mail utilizado na compra.</li>
      <li>Não é necessário justificar o motivo dentro do prazo de 7 dias.</li>
    </ul>

    <h2>Prazo do estorno</h2>
    <ul>
      <li><strong>Cartão de crédito:</strong> o estorno é solicitado imediatamente e aparece na fatura conforme o prazo da operadora (geralmente 1 a 2 faturas).</li>
      <li><strong>Outros meios:</strong> o reembolso é processado em até 10 dias úteis após a solicitação.</li>
    </ul>

    <h2>Após os 7 dias</h2>
    <p>
      Passado o prazo legal de arrependimento, por se tratar de conteúdo digital já disponibilizado,
      a devolução poderá ser analisada caso a caso — por exemplo, em situações de erro no material ou
      problema técnico de acesso não resolvido pelo suporte.
    </p>

    <p className="text-sm text-slate-400">
      Este documento não substitui a legislação vigente e deve ser interpretado em conjunto com o CDC.
    </p>
  </PageShell>
);

export default Reembolso;
