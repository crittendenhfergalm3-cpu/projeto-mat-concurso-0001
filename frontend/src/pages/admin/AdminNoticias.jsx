import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { api, fileUrl } from "@/lib/api";
import { toast } from "sonner";

const empty = { title: "", category: "Concursos", summary: "", content: "", image: "", active: true };

const AdminNoticias = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    api.get("/noticias").then((r) => setItems(r.data));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (n) => { setEditing(n); setForm({ ...empty, ...n }); setOpen(true); };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, image: r.data.url }));
      toast.success("Imagem enviada");
    } catch {
      toast.error("Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title) { toast.error("Informe o título"); return; }
    setSaving(true);
    try {
      if (editing) await api.put(`/noticias/${editing.id}`, form);
      else await api.post("/noticias", form);
      toast.success(editing ? "Notícia atualizada" : "Notícia criada");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (n) => {
    if (!window.confirm(`Remover "${n.title}"?`)) return;
    await api.delete(`/noticias/${n.id}`);
    toast.success("Notícia removida");
    load();
  };

  const field = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900">Notícias ({items.length})</h1>
        <Button onClick={openNew} className="gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="new-noticia-button">
          <Plus className="h-4 w-4" /> Nova notícia
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((n) => (
              <tr key={n.id} data-testid={`admin-noticia-${n.id}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {n.image && <img src={fileUrl(n.image)} alt="" className="h-10 w-14 rounded border border-slate-200 object-cover" />}
                    <span className="font-medium text-slate-900">{n.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{n.category}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(n)} data-testid={`edit-noticia-${n.id}`}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(n)} className="text-red-600" data-testid={`delete-noticia-${n.id}`}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Editar notícia" : "Nova notícia"}</DialogTitle>
            <DialogDescription>Título é obrigatório.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={form.title} onChange={field("title")} data-testid="noticia-title" /></div>
            <div><Label>Categoria</Label><Input value={form.category} onChange={field("category")} /></div>
            <div><Label>Resumo</Label><Textarea value={form.summary} onChange={field("summary")} /></div>
            <div><Label>Conteúdo</Label><Textarea value={form.content} onChange={field("content")} className="min-h-32" /></div>
            <div>
              <Label>Imagem</Label>
              <div className="mt-2 flex items-center gap-3">
                {form.image && <img src={fileUrl(form.image)} alt="" className="h-16 w-24 rounded border border-slate-200 object-cover" />}
                <label className="flex h-16 w-24 cursor-pointer items-center justify-center rounded border border-dashed border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-500">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid="noticia-image-upload" />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700" data-testid="save-noticia-button">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNoticias;
