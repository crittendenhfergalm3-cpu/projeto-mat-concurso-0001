import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, fileUrl, formatBRL } from "@/lib/api";
import { toast } from "sonner";

const empty = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  unit: "un",
  brand: "",
  images: [],
  featured: false,
  active: true,
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get("/products", { params: { limit: 200 } }).then((r) => setProducts(r.data.products));
  }, []);

  useEffect(() => {
    load();
    api.get("/categories").then((r) => setCats(r.data));
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...p, price: String(p.price), stock: String(p.stock) });
    setOpen(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, images: [...f.images, r.data.url] }));
      toast.success("Imagem enviada");
    } catch {
      toast.error("Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const save = async () => {
    if (!form.name || !form.price || !form.category) {
      toast.error("Preencha nome, preço e categoria");
      return;
    }
    setSaving(true);
    const body = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock || "0", 10),
    };
    try {
      if (editing) await api.put(`/products/${editing.id}`, body);
      else await api.post("/products", body);
      toast.success(editing ? "Produto atualizado" : "Produto criado");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Remover "${p.name}"?`)) return;
    await api.delete(`/products/${p.id}`);
    toast.success("Produto removido");
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Produtos ({products.length})</h1>
        <Button onClick={openNew} className="gap-2 bg-orange-600 hover:bg-orange-700" data-testid="new-product-button">
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} data-testid={`admin-product-${p.id}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={fileUrl(p.images?.[0])} alt="" className="h-10 w-10 rounded border border-gray-200 object-cover" />
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category}</td>
                <td className="px-4 py-3 font-semibold">{formatBRL(p.price)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`edit-product-${p.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p)} className="text-red-600" data-testid={`delete-product-${p.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              Preencha os dados do produto. Nome, preço e categoria são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="form-name" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="form-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$) *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} data-testid="form-price" />
              </div>
              <div>
                <Label>Estoque</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} data-testid="form-stock" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="form-category"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="un, saco, m²..." data-testid="form-unit" />
              </div>
            </div>
            <div>
              <Label>Marca</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} data-testid="form-brand" />
            </div>
            <div>
              <Label>Imagens</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative h-16 w-16">
                    <img src={fileUrl(img)} alt="" className="h-16 w-16 rounded border border-gray-200 object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded border border-dashed border-gray-300 text-gray-400 hover:border-orange-500 hover:text-orange-500">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid="form-image-upload" />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} data-testid="form-featured" />
              <Label>Produto em destaque</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-orange-600 hover:bg-orange-700" data-testid="save-product-button">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
