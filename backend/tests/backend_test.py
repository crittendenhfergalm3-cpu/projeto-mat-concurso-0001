"""
Backend integration tests for São José Material de Construção.
Covers auth, catalog, product detail, shipping, checkout (Stripe + WhatsApp),
admin CRUD + stats, payment status flow, institutional endpoint sanity.
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

ADMIN_EMAIL = "smart-fox387-ded9dd06@darkemail.school"
ADMIN_PASSWORD = "SaoJose@2026"


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
    def test_login_invalid(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_unauth(self, s):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_authed(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# --- Categories & Products ---
class TestCatalog:
    def test_categories(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200
        cats = r.json()
        assert len(cats) >= 8
        for c in cats:
            assert "slug" in c and "name" in c and "count" in c

    def test_products_list(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 20
        assert isinstance(data["products"], list)

    def test_products_featured(self):
        r = requests.get(f"{API}/products", params={"featured": "true"})
        assert r.status_code == 200
        for p in r.json()["products"]:
            assert p["featured"] is True

    def test_products_by_category(self):
        r = requests.get(f"{API}/products", params={"category": "cimento-argamassa"})
        assert r.status_code == 200
        prods = r.json()["products"]
        assert len(prods) >= 1
        for p in prods:
            assert p["category"] == "cimento-argamassa"

    def test_products_search(self):
        r = requests.get(f"{API}/products", params={"search": "cimento"})
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_products_sort_price_asc(self):
        r = requests.get(f"{API}/products", params={"sort": "price_asc", "limit": 5})
        prices = [p["price"] for p in r.json()["products"]]
        assert prices == sorted(prices)

    def test_product_detail(self):
        # Use featured=true to avoid picking a transient TEST_ product created by parallel workers
        listing = requests.get(f"{API}/products", params={"featured": "true", "limit": 1}).json()["products"]
        slug = listing[0]["slug"]
        r = requests.get(f"{API}/products/{slug}")
        assert r.status_code == 200
        assert r.json()["slug"] == slug

    def test_product_detail_404(self):
        r = requests.get(f"{API}/products/inexistente-xyz")
        assert r.status_code == 404


# --- Shipping ---
class TestShipping:
    def test_shipping_local(self):
        r = requests.post(f"{API}/shipping/calculate", json={"cep": "65000-000", "subtotal": 100})
        assert r.status_code == 200
        data = r.json()
        assert data["local"] is True
        assert len(data["options"]) >= 2

    def test_shipping_local_free(self):
        r = requests.post(f"{API}/shipping/calculate", json={"cep": "65010000", "subtotal": 500})
        d = r.json()
        assert d["local"] is True
        assert any(o["free"] for o in d["options"])

    def test_shipping_remote(self):
        r = requests.post(f"{API}/shipping/calculate", json={"cep": "01310-100", "subtotal": 100})
        d = r.json()
        assert d["local"] is False
        assert all(o["cost"] > 0 for o in d["options"])

    def test_shipping_invalid(self):
        r = requests.post(f"{API}/shipping/calculate", json={"cep": "123", "subtotal": 0})
        assert r.status_code == 400


# --- Checkout ---
@pytest.fixture(scope="session")
def sample_product():
    return requests.get(f"{API}/products", params={"limit": 1}).json()["products"][0]


class TestCheckout:
    def test_stripe_create_session(self, sample_product):
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 2}],
            "customer": {"name": "Teste", "email": "teste@example.com",
                         "phone": "98999999999", "cep": "65000000", "address": "Rua X"},
            "shipping_cost": 25.0, "shipping_label": "Entrega local",
            "origin_url": BASE_URL,
        }
        r = requests.post(f"{API}/checkout/create-session", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["checkout_url"].startswith("https://checkout.stripe.com") or "stripe.com" in data["checkout_url"]
        assert data["session_id"].startswith("cs_")
        # payment status endpoint
        r2 = requests.get(f"{API}/payments/status/{data['session_id']}")
        assert r2.status_code == 200
        assert r2.json()["payment_status"] in ["pending", "paid"]

    def test_whatsapp_order(self, sample_product):
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "customer": {"name": "TEST_WA", "email": "wa@example.com",
                         "phone": "98988887777", "cep": "65000000", "address": "Rua Y"},
            "shipping_cost": 0.0, "shipping_label": "Retirar na loja",
        }
        r = requests.post(f"{API}/checkout/whatsapp", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["order_number"].startswith("SJ")
        assert "Novo pedido" in data["message"]

    def test_checkout_invalid_product(self):
        payload = {
            "items": [{"product_id": "nope", "quantity": 1}],
            "customer": {"name": "X", "email": "x@x.com", "phone": "1", "cep": "", "address": ""},
            "shipping_cost": 0.0, "shipping_label": "", "origin_url": BASE_URL,
        }
        r = requests.post(f"{API}/checkout/create-session", json=payload)
        assert r.status_code == 400

    def test_payment_status_not_found(self):
        r = requests.get(f"{API}/payments/status/cs_test_notfound")
        assert r.status_code == 404


# --- Admin ---
class TestAdmin:
    def test_admin_stats(self, admin_headers):
        r = requests.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_products", "total_orders", "revenue", "pending"]:
            assert k in d

    def test_admin_orders(self, admin_headers):
        r = requests.get(f"{API}/admin/orders", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_orders_unauth(self):
        r = requests.get(f"{API}/admin/orders")
        assert r.status_code == 401

    def test_product_crud(self, admin_headers):
        # CREATE
        body = {"name": "TEST_Cimento Testing", "description": "produto de teste",
                "price": 10.5, "stock": 5, "category": "cimento-argamassa",
                "unit": "un", "brand": "TEST", "sku": "T-1",
                "images": ["https://placehold.co/300"], "featured": False, "active": True}
        r = requests.post(f"{API}/products", json=body, headers=admin_headers)
        assert r.status_code == 200, r.text
        created = r.json()
        pid = created["id"]
        slug = created["slug"]
        assert created["name"] == body["name"]

        # GET by slug
        r2 = requests.get(f"{API}/products/{slug}")
        assert r2.status_code == 200
        assert r2.json()["price"] == 10.5

        # UPDATE
        body["price"] = 12.0
        r3 = requests.put(f"{API}/products/{pid}", json=body, headers=admin_headers)
        assert r3.status_code == 200
        assert r3.json()["price"] == 12.0

        # DELETE (soft)
        r4 = requests.delete(f"{API}/products/{pid}", headers=admin_headers)
        assert r4.status_code == 200
        r5 = requests.get(f"{API}/products/{slug}")
        assert r5.status_code == 404

    def test_create_product_unauth(self):
        r = requests.post(f"{API}/products", json={"name": "X", "price": 1, "category": "x"})
        assert r.status_code == 401


# --- Upload / File Serve (VPS fallback aware) ---
# Tiny valid PNG (1x1 red pixel)
_PNG_1x1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
    b"\x00\x00\x00\x03\x00\x01\x5b\xd7\x1a\xe3\x00\x00\x00\x00IEND\xaeB`\x82"
)


class TestUploadAndServe:
    def test_upload_requires_auth(self):
        r = requests.post(f"{API}/admin/upload",
                          files={"file": ("test.png", _PNG_1x1, "image/png")})
        assert r.status_code == 401

    def test_upload_and_serve_image(self, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        r = requests.post(f"{API}/admin/upload", headers=headers,
                          files={"file": ("test.png", _PNG_1x1, "image/png")})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "path" in data and "url" in data
        # Emergent storage returns saojose/products/<uuid>.png; local fallback returns local/<uuid>.png
        assert data["path"].startswith("saojose/products/") or data["path"].startswith("local/")
        assert data["url"] == f"/api/files/{data['path']}"

        # Serve back
        r2 = requests.get(f"{BASE_URL}{data['url']}")
        assert r2.status_code == 200, f"serve failed: {r2.status_code} {r2.text[:200]}"
        assert r2.headers.get("content-type", "").startswith("image/")
        assert r2.content[:8] == b"\x89PNG\r\n\x1a\n"  # PNG magic bytes

    def test_serve_missing_file_404(self):
        r = requests.get(f"{API}/files/nonexistent/does-not-exist.png")
        assert r.status_code == 404

    def test_create_product_with_uploaded_image(self, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        up = requests.post(f"{API}/admin/upload", headers=headers,
                           files={"file": ("prod.png", _PNG_1x1, "image/png")}).json()
        body = {"name": "TEST_Produto Upload Image", "description": "com foto",
                "price": 9.9, "stock": 1, "category": "ferramentas",
                "unit": "un", "brand": "TEST", "sku": "T-UP",
                "images": [up["url"]], "featured": False, "active": True}
        r = requests.post(f"{API}/products", json=body, headers={**headers, "Content-Type": "application/json"})
        assert r.status_code == 200, r.text
        created = r.json()
        try:
            # Refetch listing and verify image URL persisted
            got = requests.get(f"{API}/products/{created['slug']}").json()
            assert up["url"] in got["images"]
            # And image resolves
            img = requests.get(f"{BASE_URL}{up['url']}")
            assert img.status_code == 200
            assert img.headers.get("content-type", "").startswith("image/")
        finally:
            requests.delete(f"{API}/products/{created['id']}", headers=headers)
