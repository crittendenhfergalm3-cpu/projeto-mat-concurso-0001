"""
Backend integration tests for TO APROVADO Concursos Públicos.
Covers: auth, categories, products (apostilas/cursos), concursos, notícias,
checkout (Stripe + WhatsApp), admin CRUD + stats, upload/serve.
"""
import os
import pytest
import requests
from pathlib import Path


def _load_frontend_url():
    if os.environ.get("REACT_APP_BACKEND_URL"):
        return os.environ["REACT_APP_BACKEND_URL"]
    envf = Path("/app/frontend/.env")
    for ln in envf.read_text().splitlines():
        if ln.startswith("REACT_APP_BACKEND_URL="):
            return ln.split("=", 1)[1].strip().strip('"')
    raise RuntimeError("REACT_APP_BACKEND_URL not set")


BASE_URL = _load_frontend_url().rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "donatello@gmail.com"
ADMIN_PASSWORD = "Seinao10@@"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# --- Auth ---
class TestAuth:
    def test_login_ok(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"

    def test_login_invalid(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_authed(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# --- Categories / Products ---
class TestCatalog:
    def test_categories(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200
        cats = r.json()
        assert len(cats) >= 8
        slugs = {c["slug"] for c in cats}
        assert {"tribunais", "fiscal", "policial", "bancaria"}.issubset(slugs)
        for c in cats:
            assert "slug" in c and "name" in c and "count" in c

    def test_products_list(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 10
        assert isinstance(data["products"], list)

    def test_products_featured(self):
        r = requests.get(f"{API}/products", params={"featured": "true"})
        assert r.status_code == 200
        prods = r.json()["products"]
        assert len(prods) >= 1
        for p in prods:
            assert p["featured"] is True

    def test_products_by_category(self):
        r = requests.get(f"{API}/products", params={"category": "policial"})
        prods = r.json()["products"]
        assert len(prods) >= 1
        for p in prods:
            assert p["category"] == "policial"

    def test_products_filter_type(self):
        r = requests.get(f"{API}/products", params={"type": "curso"})
        for p in r.json()["products"]:
            assert p["type"] == "curso"

    def test_products_filter_banca(self):
        r = requests.get(f"{API}/products", params={"banca": "CEBRASPE"})
        assert r.status_code == 200
        prods = r.json()["products"]
        assert len(prods) >= 1
        for p in prods:
            assert p["banca"] == "CEBRASPE"

    def test_products_search(self):
        r = requests.get(f"{API}/products", params={"search": "INSS"})
        assert r.json()["total"] >= 1

    def test_products_sort_price_asc(self):
        r = requests.get(f"{API}/products", params={"sort": "price_asc", "limit": 5})
        prices = [p["price"] for p in r.json()["products"]]
        assert prices == sorted(prices)

    def test_product_detail(self):
        listing = requests.get(f"{API}/products", params={"featured": "true", "limit": 1}).json()["products"]
        slug = listing[0]["slug"]
        r = requests.get(f"{API}/products/{slug}")
        assert r.status_code == 200
        d = r.json()
        assert d["slug"] == slug
        # digital, no stock
        assert "banca" in d and "type" in d and "format" in d

    def test_product_detail_404(self):
        r = requests.get(f"{API}/products/inexistente-xyz")
        assert r.status_code == 404


# --- Concursos ---
class TestConcursos:
    def test_list(self):
        r = requests.get(f"{API}/concursos")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 4
        assert all("orgao" in c and "status" in c for c in items)

    def test_filter_status_aberto(self):
        r = requests.get(f"{API}/concursos", params={"status": "aberto"})
        for c in r.json():
            assert c["status"] == "aberto"

    def test_search(self):
        r = requests.get(f"{API}/concursos", params={"search": "INSS"})
        assert any("INSS" in c["orgao"] for c in r.json())


# --- Notícias ---
class TestNoticias:
    def test_list(self):
        r = requests.get(f"{API}/noticias")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 3
        assert all("slug" in n and "title" in n for n in items)

    def test_detail(self):
        items = requests.get(f"{API}/noticias").json()
        slug = items[0]["slug"]
        r = requests.get(f"{API}/noticias/{slug}")
        assert r.status_code == 200
        assert r.json()["slug"] == slug

    def test_detail_404(self):
        r = requests.get(f"{API}/noticias/nao-existe-xxx")
        assert r.status_code == 404


# --- Checkout ---
@pytest.fixture(scope="session")
def sample_product():
    return requests.get(f"{API}/products", params={"limit": 1}).json()["products"][0]


class TestCheckout:
    def test_stripe_create_session(self, sample_product):
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 2}],
            "customer": {"name": "Teste QA", "email": "teste@example.com",
                         "phone": "11988887777", "cpf": "12345678900"},
            "origin_url": BASE_URL,
        }
        r = requests.post(f"{API}/checkout/create-session", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "checkout_url" in data and "stripe.com" in data["checkout_url"]
        assert data["session_id"].startswith("cs_")
        r2 = requests.get(f"{API}/payments/status/{data['session_id']}")
        assert r2.status_code == 200
        assert r2.json()["payment_status"] in ["pending", "paid"]

    def test_whatsapp_order(self, sample_product):
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "customer": {"name": "TEST_WA", "email": "wa@example.com",
                         "phone": "11988887777", "cpf": "12345678900"},
        }
        r = requests.post(f"{API}/checkout/whatsapp", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["order_number"].startswith("TA")
        assert "Novo pedido" in data["message"]

    def test_checkout_invalid_product(self):
        payload = {
            "items": [{"product_id": "nope", "quantity": 1}],
            "customer": {"name": "X", "email": "x@x.com", "phone": "1", "cpf": ""},
            "origin_url": BASE_URL,
        }
        r = requests.post(f"{API}/checkout/create-session", json=payload)
        assert r.status_code == 400

    def test_payment_status_not_found(self):
        r = requests.get(f"{API}/payments/status/cs_test_notfound")
        assert r.status_code == 404


# --- Admin stats & orders ---
class TestAdmin:
    def test_admin_stats(self, admin_headers):
        r = requests.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_products", "total_orders", "revenue",
                  "total_concursos", "total_noticias"]:
            assert k in d

    def test_admin_orders(self, admin_headers):
        r = requests.get(f"{API}/admin/orders", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_orders_unauth(self):
        r = requests.get(f"{API}/admin/orders")
        assert r.status_code == 401


# --- Product CRUD ---
class TestProductCRUD:
    def test_product_crud(self, admin_headers):
        body = {"name": "TEST_Apostila QA", "description": "material de teste",
                "price": 10.5, "category": "policial", "banca": "CEBRASPE",
                "type": "apostila", "pages": 100, "format": "PDF",
                "author": "QA Team", "download_url": "",
                "images": ["https://placehold.co/300"], "featured": False, "active": True}
        r = requests.post(f"{API}/products", json=body, headers=admin_headers)
        assert r.status_code == 200, r.text
        created = r.json()
        pid, slug = created["id"], created["slug"]
        assert created["name"] == body["name"]

        r2 = requests.get(f"{API}/products/{slug}")
        assert r2.status_code == 200
        assert r2.json()["price"] == 10.5

        body["price"] = 22.0
        r3 = requests.put(f"{API}/products/{pid}", json=body, headers=admin_headers)
        assert r3.status_code == 200
        assert r3.json()["price"] == 22.0

        r4 = requests.delete(f"{API}/products/{pid}", headers=admin_headers)
        assert r4.status_code == 200
        r5 = requests.get(f"{API}/products/{slug}")
        assert r5.status_code == 404

    def test_create_product_unauth(self):
        r = requests.post(f"{API}/products",
                          json={"name": "X", "price": 1, "category": "x"})
        assert r.status_code == 401


# --- Concurso CRUD ---
class TestConcursoCRUD:
    def test_crud(self, admin_headers):
        body = {"orgao": "TEST_Orgao QA", "banca": "FGV", "cargo": "Analista",
                "vagas": "10", "salario": "R$ 5.000", "escolaridade": "Superior",
                "uf": "SP", "status": "aberto", "description": "teste"}
        r = requests.post(f"{API}/concursos", json=body, headers=admin_headers)
        assert r.status_code == 200
        c = r.json()
        cid = c["id"]
        r2 = requests.get(f"{API}/concursos/{cid}")
        assert r2.status_code == 200
        body["status"] = "encerrado"
        r3 = requests.put(f"{API}/concursos/{cid}", json=body, headers=admin_headers)
        assert r3.status_code == 200 and r3.json()["status"] == "encerrado"
        r4 = requests.delete(f"{API}/concursos/{cid}", headers=admin_headers)
        assert r4.status_code == 200

    def test_create_unauth(self):
        r = requests.post(f"{API}/concursos", json={"orgao": "X"})
        assert r.status_code == 401


# --- Notícia CRUD ---
class TestNoticiaCRUD:
    def test_crud(self, admin_headers):
        body = {"title": "TEST_Notícia QA", "summary": "sum",
                "content": "cont", "image": "", "category": "Concursos"}
        r = requests.post(f"{API}/noticias", json=body, headers=admin_headers)
        assert r.status_code == 200
        n = r.json()
        nid, slug = n["id"], n["slug"]
        r2 = requests.get(f"{API}/noticias/{slug}")
        assert r2.status_code == 200
        body["title"] = "TEST_Notícia QA v2"
        r3 = requests.put(f"{API}/noticias/{nid}", json=body, headers=admin_headers)
        assert r3.status_code == 200
        r4 = requests.delete(f"{API}/noticias/{nid}", headers=admin_headers)
        assert r4.status_code == 200


# --- Upload / Serve ---
_PNG_1x1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
    b"\x00\x00\x00\x03\x00\x01\x5b\xd7\x1a\xe3\x00\x00\x00\x00IEND\xaeB`\x82"
)


class TestUpload:
    def test_upload_requires_auth(self):
        r = requests.post(f"{API}/admin/upload",
                          files={"file": ("t.png", _PNG_1x1, "image/png")})
        assert r.status_code == 401

    def test_upload_and_serve(self, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        r = requests.post(f"{API}/admin/upload", headers=headers,
                          files={"file": ("t.png", _PNG_1x1, "image/png")})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "path" in data and data["url"] == f"/api/files/{data['path']}"
        assert data["path"].startswith("toaprovado/products/") or data["path"].startswith("local/")
        r2 = requests.get(f"{BASE_URL}{data['url']}")
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")

    def test_serve_missing_404(self):
        r = requests.get(f"{API}/files/nonexistent/x.png")
        assert r.status_code == 404
