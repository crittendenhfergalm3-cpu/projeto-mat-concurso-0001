# TÔ APROVADO Concursos Públicos — Plataforma de Estudos

Plataforma web de estudos e **venda de conteúdo digital** (apostilas em PDF e cursos em videoaulas)
para **concursos públicos do Brasil**. Inclui catálogo por área e banca, carrinho, checkout
(Stripe + WhatsApp), seções de **Concursos**, **Notícias** e **Bancas**, páginas institucionais
(compatíveis com Google Ads) e painel administrativo protegido.

- **Frontend:** React + Tailwind + Shadcn UI
- **Backend:** FastAPI + MongoDB (Motor)
- **Pagamentos:** Stripe (cartão) e WhatsApp
- **Entrega:** conteúdo 100% digital (link/e-mail após pagamento) — sem frete

> Empresa: **TÔ APROVADO CURSOS PARA CONCURSOS PUBLICOS LTDA - ME** — CNPJ 37.380.166/0001-90.

---

## 1. Estrutura do projeto

```
/
├── backend/
│   ├── server.py            # API FastAPI (produtos, concursos, notícias, checkout, admin)
│   ├── requirements.txt      # dependências (ambiente Emergent)
│   ├── requirements-vps.txt  # dependências LIMPAS para o seu VPS  <-- use esta
│   ├── .env.example          # modelo de variáveis de ambiente
│   └── uploads/              # imagens enviadas pelo admin (fallback em disco)
└── frontend/
    ├── src/                  # código React
    ├── public/
    ├── package.json
    └── .env.example          # modelo (REACT_APP_BACKEND_URL)
```

---

## 2. Rodando localmente

### Pré-requisitos
- Node.js 18+ e Yarn
- Python 3.11+
- MongoDB 6+ (local ou Atlas)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements-vps.txt
cp .env.example .env          # edite com seus valores
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env          # aponte REACT_APP_BACKEND_URL para o backend
yarn start
```

O seed é executado automaticamente no primeiro start do backend (áreas, materiais de exemplo,
concursos, notícias e o usuário admin definido no `.env`).

---

## 3. Variáveis de ambiente

### backend/.env
| Variável | Descrição |
|---|---|
| `MONGO_URL` | String de conexão do MongoDB |
| `DB_NAME` | Nome do banco (ex.: `toaprovado`) |
| `CORS_ORIGINS` | Domínios liberados (separe por vírgula) |
| `JWT_SECRET` | Segredo do JWT (gere aleatório) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Login do painel `/admin` |
| `OWNER_EMAIL` | E-mail que recebe cópia dos pedidos |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | Chaves da sua conta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook Stripe |
| `EMAIL_FROM_NAME` | Nome do remetente dos e-mails |

Gere um `JWT_SECRET`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### frontend/.env
```
REACT_APP_BACKEND_URL=https://seudominio.com.br
```

> ⚠️ Nunca versione os arquivos `.env` reais — eles já estão no `.gitignore`.

---

## 4. Deploy no seu VPS (Ubuntu + Nginx)

### 4.1 Backend (systemd + gunicorn)
```bash
cd /var/www/toaprovado/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements-vps.txt
```

Crie o serviço `/etc/systemd/system/toaprovado-api.service`:
```ini
[Unit]
Description=TO APROVADO API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/toaprovado/backend
EnvironmentFile=/var/www/toaprovado/backend/.env
ExecStart=/var/www/toaprovado/backend/venv/bin/gunicorn server:app \
  -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8001 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now toaprovado-api
```

### 4.2 Frontend (build estático)
```bash
cd /var/www/toaprovado/frontend
yarn install
yarn build          # gera a pasta build/
```

### 4.3 Nginx
`/etc/nginx/sites-available/toaprovado`:
```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    root /var/www/toaprovado/frontend/build;
    index index.html;

    # API -> backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA (React Router)
    location / {
        try_files $uri /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/toaprovado /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4.4 HTTPS (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

---

## 5. Stripe

1. Crie sua conta em https://dashboard.stripe.com.
2. Pegue as chaves em **Developers → API keys** e preencha o `.env`.
3. Configure o webhook apontando para `https://seudominio.com.br/api/stripe/webhook`
   e copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET`.

---

## 6. Painel administrativo

Acesse `/admin/login` com as credenciais definidas em `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
No painel você gerencia **Materiais** (apostilas/cursos), **Concursos**, **Notícias** e **Pedidos**,
além de enviar imagens de capa.

---

## 7. Entrega dos materiais (conteúdo digital)

Cada material possui o campo **Link de download/acesso** (`download_url`) no painel admin.
Após o pagamento confirmado, o link é exibido na tela de sucesso e enviado por e-mail ao cliente.
Recomenda-se hospedar os PDFs/videoaulas em um armazenamento próprio (ex.: S3, Google Drive
com link, ou pasta protegida) e colar o link no material correspondente.

---

## 8. Observações de segurança

- Mantenha os `.env` fora do Git.
- Use HTTPS em produção (Certbot).
- Troque a senha do admin e o `JWT_SECRET` antes de ir ao ar.
- As imagens enviadas pelo admin caem em `backend/uploads/` (fallback local) — faça backup dessa pasta.
