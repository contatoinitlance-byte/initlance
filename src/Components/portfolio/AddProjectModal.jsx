import { useState, useRef } from 'react';
import { X, Upload, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { db } from '@/api/supabaseData';
import LinkPreviewCover from '@/Components/portfolio/LinkPreviewCover';

const CATEGORIAS = ['UI/UX Design', 'Desenvolvimento Web', 'Mobile', 'Branding', 'Marketing', 'Data Science', 'Backend', 'DevOps', 'Outro'];

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function AddProjectModal({ onClose, onSaved, project = null, userEmail }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    titulo: project?.titulo || '',
    descricao: project?.descricao || '',
    categoria: project?.categoria || '',
    tecnologias: project?.tecnologias?.join(', ') || '',
    link_projeto: project?.link_projeto || '',
    link_repositorio: project?.link_repositorio || '',
    resultado: project?.resultado || '',
    status: project?.status || 'publicado',
  });
  const [imagens, setImagens] = useState(project?.imagens || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');

    try {
      const urls = await Promise.all(files.map(readFileAsDataUrl));
      setImagens(prev => [...prev, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar as imagens.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      tecnologias: form.tecnologias.split(',').map(t => t.trim()).filter(Boolean),
      imagens,
    };

    try {
      if (isEdit) {
        await db.portfolios.update(project.id, payload);
      } else {
        await db.portfolios.create({ ...payload, user_email: userEmail, views: 0, saves: 0 });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel salvar o projeto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-xl text-foreground">{isEdit ? 'Editar Projeto' : 'Novo Projeto'}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-white/10">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <div>
              <Label className="text-xs text-muted-foreground">Título *</Label>
              <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="Nome do projeto" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <textarea
                className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3} placeholder="Descreva o projeto..." value={form.descricao}
                onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <select
                  className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <select
                  className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="publicado">Publicado</option>
                  <option value="rascunho">Rascunho</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Tecnologias (separadas por vírgula)</Label>
              <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="React, Node.js, Figma..." value={form.tecnologias} onChange={e => setForm(p => ({ ...p, tecnologias: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Link do Projeto</Label>
                <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="https://..." value={form.link_projeto} onChange={e => setForm(p => ({ ...p, link_projeto: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Repositório</Label>
                <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="github.com/..." value={form.link_repositorio} onChange={e => setForm(p => ({ ...p, link_repositorio: e.target.value }))} />
              </div>
            </div>

            {(form.link_projeto || form.link_repositorio) && imagens.length === 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Preview automatico do link</Label>
                <div className="mt-2 h-36 rounded-xl overflow-hidden border border-border/50">
                  <LinkPreviewCover projectUrl={form.link_projeto} repositoryUrl={form.link_repositorio} title={form.titulo || 'Projeto'} />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Resultados Obtidos</Label>
              <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="Ex: +40% conversão, 10k usuários..." value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} />
            </div>

            {/* Image upload */}
            <div>
              <Label className="text-xs text-muted-foreground">Imagens do Projeto</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {imagens.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setImagens(p => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                <button onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-xl glass border border-dashed border-border/50 flex flex-col items-center justify-center hover:bg-white/5 transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground mt-1">Upload</span></>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="rounded-xl border-border/50 flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.titulo.trim()} className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl flex-1 gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : isEdit ? 'Salvar Alterações' : 'Publicar Projeto'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
