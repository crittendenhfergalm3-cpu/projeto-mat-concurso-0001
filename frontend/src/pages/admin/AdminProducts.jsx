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
  name: "", description: "", price: "", category: "", banca: "", type: "apostila",
  pages: "", format: "PDF", author: "", download_url: "", images: [], featured: false, active: true,
};

const TYPES = [
  { value: "apostila", label: "Apostila" },
  { value: "curso", label: "Curso" },
  { value: "combo", label: "Combo" },
];

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

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...empty, ...p, price: String(p.price), pages: String(p.pages || "") });
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
      toast.error("Preencha nome, preço e área");
      return;
    }
    setSaving(true);
    const body = { ...form, price: parseFloat(form.price), pages: parseInt(form.pages || "0", 10) };
    try {
      if (editing) await api.put(`/products/${editing.id}`, body);
      else await api.post("/products", body);
      toast.success(editing ? "Material atualizado" : "Material criado");
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
    toast.success("Material removido");
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900">Materiais ({products.length})</h1>
        <Button onClick={openNew} className="gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="new-product-button">
          <Plus className="h-4 w-4" /> Novo material
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Banca</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} data-testid={`admin-product-${p.id}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={fileUrl(p.images?.[0])} alt="" className="h-10 w-10 rounded border border-slate-200 object-cover" />
                    <span className="font-medium text-slate-900">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.category}</td>
                <td className="px-4 py-3 text-slate-600">{p.banca || "—"}</td>
                <td className="px-4 py-3 font-semibold">{formatBRL(p.price)}</td>
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
            <DialogTitle>{editing ? "Editar material" : "Novo material"}</DialogTitle>
            <DialogDescription>Nome, preço e área são obrigatórios.</DialogDescription>
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
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger data-testid="form-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Área *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="form-category"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{cats.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Banca</Label>
                <Input value={form.banca} onChange={(e) => setForm({ ...form, banca: e.target.value })} placeholder="CEBRASPE, FGV..." data-testid="form-banca" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Formato</Label>
                <Input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} placeholder="PDF, Videoaulas..." data-testid="form-format" />
              </div>
              <div>
                <Label>Páginas</Label>
                <Input type="number" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} data-testid="form-pages" />
              </div>
            </div>
            <div>
              <Label>Autor</Label>
              <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} data-testid="form-author" />
            </div>
            <div>
              <Label>Link de download/acesso (entregue ao aluno)</Label>
              <Input value={form.download_url} onChange={(e) => setForm({ ...form, download_url: e.target.value })} placeholder="https://..." data-testid="form-download" />
            </div>
            <div>
              <Label>Imagem de capa</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative h-16 w-16">
                    <img src={fileUrl(img)} alt="" className="h-16 w-16 rounded border border-slate-200 object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded border border-dashed border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-500">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid="form-image-upload" />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} data-testid="form-featured" />
              <Label>Material em destaque</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700" data-testid="save-product-button">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
