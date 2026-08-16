# São José Material de Construção — E-commerce

Loja online de materiais de construção (React + FastAPI + MongoDB), com catálogo,
carrinho, checkout (Stripe + WhatsApp), cálculo de frete por CEP, páginas
institucionais e painel administrativo protegido.

---

## 🧱 Stack

- **Frontend:** React (Create React App) + Tailwind + Shadcn UI
- **Backend:** FastAPI (Python)
- **Banco:** MongoDB
- **Pagamento:** Stripe (checkout online) + botão WhatsApp
- **E-mail:** confirmação de pedido (Resend gerenciado na Emergent / SMTP no seu VPS)
- **Imagens de produto:** Object Storage na Emergent / **disco local (fallback automático)** no seu VPS

---

## 📁 Estrutura

```
/backend           API FastAPI
  server.py        toda a API (rotas /api/*)
  requirements.txt        deps da plataforma Emergent (NÃO usar no VPS)
  requirements-vps.txt    deps limpas para o SEU VPS  ✅
  .env.example            modelo de variáveis de ambiente
  uploads/                imagens enviadas pelo admin (criado em runtime, não versionar)
/frontend          App React
  src/             código-fonte
  .env.example     modelo (REACT_APP_BACKEND_URL)
```

Todas as rotas da API têm o prefixo **`/api`**. O frontend sempre usa
`REACT_APP_BACKEND_URL` para chamar a API.

---

## ⚠️ Antes de subir pro GitHub (importante)

1. **Nunca** faça commit dos arquivos `.env` (contêm chaves secretas). Eles já estão
   no `.gitignore`. Suba apenas os `.env.example`.
2. Se você já commitou um `.env` por engano, **troque todas as chaves** (JWT, Stripe, etc.).
3. A pasta `backend/uploads/` (imagens enviadas) e `node_modules/` também são ignoradas.

---

## 🚀 Rodando localmente (desenvolvimento)

**Pré-requisitos:** Python 3.11+, Node 18+, Yarn, MongoDB rodando.

```bash
# 1) Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements-vps.txt
cp .env.example .env      # edite com seus valores
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# 2) Frontend (em outro terminal)
cd frontend
yarn install
cp .env.example .env      # REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

Acesse `http://localhost:3000`. O painel admin fica em `/admin/login`
(use o `ADMIN_EMAIL` / `ADMIN_PASSWORD` do seu `.env`). Categorias e produtos de
exemplo são criados automaticamente no primeiro start (seed).

---

## 🖥️ Deploy no seu VPS (produção)

Exemplo com Ubuntu + Nginx + systemd.

### 1. MongoDB
Instale o MongoDB (ou use um Atlas). Anote a `MONGO_URL`.

### 2. Backend (FastAPI com Gunicorn)

```bash
cd /var/www/saojose/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements-vps.txt
cp .env.example .env    # preencha MONGO_URL, JWT_SECRET, ADMIN_*, STRIPE_*, CORS_ORIGINS
```

Crie o serviço systemd `/etc/systemd/system/saojose-api.service`:

```ini
[Unit]
Description=Sao Jose API
After=network.target

[Service]
WorkingDirectory=/var/www/saojose/backend
ExecStart=/var/www/saojose/backend/venv/bin/gunicorn server:app \
  -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8001 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now saojose-api
```

### 3. Frontend (build estático)

```bash
cd /var/www/saojose/frontend
# .env com REACT_APP_BACKEND_URL=https://seudominio.com.br
yarn install && yarn build      # gera a pasta build/
```

### 4. Nginx (serve o frontend e faz proxy do /api)

`/etc/nginx/sites-available/saojose`:

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    root /var/www/saojose/frontend/build;
    index index.html;

    # API -> backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA (React Router) -> sempre index.html
    location / {
        try_files $uri /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/saojose /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. SSL grátis (HTTPS) — obrigatório para Google Ads

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

---

## 🔌 Migrando as integrações Emergent → suas próprias contas

Estas 3 partes usam serviços gerenciados pela Emergent e precisam da sua conta no VPS:

| Recurso | Na Emergent | No seu VPS |
|---|---|---|
| **Pagamento (Stripe)** | Sandbox reivindicável | Use as chaves da **sua** conta Stripe em `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`. Configure o webhook em `https://seudominio.com.br/api/stripe/webhook`. |
| **Imagens de produto** | Object Storage gerenciado | **Automático:** se o storage da Emergent não estiver disponível, o upload cai em `backend/uploads/` (disco local) e é servido por `/api/files/local/...`. Nada a fazer. |
| **E-mail de confirmação** | Resend gerenciado (`EMERGENT_EMAIL_KEY`) | Crie conta no [Resend](https://resend.com) e ajuste a função `send_order_email` em `server.py` para usar sua API key, **ou** um SMTP. Sem chave, o pedido é criado normalmente, só não envia o e-mail. |

> **Nota:** o restante do site (catálogo, carrinho, checkout, frete, admin, páginas
> institucionais) funciona 100% no VPS sem nenhum serviço da Emergent.

---

## 🔐 Painel administrativo

- URL: `/admin/login`
- Credenciais definidas por `ADMIN_EMAIL` / `ADMIN_PASSWORD` no `.env`.
- Permite cadastrar/editar produtos (com upload de imagem) e ver pedidos.

---

## ✅ Checklist Google Ads (conformidade)

O site já inclui: Sobre, Contato (tel/e-mail/endereço), CNPJ + Razão Social no rodapé,
Política de Privacidade, Termos, Trocas e Devoluções, Política de Frete, selos de
segurança e páginas de destino coerentes. Para aprovar a campanha, faltam apenas os
passos de infra/conta: **domínio próprio + SSL + verificação de identidade do anunciante**.
