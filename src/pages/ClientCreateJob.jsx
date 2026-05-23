import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Loader2, ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { db } from '@/api/supabaseData';

const CATEGORIAS = ['UI/UX Design', 'Desenvolvimento Web', 'Mobile', 'Branding', 'Marketing', 'Data Science', 'Backend', 'DevOps', 'Copywriting', 'Video & Motion', 'Outro'];

export default function ClientCreateJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    valor: '',
    prazo: '',
    prioridade: 'media',
  });
  const [habilidade, setHabilidade] = useState('');
  const [habilidades, setHabilidades] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addHabilidade = () => {
    const value = habilidade.trim();
    if (value && !habilidades.includes(value)) {
      setHabilidades((prev) => [...prev, value]);
    }
    setHabilidade('');
  };

  const handleSubmit = async () => {
    if (!form.titulo.trim() || !form.descricao.trim()) return;

    setSaving(true);
    setError('');

    try {
      const job = await db.jobs.create({
        ...form,
        valor: form.valor ? Number(form.valor) : 0,
        cliente_email: user.email,
        status: 'aberto',
        habilidades,
        propostas_count: 0,
      });

      await db.notifications.create({
        usuario_email: user.email,
        tipo: 'novo_job',
        titulo: 'Vaga publicada com sucesso!',
        mensagem: `Sua vaga "${form.titulo}" está ativa e visível para freelancers.`,
        lida: false,
        referencia_id: job.id,
        link: '/client/jobs',
      });

      navigate('/client/jobs');
    } catch (err) {
      console.error('Create job error:', err);
      setError(err?.message || err?.details || 'Não foi possível publicar a vaga.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/client/jobs">
          <button className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        </Link>
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Publicar Nova Vaga</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Encontre o freelancer ideal para seu projeto</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5">
        {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div>
          <Label className="text-xs text-muted-foreground">Título da Vaga *</Label>
          <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="Ex: Designer UI/UX para app mobile" value={form.titulo} onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))} />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Descrição Detalhada *</Label>
          <textarea
            className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            rows={5}
            placeholder="Descreva o projeto, responsabilidades, entregas esperadas..."
            value={form.descricao}
            onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <select
              className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={form.categoria}
              onChange={(event) => setForm((prev) => ({ ...prev, categoria: event.target.value }))}
            >
              <option value="">Selecionar...</option>
              {CATEGORIAS.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Prioridade</Label>
            <select
              className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={form.prioridade}
              onChange={(event) => setForm((prev) => ({ ...prev, prioridade: event.target.value }))}
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Orçamento (R$)</Label>
            <Input type="number" className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="0,00" value={form.valor} onChange={(event) => setForm((prev) => ({ ...prev, valor: event.target.value }))} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Prazo</Label>
            <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="Ex: 2 semanas, 30 dias..." value={form.prazo} onChange={(event) => setForm((prev) => ({ ...prev, prazo: event.target.value }))} />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Habilidades Necessárias</Label>
          <div className="flex gap-2 mt-1">
            <Input
              className="bg-secondary/50 border-border/50 rounded-xl"
              placeholder="Ex: React, Figma..."
              value={habilidade}
              onChange={(event) => setHabilidade(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addHabilidade();
                }
              }}
            />
            <Button type="button" size="icon" onClick={addHabilidade} className="rounded-xl bg-secondary border-0 h-9 w-9 flex-shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {habilidades.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {habilidades.map((skill) => (
                <span key={skill} className="flex items-center gap-1 text-xs glass rounded-full px-3 py-1 text-foreground">
                  {skill}
                  <button onClick={() => setHabilidades((prev) => prev.filter((item) => item !== skill))}><X className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/client/jobs" className="flex-1">
          <Button variant="outline" className="w-full rounded-xl border-border/50">Cancelar</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={saving || !form.titulo.trim() || !form.descricao.trim()}
          className="flex-1 bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Publicando...</> : <><Briefcase className="w-4 h-4" />Publicar Vaga</>}
        </Button>
      </div>
    </div>
  );
}
