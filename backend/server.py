from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import re
import random
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
import stripe
import httpx
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# --- Config ---
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "TÔ APROVADO Concursos Públicos")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL")

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "toaprovado"
UPLOAD_DIR = ROOT_DIR / "uploads"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Storage ---
storage_key = None

def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type},
                        data=data, timeout=120)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": key, "Content-Type": content_type},
                            data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# --- Auth helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"email": payload.get("email")})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Acesso negado")
        return {"email": user["email"], "name": user.get("name"), "role": user["role"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# --- Models ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProductIn(BaseModel):
    name: str
    description: str = ""
    price: float
    category: str            # área do concurso (slug)
    banca: str = ""          # CEBRASPE, FGV, FCC...
    type: str = "apostila"   # apostila | curso | combo
    pages: int = 0
    format: str = "PDF"
    author: str = ""
    download_url: str = ""
    images: List[str] = []
    featured: bool = False
    active: bool = True

class ConcursoIn(BaseModel):
    orgao: str
    banca: str = ""
    cargo: str = ""
    vagas: str = ""
    salario: str = ""
    escolaridade: str = ""
    uf: str = "Nacional"
    status: str = "previsto"   # aberto | edital | previsto | encerrado
    inscricao_inicio: str = ""
    inscricao_fim: str = ""
    data_prova: str = ""
    link: str = ""
    description: str = ""
    active: bool = True

class NoticiaIn(BaseModel):
    title: str
    summary: str = ""
    content: str = ""
    image: str = ""
    category: str = "Concursos"
    active: bool = True

class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(1, ge=1, le=999)

class CustomerInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    cpf: str = ""

class CheckoutRequest(BaseModel):
    items: List[CartItem]
    customer: CustomerInfo
    origin_url: str

class WhatsAppOrderRequest(BaseModel):
    items: List[CartItem]
    customer: CustomerInfo

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[àáâã]', 'a', text)
    text = re.sub(r'[éê]', 'e', text)
    text = re.sub(r'[í]', 'i', text)
    text = re.sub(r'[óôõ]', 'o', text)
    text = re.sub(r'[ú]', 'u', text)
    text = re.sub(r'[ç]', 'c', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

# --- Auth routes ---
@api_router.post("/auth/login")
async def login(body: LoginRequest):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    token = create_access_token(str(user["_id"]), user["email"])
    return {"token": token, "user": {"email": user["email"], "name": user.get("name"), "role": user.get("role")}}

@api_router.get("/auth/me")
async def me(admin: dict = Depends(get_current_admin)):
    return admin

# --- Categories (áreas de concurso) ---
@api_router.get("/categories")
async def get_categories():
    cats = await db.categories.find({}, {"_id": 0}).to_list(100)
    for c in cats:
        c["count"] = await db.products.count_documents({"category": c["slug"], "active": True})
    return cats

# --- Products (apostilas / cursos) ---
@api_router.get("/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None,
                       banca: Optional[str] = None, type: Optional[str] = None,
                       sort: Optional[str] = "recent", featured: Optional[bool] = None,
                       page: int = 1, limit: int = 24):
    query = {"active": True}
    if category:
        query["category"] = category
    if banca:
        query["banca"] = banca
    if type:
        query["type"] = type
    if featured is not None:
        query["featured"] = featured
    if search:
        esc = re.escape(search)
        query["$or"] = [{"name": {"$regex": esc, "$options": "i"}},
                        {"description": {"$regex": esc, "$options": "i"}},
                        {"banca": {"$regex": esc, "$options": "i"}}]
    sort_map = {"recent": ("created_at", -1), "price_asc": ("price", 1),
                "price_desc": ("price", -1), "name": ("name", 1)}
    sort_field, sort_dir = sort_map.get(sort, ("created_at", -1))
    total = await db.products.count_documents(query)
    skip = (page - 1) * limit
    products = await db.products.find(query, {"_id": 0}).sort(sort_field, sort_dir).skip(skip).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}

@api_router.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug, "active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    return product

@api_router.post("/products")
async def create_product(body: ProductIn, admin: dict = Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    base_slug = slugify(doc["name"])
    slug = base_slug
    i = 1
    while await db.products.find_one({"slug": slug}):
        i += 1
        slug = f"{base_slug}-{i}"
    doc["slug"] = slug
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, body: ProductIn, admin: dict = Depends(get_current_admin)):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    await db.products.update_one({"id": product_id}, {"$set": body.model_dump()})
    return await db.products.find_one({"id": product_id}, {"_id": 0})

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    await db.products.update_one({"id": product_id}, {"$set": {"active": False}})
    return {"status": "ok"}

# --- Concursos ---
@api_router.get("/concursos")
async def get_concursos(status: Optional[str] = None, uf: Optional[str] = None,
                        search: Optional[str] = None, limit: int = 100):
    query = {"active": True}
    if status:
        query["status"] = status
    if uf:
        query["uf"] = uf
    if search:
        esc = re.escape(search)
        query["$or"] = [{"orgao": {"$regex": esc, "$options": "i"}},
                        {"cargo": {"$regex": esc, "$options": "i"}},
                        {"banca": {"$regex": esc, "$options": "i"}}]
    order = {"aberto": 0, "edital": 1, "previsto": 2, "encerrado": 3}
    items = await db.concursos.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    items.sort(key=lambda c: order.get(c.get("status"), 9))
    return items

@api_router.get("/concursos/{concurso_id}")
async def get_concurso(concurso_id: str):
    item = await db.concursos.find_one({"id": concurso_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Concurso não encontrado")
    return item

@api_router.post("/concursos")
async def create_concurso(body: ConcursoIn, admin: dict = Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.concursos.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/concursos/{concurso_id}")
async def update_concurso(concurso_id: str, body: ConcursoIn, admin: dict = Depends(get_current_admin)):
    existing = await db.concursos.find_one({"id": concurso_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Concurso não encontrado")
    await db.concursos.update_one({"id": concurso_id}, {"$set": body.model_dump()})
    return await db.concursos.find_one({"id": concurso_id}, {"_id": 0})

@api_router.delete("/concursos/{concurso_id}")
async def delete_concurso(concurso_id: str, admin: dict = Depends(get_current_admin)):
    await db.concursos.delete_one({"id": concurso_id})
    return {"status": "ok"}

# --- Notícias ---
@api_router.get("/noticias")
async def get_noticias(limit: int = 50):
    return await db.noticias.find({"active": True}, {"_id": 0}).sort("created_at", -1).to_list(limit)

@api_router.get("/noticias/{slug}")
async def get_noticia(slug: str):
    item = await db.noticias.find_one({"slug": slug, "active": True}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    return item

@api_router.post("/noticias")
async def create_noticia(body: NoticiaIn, admin: dict = Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    base_slug = slugify(doc["title"])
    slug = base_slug
    i = 1
    while await db.noticias.find_one({"slug": slug}):
        i += 1
        slug = f"{base_slug}-{i}"
    doc["slug"] = slug
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.noticias.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/noticias/{noticia_id}")
async def update_noticia(noticia_id: str, body: NoticiaIn, admin: dict = Depends(get_current_admin)):
    existing = await db.noticias.find_one({"id": noticia_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    await db.noticias.update_one({"id": noticia_id}, {"$set": body.model_dump()})
    return await db.noticias.find_one({"id": noticia_id}, {"_id": 0})

@api_router.delete("/noticias/{noticia_id}")
async def delete_noticia(noticia_id: str, admin: dict = Depends(get_current_admin)):
    await db.noticias.delete_one({"id": noticia_id})
    return {"status": "ok"}

# --- Order helpers ---
async def build_order_items(items: List[CartItem]):
    order_items = []
    subtotal = 0.0
    for it in items:
        product = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail="Material indisponível")
        line = {"product_id": product["id"], "name": product["name"], "price": product["price"],
                "quantity": it.quantity, "image": product["images"][0] if product.get("images") else "",
                "download_url": product.get("download_url", "")}
        subtotal += product["price"] * it.quantity
        order_items.append(line)
    return order_items, round(subtotal, 2)

def gen_order_number():
    return "TA" + datetime.now().strftime("%y%m%d") + str(random.randint(1000, 9999))

async def send_order_email(order: dict):
    if not EMAIL_KEY:
        return
    rows = "".join([
        f"<tr><td style='padding:8px;border-bottom:1px solid #eee'>{i['name']} x{i['quantity']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>R$ {i['price']*i['quantity']:.2f}</td></tr>"
        for i in order["items"]])
    downloads = "".join([
        f"<li style='margin:6px 0'><a href='{i['download_url']}' style='color:#047857'>{i['name']}</a></li>"
        for i in order["items"] if i.get("download_url")])
    downloads_block = (f"<h3 style='margin-top:20px'>Seus materiais (download)</h3><ul>{downloads}</ul>"
                       if downloads else
                       "<p>Seus materiais serão enviados para este e-mail em instantes.</p>")
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#047857;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">TÔ APROVADO Concursos Públicos</h1>
      </div>
      <div style="padding:24px;color:#111">
        <h2 style="margin-top:0">Compra confirmada! 🎯</h2>
        <p>Olá {order['customer']['name']}, recebemos o seu pedido <strong>#{order['order_number']}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">{rows}
          <tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold">R$ {order['total']:.2f}</td></tr>
        </table>
        {downloads_block}
        <p style="color:#666;font-size:12px;margin-top:24px">TO APROVADO CURSOS PARA CONCURSOS PUBLICOS LTDA - ME · CNPJ 37.380.166/0001-90<br>R. Henri Dunant, 1066 - Santo Amaro, São Paulo/SP</p>
      </div>
    </div>"""
    payload = {"to": [order["customer"]["email"]], "subject": f"Pedido #{order['order_number']} confirmado",
               "html": html, "from_name": EMAIL_FROM_NAME}
    if OWNER_EMAIL:
        payload["contact_email"] = OWNER_EMAIL
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                             headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        r.raise_for_status()
    except Exception as e:
        logger.error(f"Email falhou: {e}")

# --- Checkout (Stripe) ---
@api_router.post("/checkout/create-session")
async def create_checkout(body: CheckoutRequest):
    order_items, subtotal = await build_order_items(body.items)
    total = round(subtotal, 2)
    order_number = gen_order_number()

    line_items = [{
        "price_data": {"currency": "brl", "unit_amount": int(round(i["price"] * 100)),
                       "product_data": {"name": i["name"]}},
        "quantity": i["quantity"]} for i in order_items]

    session = stripe.checkout.Session.create(
        line_items=line_items, mode="payment",
        customer_email=body.customer.email,
        success_url=f"{body.origin_url}/pagamento/sucesso?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{body.origin_url}/pagamento/cancelado",
        metadata={"order_number": order_number},
    )

    order = {"id": str(uuid.uuid4()), "order_number": order_number, "items": order_items,
             "customer": body.customer.model_dump(), "subtotal": subtotal,
             "total": total, "method": "stripe", "status": "pending", "payment_status": "pending",
             "session_id": session.id, "created_at": datetime.now(timezone.utc).isoformat(),
             "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.orders.insert_one(order)
    await db.payment_transactions.insert_one({
        "session_id": session.id, "order_number": order_number, "amount": total, "currency": "brl",
        "status": "initiated", "payment_status": "pending",
        "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)})
    return {"checkout_url": session.url, "session_id": session.id}

@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                              "updated_at": datetime.now(timezone.utc)}})
                order = await db.orders.find_one({"session_id": session_id})
                if order and order.get("payment_status") != "paid":
                    await db.orders.update_one({"session_id": session_id},
                        {"$set": {"payment_status": "paid", "status": "paid",
                                  "updated_at": datetime.now(timezone.utc).isoformat()}})
                    order["payment_status"] = "paid"
                    await send_order_email(order)
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except stripe.error.StripeError:
            pass
    order = await db.orders.find_one({"session_id": session_id}, {"_id": 0})
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"], "order": order}

@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Assinatura inválida")
    obj, t = event["data"]["object"], event["type"]
    if t == "checkout.session.completed":
        sid = obj["id"]
        await db.payment_transactions.update_one(
            {"session_id": sid, "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": "paid", "updated_at": datetime.now(timezone.utc)}})
        order = await db.orders.find_one({"session_id": sid})
        if order and order.get("payment_status") != "paid":
            await db.orders.update_one({"session_id": sid},
                {"$set": {"payment_status": "paid", "status": "paid",
                          "updated_at": datetime.now(timezone.utc).isoformat()}})
            await send_order_email(order)
    return {"status": "ok"}

# --- WhatsApp order ---
@api_router.post("/checkout/whatsapp")
async def whatsapp_order(body: WhatsAppOrderRequest):
    order_items, subtotal = await build_order_items(body.items)
    total = round(subtotal, 2)
    order_number = gen_order_number()
    order = {"id": str(uuid.uuid4()), "order_number": order_number, "items": order_items,
             "customer": body.customer.model_dump(), "subtotal": subtotal,
             "total": total, "method": "whatsapp", "status": "novo", "payment_status": "a_combinar",
             "created_at": datetime.now(timezone.utc).isoformat(),
             "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.orders.insert_one(order)
    lines = "\n".join([f"• {i['quantity']}x {i['name']} - R$ {i['price']*i['quantity']:.2f}" for i in order_items])
    msg = (f"*Novo pedido #{order_number}*\n\n{lines}\n\n"
           f"*Total: R$ {total:.2f}*\n\n"
           f"Cliente: {body.customer.name}\nE-mail: {body.customer.email}\n"
           f"Telefone: {body.customer.phone}\nCPF: {body.customer.cpf}")
    return {"order_number": order_number, "message": msg}

# --- Admin ---
@api_router.get("/admin/orders")
async def admin_orders(admin: dict = Depends(get_current_admin)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_current_admin)):
    total_products = await db.products.count_documents({"active": True})
    total_orders = await db.orders.count_documents({})
    paid_orders = await db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(2000)
    revenue = sum(o["total"] for o in paid_orders)
    total_concursos = await db.concursos.count_documents({"active": True})
    total_noticias = await db.noticias.count_documents({"active": True})
    return {"total_products": total_products, "total_orders": total_orders,
            "revenue": round(revenue, 2), "total_concursos": total_concursos,
            "total_noticias": total_noticias}

@api_router.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    try:
        result = put_object(f"{APP_NAME}/products/{uuid.uuid4()}.{ext}", data, content_type)
        storage_path = result["path"]
    except Exception as e:
        logger.error(f"Object storage indisponível, salvando em disco local: {e}")
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        fname = f"{uuid.uuid4()}.{ext}"
        (UPLOAD_DIR / fname).write_bytes(data)
        storage_path = f"local/{fname}"
    await db.files.insert_one({"id": str(uuid.uuid4()), "storage_path": storage_path,
                               "content_type": content_type, "is_deleted": False,
                               "created_at": datetime.now(timezone.utc).isoformat()})
    return {"path": storage_path, "url": f"/api/files/{storage_path}"}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    if path.startswith("local/"):
        fpath = UPLOAD_DIR / path.split("/", 1)[1]
        if not fpath.exists():
            raise HTTPException(status_code=404, detail="Arquivo não encontrado")
        return Response(content=fpath.read_bytes(),
                        media_type=record.get("content_type") or "application/octet-stream")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

@api_router.get("/")
async def root():
    return {"message": "TÔ APROVADO Concursos Públicos API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Seed data ---
IMG_STUDY = "https://images.unsplash.com/photo-1514369118554-e20d93546b30?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
IMG_LAW = "https://images.unsplash.com/photo-1618771623063-6c3faa854a61?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
IMG_LAW2 = "https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
IMG_ONLINE = "https://images.unsplash.com/photo-1501504905252-473c47e087f8?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
IMG_READ = "https://images.unsplash.com/photo-1571193161738-deaba9b6cc26?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
IMG_NOTES = "https://images.unsplash.com/photo-1547567667-1aa64e6f58dc?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
IMG_GOV = "https://images.unsplash.com/photo-1625426078245-6911839409dd?crop=entropy&cs=srgb&fm=jpg&w=1000&q=80&ixlib=rb-4.1.0"
IMG_LIB = "https://images.unsplash.com/photo-1551818567-d49550a81408?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"

CATEGORIES = [
    {"name": "Tribunais e MP", "slug": "tribunais", "icon": "scale", "image": IMG_LAW},
    {"name": "Área Fiscal", "slug": "fiscal", "icon": "landmark", "image": IMG_GOV},
    {"name": "Área Policial", "slug": "policial", "icon": "shield", "image": IMG_STUDY},
    {"name": "Área Bancária", "slug": "bancaria", "icon": "banknote", "image": IMG_ONLINE},
    {"name": "Administrativa", "slug": "administrativa", "icon": "briefcase", "image": IMG_NOTES},
    {"name": "Nível Médio", "slug": "nivel-medio", "icon": "graduation-cap", "image": IMG_READ},
    {"name": "Área Jurídica", "slug": "juridica", "icon": "gavel", "image": IMG_LAW2},
    {"name": "Educação e Docência", "slug": "educacao", "icon": "book-open", "image": IMG_LIB},
]

PRODUCTS = [
    {"name": "Apostila Completa INSS - Técnico do Seguro Social", "category": "administrativa", "banca": "CEBRASPE", "type": "apostila", "price": 89.90, "pages": 980, "format": "PDF", "author": "Equipe TÔ APROVADO", "featured": True, "images": [IMG_STUDY], "description": "Apostila completa e atualizada para Técnico do Seguro Social do INSS. Conteúdo teórico + milhares de questões comentadas no estilo CEBRASPE (Certo/Errado). Inclui Direito Previdenciário, Ética, Informática, Português e Raciocínio Lógico."},
    {"name": "Curso Completo Polícia Federal - Agente (Videoaulas)", "category": "policial", "banca": "CEBRASPE", "type": "curso", "price": 297.00, "pages": 0, "format": "Videoaulas + PDF", "author": "Prof. Marcelo Aguiar", "featured": True, "images": [IMG_ONLINE], "description": "Curso preparatório completo em videoaulas para Agente da Polícia Federal. Mais de 120 horas de aula, mapas mentais, PDF de apoio e simulados no padrão CEBRASPE."},
    {"name": "Apostila Receita Federal - Auditor Fiscal", "category": "fiscal", "banca": "FGV", "type": "apostila", "price": 129.90, "pages": 1450, "format": "PDF", "author": "Equipe TÔ APROVADO", "featured": True, "images": [IMG_GOV], "description": "Material completo para Auditor-Fiscal da Receita Federal com foco na banca FGV. Direito Tributário, Contabilidade, Auditoria, Legislação Aduaneira e questões inéditas comentadas."},
    {"name": "Apostila TRT - Técnico Judiciário (Área Administrativa)", "category": "tribunais", "banca": "FCC", "type": "apostila", "price": 79.90, "pages": 720, "format": "PDF", "author": "Equipe TÔ APROVADO", "featured": True, "images": [IMG_LAW], "description": "Apostila para Técnico Judiciário dos Tribunais Regionais do Trabalho no estilo FCC. Português, Raciocínio Lógico, Noções de Direito e questões da banca."},
    {"name": "Curso Banco do Brasil - Escriturário (Agente Comercial)", "category": "bancaria", "banca": "CESGRANRIO", "type": "curso", "price": 197.00, "pages": 0, "format": "Videoaulas + PDF", "author": "Prof. Ana Beatriz", "featured": True, "images": [IMG_ONLINE], "description": "Preparatório completo para Escriturário do Banco do Brasil. Conhecimentos bancários, atendimento, vendas, matemática financeira e questões CESGRANRIO comentadas."},
    {"name": "Apostila Caixa Econômica Federal - Técnico Bancário", "category": "bancaria", "banca": "CESGRANRIO", "type": "apostila", "price": 84.90, "pages": 640, "format": "PDF", "author": "Equipe TÔ APROVADO", "images": [IMG_READ], "description": "Material atualizado para Técnico Bancário Novo da CAIXA. Conhecimentos bancários, ética, LGPD, Português, matemática e informática no padrão CESGRANRIO."},
    {"name": "Apostila TJ-SP - Escrevente Técnico Judiciário", "category": "tribunais", "banca": "VUNESP", "type": "apostila", "price": 74.90, "pages": 690, "format": "PDF", "author": "Equipe TÔ APROVADO", "images": [IMG_LAW2], "description": "Apostila para Escrevente Técnico Judiciário do TJ-SP com foco na VUNESP. Direito Penal, Processual, Constitucional, Português e legislação específica."},
    {"name": "Apostila PRF - Policial Rodoviário Federal", "category": "policial", "banca": "CEBRASPE", "type": "apostila", "price": 99.90, "pages": 1100, "format": "PDF", "author": "Equipe TÔ APROVADO", "images": [IMG_STUDY], "description": "Preparação completa para Policial Rodoviário Federal. Legislação de trânsito, Direitos Humanos, Física aplicada, Português e questões CEBRASPE comentadas."},
    {"name": "Combo Concurso dos Sonhos - Português + RLM + Informática", "category": "nivel-medio", "banca": "Diversas", "type": "combo", "price": 149.90, "pages": 1600, "format": "PDF + Videoaulas", "author": "Equipe TÔ APROVADO", "featured": True, "images": [IMG_NOTES], "description": "Combo com as 3 disciplinas mais cobradas em concursos: Língua Portuguesa, Raciocínio Lógico-Matemático e Informática. Teoria + mais de 3.000 questões de todas as bancas."},
    {"name": "Apostila Professor - Concursos da Educação (SEDUC)", "category": "educacao", "banca": "Diversas", "type": "apostila", "price": 69.90, "pages": 580, "format": "PDF", "author": "Profa. Cláudia Reis", "images": [IMG_LIB], "description": "Material para concursos de Professor das redes estaduais e municipais. Conhecimentos pedagógicos, LDB, ECA, BNCC, legislação educacional e questões comentadas."},
    {"name": "Apostila OAB 1ª Fase - Exame de Ordem", "category": "juridica", "banca": "FGV", "type": "apostila", "price": 119.90, "pages": 1300, "format": "PDF", "author": "Equipe TÔ APROVADO", "images": [IMG_LAW], "description": "Apostila completa para a 1ª Fase do Exame da OAB (FGV). Todas as disciplinas do edital com teoria objetiva, súmulas e questões dos últimos exames comentadas."},
    {"name": "Curso Raciocínio Lógico do Zero (Videoaulas)", "category": "nivel-medio", "banca": "Diversas", "type": "curso", "price": 89.00, "pages": 0, "format": "Videoaulas + PDF", "author": "Prof. Rodrigo Lima", "images": [IMG_ONLINE], "description": "Aprenda Raciocínio Lógico-Matemático do zero para qualquer concurso. Aulas passo a passo, resolução de questões e macetes para ganhar tempo na prova."},
]

CONCURSOS = [
    {"orgao": "INSS - Instituto Nacional do Seguro Social", "banca": "CEBRASPE", "cargo": "Técnico do Seguro Social", "vagas": "1.000", "salario": "R$ 5.905,79", "escolaridade": "Nível Médio", "uf": "Nacional", "status": "previsto", "inscricao_inicio": "", "inscricao_fim": "", "data_prova": "", "link": "", "description": "Concurso previsto para reposição do quadro de servidores. Cargo de nível médio com uma das melhores remunerações iniciais do país."},
    {"orgao": "Polícia Federal", "banca": "CEBRASPE", "cargo": "Agente, Escrivão e Delegado", "vagas": "1.500", "salario": "até R$ 26.800,00", "escolaridade": "Nível Superior", "uf": "Nacional", "status": "previsto", "inscricao_inicio": "", "inscricao_fim": "", "data_prova": "", "link": "", "description": "Novo concurso previsto para diversas carreiras da Polícia Federal. Salários atrativos e ampla lotação nacional."},
    {"orgao": "Receita Federal do Brasil", "banca": "FGV", "cargo": "Auditor-Fiscal e Analista-Tributário", "vagas": "460", "salario": "até R$ 22.921,71", "escolaridade": "Nível Superior", "uf": "Nacional", "status": "edital", "inscricao_inicio": "", "inscricao_fim": "", "data_prova": "", "link": "", "description": "Edital publicado para as carreiras de Auditor-Fiscal e Analista-Tributário da Receita Federal. Prepare-se com foco na banca FGV."},
    {"orgao": "Tribunal Regional do Trabalho (TRT)", "banca": "FCC", "cargo": "Técnico e Analista Judiciário", "vagas": "Cadastro de reserva", "salario": "a partir de R$ 8.529,00", "escolaridade": "Médio e Superior", "uf": "Nacional", "status": "aberto", "inscricao_inicio": "", "inscricao_fim": "", "data_prova": "", "link": "", "description": "Inscrições abertas em diversas regiões dos Tribunais Regionais do Trabalho. Excelente oportunidade para carreira nos tribunais."},
    {"orgao": "Banco do Brasil", "banca": "CESGRANRIO", "cargo": "Escriturário - Agente Comercial e de TI", "vagas": "6.000", "salario": "R$ 3.622,23 + benefícios", "escolaridade": "Nível Médio", "uf": "Nacional", "status": "aberto", "inscricao_inicio": "", "inscricao_fim": "", "data_prova": "", "link": "", "description": "Concurso do Banco do Brasil com milhares de vagas para nível médio em todo o Brasil. Jornada de 6h e ótimos benefícios."},
    {"orgao": "Caixa Econômica Federal", "banca": "CESGRANRIO", "cargo": "Técnico Bancário Novo", "vagas": "4.000", "salario": "R$ 3.762,00 + benefícios", "escolaridade": "Nível Médio", "uf": "Nacional", "status": "previsto", "inscricao_inicio": "", "inscricao_fim": "", "data_prova": "", "link": "", "description": "Concurso previsto para o cargo de Técnico Bancário Novo da CAIXA, com vagas em todo o território nacional."},
    {"orgao": "Tribunal de Justiça de São Paulo (TJ-SP)", "banca": "VUNESP", "cargo": "Escrevente Técnico Judiciário", "vagas": "400", "salario": "R$ 5.914,04", "escolaridade": "Nível Superior", "uf": "SP", "status": "edital", "inscricao_inicio": "", "inscricao_fim": "", "data_prova": "", "link": "", "description": "Edital publicado para Escrevente Técnico Judiciário do maior tribunal da América Latina. Banca VUNESP."},
    {"orgao": "Polícia Rodoviária Federal (PRF)", "banca": "CEBRASPE", "cargo": "Policial Rodoviário Federal", "vagas": "750", "salario": "R$ 10.357,68", "escolaridade": "Nível Superior", "uf": "Nacional", "status": "previsto", "inscricao_inicio": "", "inscricao_fim": "", "data_prova": "", "link": "", "description": "Concurso previsto para Policial Rodoviário Federal. Carreira valorizada com atuação em todo o país."},
]

NOTICIAS = [
    {"title": "INSS confirma novo concurso com 1.000 vagas para nível médio", "category": "Concursos Federais", "image": IMG_GOV, "summary": "O Instituto Nacional do Seguro Social sinalizou a autorização de um novo certame para o cargo de Técnico do Seguro Social.", "content": "O Instituto Nacional do Seguro Social (INSS) segue entre os concursos mais aguardados do país. O cargo de Técnico do Seguro Social exige nível médio e oferece uma das melhores remunerações iniciais para esse nível de escolaridade.\n\nEnquanto o edital não sai, a orientação dos aprovados é começar os estudos pelo edital anterior, que costuma sofrer poucas alterações. As disciplinas mais importantes são Direito Previdenciário, Língua Portuguesa, Raciocínio Lógico e Ética no Serviço Público.\n\nNa TÔ APROVADO você encontra a apostila completa e atualizada para largar na frente."},
    {"title": "Receita Federal: edital publicado para Auditor e Analista", "category": "Área Fiscal", "image": IMG_LAW, "summary": "Foram autorizadas centenas de vagas para as carreiras de Auditor-Fiscal e Analista-Tributário, com banca FGV.", "content": "A Receita Federal do Brasil é o sonho de consumo de muitos concurseiros da área fiscal. Com salários que ultrapassam os R$ 22 mil, as carreiras de Auditor-Fiscal e Analista-Tributário atraem milhares de candidatos.\n\nA banca responsável é a FGV, conhecida por cobrar questões de alta complexidade em Direito Tributário, Contabilidade e Auditoria. O planejamento de estudos deve priorizar essas disciplinas de maior peso.\n\nConfira o material específico da TÔ APROVADO com foco no estilo FGV."},
    {"title": "Banco do Brasil abre inscrições para 6.000 vagas de Escriturário", "category": "Área Bancária", "image": IMG_ONLINE, "summary": "Concurso do BB oferece milhares de vagas para nível médio em todo o país, com banca CESGRANRIO.", "content": "O concurso do Banco do Brasil é uma das maiores oportunidades para quem busca uma carreira estável na área bancária. Com jornada de 6 horas e ótimos benefícios, o cargo de Escriturário exige apenas o nível médio.\n\nA banca CESGRANRIO cobra fortemente Conhecimentos Bancários, Atendimento, Vendas e Matemática Financeira, além das disciplinas básicas de Português e Informática.\n\nComece agora com o curso preparatório completo da TÔ APROVADO."},
    {"title": "Como escolher a banca certa para focar seus estudos", "category": "Dicas de Estudo", "image": IMG_NOTES, "summary": "Entender o estilo de cada banca (CEBRASPE, FGV, FCC, VUNESP) é decisivo para a sua aprovação.", "content": "Cada banca examinadora tem um estilo próprio de cobrar o conteúdo. Conhecer esse estilo é tão importante quanto dominar a matéria.\n\nA CEBRASPE (antigo CESPE) é famosa pelo modelo Certo/Errado, em que um erro anula um acerto. A FGV cobra questões longas e interpretativas. A FCC é conhecida pela literalidade da lei, e a VUNESP costuma valorizar a interpretação de texto.\n\nNa seção Bancas do nosso site você encontra o perfil detalhado de cada uma delas. Estude direcionado e aumente suas chances!"},
]

async def seed():
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    await db.users.delete_many({"role": "admin", "email": {"$ne": admin_email}})
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password),
                                   "name": "Administrador", "role": "admin",
                                   "created_at": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})
    if await db.categories.count_documents({}) == 0:
        for c in CATEGORIES:
            await db.categories.insert_one({"id": str(uuid.uuid4()), **c})
    if await db.products.count_documents({}) == 0:
        for p in PRODUCTS:
            doc = {"id": str(uuid.uuid4()), "slug": slugify(p["name"]), "active": True,
                   "banca": p.get("banca", ""), "type": p.get("type", "apostila"),
                   "pages": p.get("pages", 0), "format": p.get("format", "PDF"),
                   "author": p.get("author", ""), "download_url": "",
                   "featured": p.get("featured", False),
                   "created_at": datetime.now(timezone.utc).isoformat(), **p}
            await db.products.insert_one(doc)
    if await db.concursos.count_documents({}) == 0:
        for i, c in enumerate(CONCURSOS):
            doc = {"id": str(uuid.uuid4()), "active": True,
                   "created_at": (datetime.now(timezone.utc) - timedelta(minutes=i)).isoformat(), **c}
            await db.concursos.insert_one(doc)
    if await db.noticias.count_documents({}) == 0:
        for i, n in enumerate(NOTICIAS):
            doc = {"id": str(uuid.uuid4()), "slug": slugify(n["title"]), "active": True,
                   "created_at": (datetime.now(timezone.utc) - timedelta(minutes=i)).isoformat(), **n}
            await db.noticias.insert_one(doc)

@app.on_event("startup")
async def startup():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    try:
        init_storage()
        logger.info("Storage inicializado")
    except Exception as e:
        logger.error(f"Storage init falhou: {e}")
    await seed()
    logger.info("Seed concluído")

@app.on_event("shutdown")
async def shutdown():
    client.close()
