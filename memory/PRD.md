# PRD — São José Material de Construção (E-commerce)

## Problema original
Loja de material de construção online, site próprio e legítimo, aprovável no Google Ads (sem suspensão por phishing/violação). Loja real: SAO JOSE MATERIAL DE CONSTRUCAO LTDA - ME, CNPJ 60.219.119/0001-81, São Luís/MA.

## Personas
- Consumidor final em obra/reforma
- Pequenos empreiteiros e pedreiros
- Compradores locais buscando entrega rápida

## Arquitetura
- Frontend: React (CRA) + Tailwind + Shadcn UI. Rotas em App.js. Contextos: CartContext (localStorage), AuthContext (JWT Bearer em localStorage `sj_token`).
- Backend: FastAPI (server.py), todas rotas com prefixo /api. MongoDB (motor).
- Integrações: Stripe (claimable sandbox, moeda BRL, checkout online), Resend gerenciado (e-mail de confirmação), Object Storage Emergent (upload de fotos), JWT auth (bcrypt) para admin.

## Requisitos core (estáticos)
- Elementos Google Ads: Sobre, Contato (tel/email/endereço), CNPJ+Razão Social no rodapé, Privacidade, Termos, Trocas, Frete, SSL, selos de pagamento.
- Catálogo por categoria, página de produto, carrinho, checkout (Stripe + WhatsApp), busca/filtros, frete por CEP, painel admin com login.

## Implementado (2026-06)
- Catálogo com 8 categorias e ~28 produtos seedados (cimento, tijolo, hidráulica, elétrica, tintas, ferramentas, pisos, ferragens).
- Home (hero, categorias, destaques, trust strip), catálogo com filtro/busca/ordenação, página de produto com galeria, calculadora de frete por CEP, add-to-cart e botão WhatsApp.
- Carrinho drawer (Shadcn Sheet), checkout com dados + frete + pagamento Stripe OU WhatsApp.
- Pagamento Stripe: create-session (BRL), status polling, webhook, e-mail de confirmação via Resend ao pagar.
- Pedido WhatsApp: cria pedido e gera mensagem/link wa.me.
- 6 páginas institucionais + rodapé com CNPJ/Razão Social e selos.
- Admin protegido (JWT): dashboard (stats), CRUD de produtos com upload de imagem, listagem de pedidos.
- Testado: backend 24/24 e frontend 100% (iteration_1).

## Credenciais
- Admin: smart-fox387-ded9dd06@darkemail.school / SaoJose@2026 (ver /app/memory/test_credentials.md)

## Backlog / próximos (P1/P2)
- P1: Domínio próprio .com.br + deploy (SSL) e verificação de anunciante no Google Ads.
- P1: Gestão de status de pedido no admin (marcar enviado/entregue).
- P2: Cupons/promoções, avaliações de produto, cálculo de frete real (Correios/Melhor Envio).
- P2: Rate limiting/brute-force no login para produção.
- P2: E-mail de aviso ao lojista em novos pedidos.
