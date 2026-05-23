import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  Briefcase, Plus, Pencil, Trash2, Users, X, Loader2,
  CheckCircle, DollarSign, Clock, Tag, ChevronDown, ChevronUp,
  MessageSquare, Eye
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { db, getConversationId } from '@/api/supabaseData';

const STATUS_STYLES = {
  aberto: 'bg-green-400/10 text-green-400',
  em_andamento: 'bg-accent/10 text-accent',
  concluido: 'bg-primary/10 text-primary',
  cancelado: 'bg-red-400/10 text-red-400',
};

const CATEGORIAS = ['UI/UX Design', 'Desenvolvimento Web', 'Mobile', 'Branding', 'Marketing', 'Data Science', 'Backend', 'DevOps', 'Copywriting', 'Video & Motion', 'Outro'];

function EditJobModal({ job, onClose, onSaved }) {
  const [form, setForm] = useState({
    titulo: job.titulo || '',
    descricao: job.descricao || '',
    categoria: job.categoria || '',
    valor: job.valor || '',
    prazo: job.prazo || '',
    prioridade: job.prioridade || 'media',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await db.jobs.update(job.id, { ...form, valor: Number(form.valor || 0) });
      onSaved();
    } catch (err) {
      console.error('Update job error:', err);
      setError(err instanceof Error ? err.message : 'Nao foi possivel editar a vaga.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-xl text-foreground">Editar Vaga</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg glass flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          {error && <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Titulo *</Label>
              <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" value={form.titulo} onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Descricao</Label>
              <textarea className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={4} value={form.descricao} onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <select className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground" value={form.categoria} onChange={(event) => setForm((prev) => ({ ...prev, categoria: event.target.value }))}>
                  <option value="">Selecionar...</option>
                  {CATEGORIAS.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Prioridade</Label>
                <select className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground" value={form.prioridade} onChange={(event) => setForm((prev) => ({ ...prev, prioridade: event.target.value }))}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Orcamento (R$)</Label>
                <Input type="number" className="mt-1 bg-secondary/50 border-border/50 rounded-xl" value={form.valor} onChange={(event) => setForm((prev) => ({ ...prev, valor: event.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Prazo</Label>
                <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" value={form.prazo} onChange={(event) => setForm((prev) => ({ ...prev, prazo: event.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" onClick={onClose} className="rounded-xl border-border/50 flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl flex-1 gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><CheckCircle className="w-4 h-4" />Salvar</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicantCard({ proposal, job, onAccept, onReject, processing }) {
  const navigate = useNavigate();
  const [freelancer, setFreelancer] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadFreelancer = async () => {
      const identity = proposal.freelancer_id || proposal.freelancer_email;
      const [profile, freelancerStats] = await Promise.all([
        db.users.byIdentity(identity),
        db.freelancerStats.byEmail(identity),
      ]);
      setFreelancer(profile);
      setStats(freelancerStats);
    };

    loadFreelancer();
  }, [proposal.freelancer_id, proposal.freelancer_email]);

  const profileLink = freelancer?.user_id || freelancer?.email || proposal.freelancer_email || proposal.freelancer_id;
  const displayName = freelancer?.full_name || freelancer?.name || freelancer?.email || proposal.freelancer_email || 'Freelancer';
  const statusStyle = {
    pendente: 'bg-yellow-400/10 text-yellow-400',
    aceita: 'bg-green-400/10 text-green-400',
    recusada: 'bg-red-400/10 text-red-400',
    cancelada: 'bg-muted text-muted-foreground',
  };

  const openMessages = () => {
    const to = proposal.freelancer_email || proposal.freelancer_id;
    const conversationId = getConversationId(proposal.cliente_email, to, proposal.job_id);
    navigate(`/client/messages?to=${encodeURIComponent(to)}&toId=${encodeURIComponent(proposal.freelancer_id || '')}&job=${encodeURIComponent(proposal.job_id)}&conversation=${encodeURIComponent(conversationId)}`);
  };

  return (
    <div className="glass rounded-xl p-4 mt-2">
      <div className="flex flex-col sm:flex-row items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {freelancer?.foto_perfil || freelancer?.avatar_url
            ? <img src={freelancer.foto_perfil || freelancer.avatar_url} alt={displayName} className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-sm">{displayName[0]?.toUpperCase()}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="min-w-0 max-w-full break-words font-heading font-semibold text-foreground text-sm">{displayName}</span>
            {stats?.rank && <span className="max-w-full truncate text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{stats.rank}</span>}
            <span className={`max-w-full truncate text-xs px-2 py-0.5 rounded-full ${statusStyle[proposal.status] || 'bg-muted text-muted-foreground'}`}>{proposal.status}</span>
          </div>
          {stats?.profissao && <p className="text-xs text-muted-foreground mt-0.5 break-words">{stats.profissao}</p>}
          {proposal.mensagem && <p className="text-xs text-foreground/60 line-clamp-2 mt-1 break-words">{proposal.mensagem}</p>}
          {Number(proposal.valor_proposto) > 0 && (
            <p className="text-xs text-green-400 font-medium mt-1">Proposta: R${Number(proposal.valor_proposto).toLocaleString('pt-BR')}</p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 w-full sm:w-auto sm:flex-shrink-0">
          <Link
            className="min-w-0"
            to={`/profile/${encodeURIComponent(profileLink)}`}
            state={{ from: '/client/candidates', label: 'Voltar aos Candidatos' }}
          >
            <Button size="sm" variant="outline" className="w-full rounded-xl border-border/50 gap-1 text-xs">
              <Eye className="w-3 h-3" /> Ver Perfil
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={openMessages} className="w-full rounded-xl border-border/50 gap-1 text-xs">
            <MessageSquare className="w-3 h-3" /> Mensagem
          </Button>
          {proposal.status === 'pendente' && (
            <>
              <Button size="sm" disabled={processing === proposal.id} onClick={() => onAccept(proposal, job)}
                className="w-full bg-green-500/10 text-green-400 hover:bg-green-500/20 border-0 rounded-xl gap-1 text-xs">
                <CheckCircle className="w-3 h-3" /> Aceitar
              </Button>
              <Button size="sm" disabled={processing === proposal.id} onClick={() => onReject(proposal)}
                className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border-0 rounded-xl gap-1 text-xs">
                <X className="w-3 h-3" /> Recusar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [proposalsByJob, setProposalsByJob] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editJob, setEditJob] = useState(null);
  const [expandedJob, setExpandedJob] = useState(null);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    loadJobs();
  }, [user?.email]);

  const loadJobs = async () => {
    setLoading(true);
    setError('');

    try {
      const [myJobs, proposals] = await Promise.all([
        db.jobs.forClient(user.email),
        db.proposals.forClient(user.email),
      ]);
      const visibleJobs = myJobs.filter((job) => job.status !== 'cancelado');
      const proposalMap = {};

      visibleJobs.forEach((job) => {
        proposalMap[job.id] = proposals.filter((proposal) => proposal.job_id === job.id);
      });

      setJobs(visibleJobs);
      setProposalsByJob(proposalMap);
    } catch (err) {
      console.error('Client jobs load error:', err);
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar suas vagas.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (proposal, job) => {
    setProcessing(proposal.id);
    try {
      await db.proposals.update(proposal.id, { status: 'aceita' });
      await db.jobs.update(proposal.job_id, { status: 'em_andamento', freelancer_id: proposal.freelancer_id, freelancer_email: proposal.freelancer_email });

      const others = (proposalsByJob[proposal.job_id] || []).filter((item) => item.id !== proposal.id && item.status === 'pendente');
      await Promise.all(others.map((item) => db.proposals.delete(item.id)));

      await db.notifications.create({
        usuario_email: proposal.freelancer_email,
        tipo: 'proposta_aceita',
        titulo: 'Sua proposta foi aceita!',
        mensagem: `${user.full_name || user.email} aceitou sua candidatura para "${job?.titulo || 'uma vaga'}".`,
        lida: false,
        referencia_id: proposal.job_id,
        link: '/dashboard/jobs',
      });

      await loadJobs();
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (proposal) => {
    setProcessing(proposal.id);
    try {
      await db.proposals.delete(proposal.id);
      await loadJobs();
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Deletar a vaga "${job.titulo}"?`)) return;

    await db.jobs.delete(job.id);
    await loadJobs();
  };

  const handleMarkDone = async (job) => {
    await db.jobs.update(job.id, { status: 'concluido' });
    await loadJobs();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="font-heading font-bold text-2xl text-foreground">Minhas Vagas</h1></div>
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="glass rounded-2xl h-28 animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Minhas Vagas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {jobs.filter((job) => job.status === 'aberto').length} abertas · {jobs.filter((job) => job.status === 'em_andamento').length} em andamento · {jobs.filter((job) => job.status === 'concluido').length} concluidas
          </p>
        </div>
        <Link to="/client/create-job">
          <Button className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Nova Vaga
          </Button>
        </Link>
      </div>

      {error && <div className="glass rounded-2xl p-4 text-sm text-destructive">{error}</div>}

      {jobs.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="font-heading font-semibold text-foreground mb-2">Nenhuma vaga publicada ainda</h3>
          <p className="text-sm text-muted-foreground mb-6">Publique sua primeira vaga para comecar a receber candidaturas.</p>
          <Link to="/client/create-job">
            <Button className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Publicar Primeira Vaga
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const proposals = proposalsByJob[job.id] || [];
            const pending = proposals.filter((proposal) => proposal.status === 'pendente').length;
            const isExpanded = expandedJob === job.id;

            return (
              <div key={job.id} className="glass rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold text-foreground">{job.titulo}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[job.status] || 'bg-muted text-muted-foreground'}`}>
                        {job.status?.replace('_', ' ')}
                      </span>
                      {pending > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                          <Users className="w-3 h-3" />{pending} novo{pending > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{job.descricao}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {Number(job.valor) > 0 && <span className="flex items-center gap-1 text-green-400"><DollarSign className="w-3 h-3" />R${Number(job.valor).toLocaleString('pt-BR')}</span>}
                      {job.prazo && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.prazo}</span>}
                      {job.categoria && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{job.categoria}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {proposals.length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                        className="rounded-xl border-border/50 gap-1 text-xs">
                        <Users className="w-3 h-3" />
                        {proposals.length} candidato{proposals.length > 1 ? 's' : ''}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                    )}
                    {job.status === 'aberto' && (
                      <Button size="sm" variant="outline" onClick={() => setEditJob(job)} className="rounded-xl border-border/50 gap-1 text-xs">
                        <Pencil className="w-3 h-3" /> Editar
                      </Button>
                    )}
                    {job.status === 'em_andamento' && (
                      <Button size="sm" onClick={() => handleMarkDone(job)} className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-0 rounded-xl gap-1 text-xs">
                        <CheckCircle className="w-3 h-3" /> Concluir
                      </Button>
                    )}
                    <Button size="sm" onClick={() => handleDelete(job)}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-0 rounded-xl gap-1 text-xs">
                      <Trash2 className="w-3 h-3" /> Deletar
                    </Button>
                  </div>
                </div>

                {isExpanded && proposals.length > 0 && (
                  <div className="mt-3 border-t border-border/30 pt-3 space-y-0">
                    <p className="text-xs text-muted-foreground mb-2">Candidatos ({proposals.length})</p>
                    {proposals.map((proposal) => (
                      <ApplicantCard
                        key={proposal.id}
                        proposal={proposal}
                        job={job}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        processing={processing}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editJob && (
        <EditJobModal job={editJob} onClose={() => setEditJob(null)} onSaved={() => { setEditJob(null); loadJobs(); }} />
      )}
    </div>
  );
}
