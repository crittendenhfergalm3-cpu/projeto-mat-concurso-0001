import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { STATUS_META, STATUS_OPTIONS } from "@/data/status";
import { toast } from "sonner";

const empty = {
  orgao: "", banca: "", cargo: "", vagas: "", salario: "", escolaridade: "",
  uf: "Nacional", status: "previsto", inscricao_inicio: "", inscricao_fim: "",
  data_prova: "", link: "", description: "", active: true,
};

const AdminConcursos = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get("/concursos").then((r) => setItems(r.data));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...empty, ...c }); setOpen(true); };

  const save = async () => {
    if (!form.orgao) { toast.error("Informe o órgão"); return; }
    setSaving(true);
    try {
      if (editing) await api.put(`/concursos/${editing.id}`, form);
      else await api.post("/concursos", form);
      toast.success(editing ? "Concurso atualizado" : "Concurso criado");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Remover o concurso "${c.orgao}"?`)) return;
    await api.delete(`/concursos/${c.id}`);
    toast.success("Concurso removido");
    load();
  };

  const field = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900">Concursos ({items.length})</h1>
        <Button onClick={openNew} className="gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="new-concurso-button">
          <Plus className="h-4 w-4" /> Novo concurso
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Órgão / Cargo</th>
              <th className="px-4 py-3">Banca</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((c) => {
              const st = STATUS_META[c.status] || STATUS_META.previsto;
              return (
                <tr key={c.id} data-testid={`admin-concurso-${c.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.orgao}</div>
                    <div className="text-xs text-slate-500">{c.cargo}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.banca || "—"}</td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${st.badge}`}>{st.label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)} data-testid={`edit-concurso-${c.id}`}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(c)} className="text-red-600" data-testid={`delete-concurso-${c.id}`}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar concurso" : "Novo concurso"}</DialogTitle>
            <DialogDescription>Órgão é obrigatório.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Órgão *</Label><Input value={form.orgao} onChange={field("orgao")} data-testid="concurso-orgao" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cargo</Label><Input value={form.cargo} onChange={field("cargo")} /></div>
              <div><Label>Banca</Label><Input value={form.banca} onChange={field("banca")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Vagas</Label><Input value={form.vagas} onChange={field("vagas")} /></div>
              <div><Label>Salário</Label><Input value={form.salario} onChange={field("salario")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Escolaridade</Label><Input value={form.escolaridade} onChange={field("escolaridade")} /></div>
              <div><Label>UF</Label><Input value={form.uf} onChange={field("uf")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger data-testid="concurso-status"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data da prova</Label><Input value={form.data_prova} onChange={field("data_prova")} placeholder="dd/mm/aaaa" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Inscrição início</Label><Input value={form.inscricao_inicio} onChange={field("inscricao_inicio")} /></div>
              <div><Label>Inscrição fim</Label><Input value={form.inscricao_fim} onChange={field("inscricao_fim")} /></div>
            </div>
            <div><Label>Link do edital</Label><Input value={form.link} onChange={field("link")} placeholder="https://..." /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={field("description")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700" data-testid="save-concurso-button">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminConcursos;
