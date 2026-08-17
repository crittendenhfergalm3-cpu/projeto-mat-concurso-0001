# PRD — TO APROVADO] CONCURSOS PÚBLICOS

## Visão geral
Plataforma (React + FastAPI + MongoDB) de estudos e **venda de conteúdo digital** (apostilas em PDF e cursos em videoaulas) para **concursos públicos do Brasil**. Inclui seções informativas (Concursos, Notícias, Bancas) e é construída para ser **aprovável no Google Ads** (dados reais da empresa + páginas legais + checkout seguro).

Projeto voltado a estudos e venda de conteúdo (apostilas/cursos) para concursos públicos. Idioma: pt-BR.

## Dados da empresa (Google Ads compliance)
- Razão social: TO APROVADO CURSOS PARA CONCURSOS PUBLICOS LTDA - ME
- Nome fantasia: TO APROVADO] CONCURSOS PÚBLICOS
- CNPJ: 37.380.166/0001-90 · Fundada 10/06/2020
- Endereço: R. Henri Dunant, 1066 - Apt 1403, Santo Amaro, São Paulo/SP - CEP 04709-111
- Telefone/WhatsApp: (11) 3525-0800 · E-mail: contato@toaprovado.com

## Stack / Arquitetura
- Frontend: React, Tailwind, Shadcn UI, React Router, Context (Cart/Auth). Tema: verde esmeralda ("aprovado") + dourado + navy.
- Backend: FastAPI + Motor (MongoDB), JWT auth, Stripe, upload (object storage com fallback local em backend/uploads).
- Coleções: users, categories, products, concursos, noticias, orders, payment_transactions, files.

## Funcionalidades implementadas (jun/2026)
- Catálogo de apostilas/cursos com áreas, tipo (apostila/curso/combo), banca, formato, páginas, autor; busca, ordenação, filtro por tipo e por área.
- Página de produto digital (sem frete/estoque) + add ao carrinho + WhatsApp.
- Checkout duplo: Stripe (cartão, chave de teste no .env) e WhatsApp. Entrega digital (link/e-mail após pagamento).
- Concursos: listagem com status (Abertas/Edital/Previsto/Encerrado), busca e filtro. CRUD no admin.
- Notícias: listagem + detalhe. CRUD no admin.
- Bancas: perfis (CEBRASPE, FGV, FCC, VUNESP, CESGRANRIO, IBFC) — dados estáticos em data/bancas.js.
- Páginas legais: Sobre, Contato, Política de Privacidade (LGPD), Termos, Reembolso/Arrependimento (CDC 7 dias), Entrega dos Materiais.
- Painel Admin (JWT): Dashboard (faturamento, pedidos, materiais, concursos, notícias), CRUD de Materiais/Concursos/Notícias, lista de Pedidos, upload de imagens.
- Seed automático no startup: 8 áreas, 12 materiais, 8 concursos, 4 notícias, admin.

## Credenciais Admin
donatello@gmail.com / Seinao10@@ (definidas em backend/.env; ver /app/memory/test_credentials.md)

## Endpoints principais
- POST /api/auth/login, GET /api/auth/me
- GET /api/categories
- GET/POST/PUT/DELETE /api/products (+ GET /api/products/{slug})
- GET/POST/PUT/DELETE /api/concursos
- GET/POST/PUT/DELETE /api/noticias (+ GET /api/noticias/{slug})
- POST /api/checkout/create-session, GET /api/payments/status/{id}, POST /api/stripe/webhook
- POST /api/checkout/whatsapp
- GET /api/admin/orders, GET /api/admin/stats, POST /api/admin/upload, GET /api/files/{path}

## Status
- Testado: backend 35/35 pytest + fluxos frontend (iteration_3.json). Sem issues.
- 3rd party: Stripe (chave de teste no .env), WhatsApp (wa.me).

## Nota importante (ambiente)
O pod forkado veio com corrupção massiva de arquivos (null bytes) em venv Python, node_modules, yarn.lock, configs do supervisor, /data/db e arquivos de código. Foi reparado nesta sessão: deps Python reinstaladas, node_modules + yarn.lock regenerados, configs do supervisor reconstruídos, /data/db recriado (seed repovoou). Em um restart limpo do pod, a imagem original deve restaurar essas configs.

## Backlog (P1/P2)
- P1: entrega automática do PDF por link protegido/token (hoje via campo download_url por material + e-mail).
- P1: atualização de status do pedido no admin (enviado/entregue) e alerta de novo pedido.
- P2: área do aluno (login do comprador) com biblioteca de materiais.
- P2: cupons de desconto; combos dinâmicos.
- P2 (técnico): dividir server.py em módulos; migrar on_event → lifespan.
