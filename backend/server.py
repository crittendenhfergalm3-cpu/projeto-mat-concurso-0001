from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
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
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "São José Material de Construção")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL")

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "saojose"

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

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    icon: str = "package"
    image: str = ""

class ProductIn(BaseModel):
    name: str
    description: str = ""
    price: float
    stock: int = 0
    category: str
    unit: str = "un"
    brand: str = ""
    sku: str = ""
    images: List[str] = []
    featured: bool = False
    active: bool = True

class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(1, ge=1, le=999)

class CustomerInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    cep: str = ""
    address: str = ""

class CheckoutRequest(BaseModel):
    items: List[CartItem]
    customer: CustomerInfo
    shipping_cost: float = 0.0
    shipping_label: str = ""
    origin_url: str

class WhatsAppOrderRequest(BaseModel):
    items: List[CartItem]
    customer: CustomerInfo
    shipping_cost: float = 0.0
    shipping_label: str = ""

class ShippingRequest(BaseModel):
    cep: str
    subtotal: float = 0.0

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

# --- Categories ---
@api_router.get("/categories")
async def get_categories():
    cats = await db.categories.find({}, {"_id": 0}).to_list(100)
    for c in cats:
        c["count"] = await db.products.count_documents({"category": c["slug"], "active": True})
    return cats

# --- Products ---
@api_router.get("/products")
async def get_products(category: Optional[str] = None, search: Optional[str] = None,
                       sort: Optional[str] = "recent", featured: Optional[bool] = None,
                       page: int = 1, limit: int = 24):
    query = {"active": True}
    if category:
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    if search:
        esc = re.escape(search)
        query["$or"] = [{"name": {"$regex": esc, "$options": "i"}},
                        {"description": {"$regex": esc, "$options": "i"}},
                        {"brand": {"$regex": esc, "$options": "i"}}]
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
        raise HTTPException(status_code=404, detail="Produto não encontrado")
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
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    update = body.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update})
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return doc

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    await db.products.update_one({"id": product_id}, {"$set": {"active": False}})
    return {"status": "ok"}

# --- Shipping (mock, CEP based) ---
@api_router.post("/shipping/calculate")
async def calculate_shipping(body: ShippingRequest):
    cep = re.sub(r'\D', '', body.cep)
    if len(cep) != 8:
        raise HTTPException(status_code=400, detail="CEP inválido. Digite 8 dígitos.")
    options = []
    is_local = cep.startswith("650") or cep.startswith("651") or cep.startswith("652")
    if is_local:
        free = body.subtotal >= 300
        options.append({"label": "Entrega local (São Luís e região)",
                        "cost": 0.0 if free else 25.0, "days": "1 a 2 dias úteis", "free": free})
        options.append({"label": "Retirar na loja (Parque Atlântico)", "cost": 0.0, "days": "Pronto em 2h", "free": True})
    else:
        base = 45.0 + (0 if body.subtotal < 500 else 20.0)
        options.append({"label": "Transportadora - Padrão", "cost": base, "days": "5 a 10 dias úteis", "free": False})
        options.append({"label": "Transportadora - Expressa", "cost": base + 35.0, "days": "3 a 5 dias úteis", "free": False})
    return {"cep": cep, "local": is_local, "options": options}

# --- Order helpers ---
async def build_order_items(items: List[CartItem]):
    order_items = []
    subtotal = 0.0
    for it in items:
        product = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Produto indisponível")
        line = {"product_id": product["id"], "name": product["name"], "price": product["price"],
                "quantity": it.quantity, "image": product["images"][0] if product.get("images") else ""}
        subtotal += product["price"] * it.quantity
        order_items.append(line)
    return order_items, round(subtotal, 2)

def gen_order_number():
    return "SJ" + datetime.now().strftime("%y%m%d") + str(random.randint(1000, 9999))

async def send_order_email(order: dict):
    if not EMAIL_KEY:
        return
    rows = "".join([
        f"<tr><td style='padding:8px;border-bottom:1px solid #eee'>{i['name']} x{i['quantity']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>R$ {i['price']*i['quantity']:.2f}</td></tr>"
        for i in order["items"]])
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#EA580C;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">São José Material de Construção</h1>
      </div>
      <div style="padding:24px;color:#111">
        <h2 style="margin-top:0">Pedido confirmado! 🧱</h2>
        <p>Olá {order['customer']['name']}, recebemos o seu pedido <strong>#{order['order_number']}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">{rows}
          <tr><td style="padding:8px">Frete ({order.get('shipping_label','')})</td><td style="padding:8px;text-align:right">R$ {order['shipping_cost']:.2f}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold">R$ {order['total']:.2f}</td></tr>
        </table>
        <p>Em breve entraremos em contato pelo telefone {order['customer']['phone']} para combinar a entrega.</p>
        <p style="color:#666;font-size:12px">SAO JOSE MATERIAL DE CONSTRUCAO LTDA - ME · CNPJ 60.219.119/0001-81<br>Av. Vale do Pimenta, 5 - Parque Atlântico, São Luís/MA</p>
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
    total = round(subtotal + body.shipping_cost, 2)
    order_number = gen_order_number()

    line_items = [{
        "price_data": {"currency": "brl", "unit_amount": int(round(i["price"] * 100)),
                       "product_data": {"name": i["name"]}},
        "quantity": i["quantity"]} for i in order_items]
    if body.shipping_cost > 0:
        line_items.append({"price_data": {"currency": "brl", "unit_amount": int(round(body.shipping_cost * 100)),
                                          "product_data": {"name": f"Frete - {body.shipping_label}"}}, "quantity": 1})

    session = stripe.checkout.Session.create(
        line_items=line_items, mode="payment",
        success_url=f"{body.origin_url}/pagamento/sucesso?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{body.origin_url}/pagamento/cancelado",
        metadata={"order_number": order_number},
    )

    order = {"id": str(uuid.uuid4()), "order_number": order_number, "items": order_items,
             "customer": body.customer.model_dump(), "subtotal": subtotal,
             "shipping_cost": body.shipping_cost, "shipping_label": body.shipping_label,
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
    total = round(subtotal + body.shipping_cost, 2)
    order_number = gen_order_number()
    order = {"id": str(uuid.uuid4()), "order_number": order_number, "items": order_items,
             "customer": body.customer.model_dump(), "subtotal": subtotal,
             "shipping_cost": body.shipping_cost, "shipping_label": body.shipping_label,
             "total": total, "method": "whatsapp", "status": "novo", "payment_status": "a_combinar",
             "created_at": datetime.now(timezone.utc).isoformat(),
             "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.orders.insert_one(order)
    lines = "\n".join([f"• {i['quantity']}x {i['name']} - R$ {i['price']*i['quantity']:.2f}" for i in order_items])
    msg = (f"*Novo pedido #{order_number}*\n\n{lines}\n\n"
           f"Frete: {body.shipping_label or 'a combinar'} - R$ {body.shipping_cost:.2f}\n"
           f"*Total: R$ {total:.2f}*\n\n"
           f"Cliente: {body.customer.name}\nTelefone: {body.customer.phone}\n"
           f"CEP: {body.customer.cep}\nEndereço: {body.customer.address}")
    return {"order_number": order_number, "message": msg}

# --- Admin ---
@api_router.get("/admin/orders")
async def admin_orders(admin: dict = Depends(get_current_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders

@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_current_admin)):
    total_products = await db.products.count_documents({"active": True})
    total_orders = await db.orders.count_documents({})
    paid_orders = await db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(1000)
    revenue = sum(o["total"] for o in paid_orders)
    pending = await db.orders.count_documents({"status": {"$in": ["pending", "novo"]}})
    return {"total_products": total_products, "total_orders": total_orders,
            "revenue": round(revenue, 2), "pending": pending}

@api_router.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/products/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    await db.files.insert_one({"id": str(uuid.uuid4()), "storage_path": result["path"],
                               "content_type": file.content_type, "is_deleted": False,
                               "created_at": datetime.now(timezone.utc).isoformat()})
    backend = os.environ.get("REACT_APP_BACKEND_URL", "")
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

@api_router.get("/")
async def root():
    return {"message": "São José Material de Construção API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Seed data ---
CATEGORIES = [
    {"name": "Cimento e Argamassa", "slug": "cimento-argamassa", "icon": "layers", "image": "https://images.unsplash.com/photo-1773394089934-3e29f2a3d6a9?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"},
    {"name": "Tijolos e Blocos", "slug": "tijolos-blocos", "icon": "grid-3x3", "image": "https://images.unsplash.com/photo-1771575522109-caee5ff9e8b3?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"},
    {"name": "Hidráulica", "slug": "hidraulica", "icon": "droplets", "image": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"},
    {"name": "Elétrica", "slug": "eletrica", "icon": "zap", "image": "https://images.unsplash.com/photo-1518181835702-6eef8b4b2113?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"},
    {"name": "Tintas e Acessórios", "slug": "tintas", "icon": "paint-bucket", "image": "https://images.unsplash.com/photo-1602740027538-35973ec88b9e?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"},
    {"name": "Ferramentas", "slug": "ferramentas", "icon": "wrench", "image": "https://images.unsplash.com/photo-1645651964715-d200ce0939cc?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"},
    {"name": "Pisos e Revestimentos", "slug": "pisos-revestimentos", "icon": "square", "image": "https://images.unsplash.com/photo-1706629503586-2731f65587ae?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"},
    {"name": "Ferragens e Fixação", "slug": "ferragens", "icon": "bolt", "image": "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"},
]

CEMENT = "https://images.unsplash.com/photo-1730627283177-f43b83c3850c?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
BRICK = "https://images.unsplash.com/photo-1771575522109-caee5ff9e8b3?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
PLUMB = "https://images.unsplash.com/photo-1545193329-4a052e14eb8f?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
ELEC = "https://images.unsplash.com/photo-1601462904263-f2fa0c851cb9?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
PAINT = "https://images.unsplash.com/photo-1643822308521-1da534425d82?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
TOOL = "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
TOOL2 = "https://images.unsplash.com/photo-1606676539940-12768ce0e762?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"
TILE = "https://images.unsplash.com/photo-1706629503586-2731f65587ae?crop=entropy&cs=srgb&fm=jpg&w=800&q=80&ixlib=rb-4.1.0"

PRODUCTS = [
    {"name": "Cimento CP-II 50kg", "category": "cimento-argamassa", "price": 39.90, "stock": 500, "unit": "saco", "brand": "Votoran", "featured": True, "images": [CEMENT], "description": "Saco de cimento Portland CP-II 50kg, ideal para concreto, argamassa e assentamento. Alta resistência e pega uniforme."},
    {"name": "Argamassa AC-I 20kg", "category": "cimento-argamassa", "price": 18.50, "stock": 300, "unit": "saco", "brand": "Quartzolit", "images": [CEMENT], "description": "Argamassa colante interna AC-I para assentamento de cerâmica em ambientes internos."},
    {"name": "Cal Hidratada 20kg", "category": "cimento-argamassa", "price": 15.90, "stock": 200, "unit": "saco", "brand": "Itaú", "images": [CEMENT], "description": "Cal hidratada CH-III para reboco e argamassa. Rende mais e deixa a massa fina."},
    {"name": "Tijolo Cerâmico 8 furos", "category": "tijolos-blocos", "price": 1.20, "stock": 10000, "unit": "un", "brand": "Cerâmica São Luís", "featured": True, "images": [BRICK], "description": "Tijolo cerâmico 9x19x19cm, 8 furos. Leve, resistente e ótimo isolamento térmico."},
    {"name": "Bloco de Concreto 14x19x39", "category": "tijolos-blocos", "price": 3.80, "stock": 5000, "unit": "un", "brand": "Bloco Forte", "images": [BRICK], "description": "Bloco estrutural de concreto para alvenaria. Alta resistência à compressão."},
    {"name": "Tijolo Baiano 6 furos", "category": "tijolos-blocos", "price": 0.95, "stock": 8000, "unit": "un", "brand": "Cerâmica Norte", "images": [BRICK], "description": "Tijolo baiano de vedação 9x14x19cm, 6 furos. Econômico para paredes internas."},
    {"name": "Tubo PVC Esgoto 100mm 6m", "category": "hidraulica", "price": 89.90, "stock": 150, "unit": "barra", "brand": "Tigre", "featured": True, "images": [PLUMB], "description": "Tubo de PVC para esgoto série normal 100mm, barra de 6 metros. Ponta e bolsa."},
    {"name": "Joelho PVC 90° 25mm", "category": "hidraulica", "price": 2.30, "stock": 800, "unit": "un", "brand": "Tigre", "images": [PLUMB], "description": "Conexão joelho 90 graus soldável 25mm para água fria."},
    {"name": "Registro de Gaveta 3/4\"", "category": "hidraulica", "price": 34.90, "stock": 120, "unit": "un", "brand": "Deca", "images": [PLUMB], "description": "Registro de gaveta bruto 3/4 polegada em bronze. Durável e resistente."},
    {"name": "Caixa d'água 500L", "category": "hidraulica", "price": 289.00, "stock": 40, "unit": "un", "brand": "Fortlev", "images": [PLUMB], "description": "Caixa d'água de polietileno 500 litros com tampa. Proteção UV e atóxica."},
    {"name": "Fio Flexível 2,5mm 100m", "category": "eletrica", "price": 179.90, "stock": 90, "unit": "rolo", "brand": "Sil", "featured": True, "images": [ELEC], "description": "Rolo de cabo flexível 2,5mm² 750V, 100 metros. Cobre eletrolítico, antichama."},
    {"name": "Disjuntor Bipolar 40A", "category": "eletrica", "price": 42.00, "stock": 130, "unit": "un", "brand": "Steck", "images": [ELEC], "description": "Disjuntor termomagnético bipolar 40A padrão DIN. Proteção do circuito."},
    {"name": "Tomada 2P+T 10A c/ Placa", "category": "eletrica", "price": 12.90, "stock": 400, "unit": "un", "brand": "Pial", "images": [ELEC], "description": "Conjunto tomada 2P+T 10A com placa 4x2. Padrão brasileiro."},
    {"name": "Lâmpada LED 9W", "category": "eletrica", "price": 8.90, "stock": 600, "unit": "un", "brand": "Osram", "images": [ELEC], "description": "Lâmpada LED bulbo 9W 6500K luz branca. Economia de até 80%."},
    {"name": "Tinta Acrílica Branca 18L", "category": "tintas", "price": 219.90, "stock": 80, "unit": "lata", "brand": "Suvinil", "featured": True, "images": [PAINT], "description": "Tinta acrílica premium fosca branca 18 litros. Alta cobertura, lavável."},
    {"name": "Rolo de Lã 23cm + Bandeja", "category": "tintas", "price": 24.90, "stock": 250, "unit": "kit", "brand": "Atlas", "images": [PAINT], "description": "Kit rolo de lã anti-gota 23cm com cabo e bandeja plástica."},
    {"name": "Massa Corrida PVA 25kg", "category": "tintas", "price": 45.90, "stock": 110, "unit": "balde", "brand": "Coral", "images": [PAINT], "description": "Massa corrida PVA para correção de paredes internas. Fácil lixamento."},
    {"name": "Furadeira de Impacto 650W", "category": "ferramentas", "price": 249.00, "stock": 60, "unit": "un", "brand": "Bosch", "featured": True, "images": [TOOL, TOOL2], "description": "Furadeira de impacto 650W mandril 13mm. Perfura concreto, madeira e metal."},
    {"name": "Betoneira 400L 2HP", "category": "ferramentas", "price": 2890.00, "stock": 12, "unit": "un", "brand": "Menegotti", "featured": True, "images": [TOOL2], "description": "Betoneira 400 litros motor 2HP monofásico. Ideal para obras médias."},
    {"name": "Jogo de Chaves de Fenda 6 peças", "category": "ferramentas", "price": 39.90, "stock": 180, "unit": "kit", "brand": "Tramontina", "images": [TOOL], "description": "Kit com 6 chaves de fenda e Phillips com cabo ergonômico."},
    {"name": "Trena 5m", "category": "ferramentas", "price": 19.90, "stock": 300, "unit": "un", "brand": "Starrett", "images": [TOOL], "description": "Trena de aço 5 metros com trava e clipe de cinto."},
    {"name": "Porcelanato 60x60 Acetinado (cx 2,16m²)", "category": "pisos-revestimentos", "price": 89.90, "stock": 220, "unit": "caixa", "brand": "Portinari", "featured": True, "images": [TILE], "description": "Caixa de porcelanato acetinado 60x60cm, rende 2,16m². Alto padrão."},
    {"name": "Piso Cerâmico 45x45 (cx 2m²)", "category": "pisos-revestimentos", "price": 39.90, "stock": 300, "unit": "caixa", "brand": "Cecrisa", "images": [TILE], "description": "Piso cerâmico esmaltado 45x45cm, rende 2m² por caixa. Uso residencial."},
    {"name": "Rejunte Flexível 1kg", "category": "pisos-revestimentos", "price": 9.90, "stock": 400, "unit": "un", "brand": "Quartzolit", "images": [TILE], "description": "Rejunte acrílico flexível 1kg. Diversas cores, antimofo."},
    {"name": "Prego 17x27 1kg", "category": "ferragens", "price": 14.90, "stock": 500, "unit": "kg", "brand": "Gerdau", "images": [TOOL], "description": "Prego com cabeça 17x27, pacote de 1kg. Aço polido."},
    {"name": "Parafuso Bucha 6mm (100un)", "category": "ferragens", "price": 18.90, "stock": 260, "unit": "pacote", "brand": "Fischer", "featured": True, "images": [TOOL], "description": "Kit 100 parafusos com bucha 6mm para fixação em alvenaria."},
    {"name": "Cadeado 40mm", "category": "ferragens", "price": 22.90, "stock": 140, "unit": "un", "brand": "Pado", "images": [TOOL], "description": "Cadeado de latão 40mm com 3 chaves. Alta segurança."},
    {"name": "Dobradiça 3\" (par)", "category": "ferragens", "price": 11.90, "stock": 320, "unit": "par", "brand": "La Fonte", "images": [TOOL], "description": "Par de dobradiças 3 polegadas em aço zincado com parafusos."},
]

async def seed():
    # admin
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password),
                                   "name": "Administrador", "role": "admin",
                                   "created_at": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})
    # categories
    if await db.categories.count_documents({}) == 0:
        for c in CATEGORIES:
            await db.categories.insert_one({"id": str(uuid.uuid4()), **c})
    # products
    if await db.products.count_documents({}) == 0:
        for p in PRODUCTS:
            doc = {"id": str(uuid.uuid4()), "slug": slugify(p["name"]), "active": True,
                   "sku": "", "featured": p.get("featured", False),
                   "created_at": datetime.now(timezone.utc).isoformat(), **p}
            await db.products.insert_one(doc)

@app.on_event("startup")
async def startup():
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
