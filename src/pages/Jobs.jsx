import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Search, Briefcase, Clock, DollarSign, Tag, Send } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { db } from '@/api/supabaseData';

const STATUS_STYLES = {
  aberto: 'bg-green-400/10 text-green-400',
  em_andamento: 'bg-accent/10 text-accent',
  concluido: 'bg-primary/10 text-primary',
  cancelado: 'bg-red-400/10 text-red-400',
};

const PRIORIDADE_STYLES = {
  baixa: 'text-muted-foreground',
  media: 'text-yellow-400',
  alta: 'text-orange-400',
  urgente: 'text-red-400',
};

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    loadData();
  }, [user?.email]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [openJobs, myProposals] = await Promise.all([
        db.jobs.open(),
        db.proposals.forFreelancer(user.email),
      ]);

      setJobs(openJobs.filter((job) => job.cliente_email !== user.email && job.client_id !== user.id));
      setProposals(myProposals);
    } catch (err) {
      console.error('Jobs load error:', err);
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar as vagas.');
    } finally {
      setLoading(false);
    }
  };

  const hasApplied = (jobId) => proposals.some((proposal) => proposal.job_id === jobId);

  const applyToJob = async (job) => {
    if (!user || hasApplied(job.id)) return;

    setApplying(job.id);
    setError('');

    try {
      const proposal = await db.proposals.create({
        job_id: job.id,
        freelancer_id: user.id,
        client_id: job.client_id,
        freelancer_email: user.email,
        cliente_email: job.cliente_email,
        valor_proposto: Number(job.valor || 0),
        prazo_proposto: job.prazo || '',
        status: 'pendente',
        mensagem: '',
      });

      try {
        await db.jobs.update(job.id, {
          propostas_count: Number(job.propostas_count || 0) + 1,
        });
      } catch (countError) {
        console.warn('Could not update proposal count:', countError);
      }

      await db.notifications.create({
        usuario_email: job.cliente_email,
        tipo: 'proposta_recebida',
        titulo: 'Nova proposta recebida',
        mensagem: `${user.full_name || user.email} enviou uma proposta para "${job.titulo}"`,
        lida: false,
        referencia_id: job.id,
        link: '/client/candidates',
      });

      setProposals((prev) => [...prev, proposal]);
    } catch (err) {
      console.error('Apply to job error:', err);
      setError(err instanceof Error ? err.message : 'Nao foi possivel enviar sua candidatura.');
    } finally {
      setApplying(null);
    }
  };

  const categories = [...new Set(jobs.map((job) => job.categoria).filter(Boolean))];
  const filtered = jobs.filter((job) => {
    const term = search.toLowerCase();
    const matchSearch = !term ||
      job.titulo?.toLowerCase().includes(term) ||
      job.descricao?.toLowerCase().includes(term);
    const matchCat = !filterCat || job.categoria === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Vagas Disponiveis</h1>
        <p className="text-sm text-muted-foreground mt-1">Encontre oportunidades alinhadas ao seu perfil</p>
      </div>

      {error && <div className="glass rounded-2xl p-4 text-sm text-destructive">{error}</div>}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar vagas..." className="pl-10 bg-secondary/50 border-0 rounded-xl" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {categories.length > 0 && (
          <select
            className="bg-secondary/50 border-0 rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={filterCat}
            onChange={(event) => setFilterCat(event.target.value)}
          >
            <option value="">Todas categorias</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="glass rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="font-heading font-semibold text-foreground mb-2">
            {jobs.length === 0 ? 'Nenhuma vaga disponivel no momento' : 'Nenhuma vaga encontrada'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {jobs.length === 0 ? 'Quando uma empresa publicar uma vaga aberta, ela aparecera aqui.' : 'Tente outros termos de busca.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div key={job.id} className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-heading font-semibold text-foreground">{job.titulo}</h3>
                    {job.prioridade && job.prioridade !== 'media' && (
                      <span className={`text-xs font-medium uppercase ${PRIORIDADE_STYLES[job.prioridade]}`}>{job.prioridade}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.descricao}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {Number(job.valor) > 0 && (
                      <span className="flex items-center gap-1 text-green-400 font-medium">
                        <DollarSign className="w-3 h-3" />R${Number(job.valor).toLocaleString('pt-BR')}
                      </span>
                    )}
                    {job.prazo && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.prazo}</span>}
                    {job.categoria && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{job.categoria}</span>}
                  </div>
                  {job.habilidades?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.habilidades.map((skill) => <span key={skill} className="text-xs glass rounded-full px-2.5 py-0.5 text-muted-foreground">{skill}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[job.status]}`}>
                    {job.status?.replace('_', ' ')}
                  </span>
                  <Button
                    size="sm"
                    disabled={hasApplied(job.id) || applying === job.id}
                    onClick={() => applyToJob(job)}
                    className={`rounded-xl gap-1.5 text-xs ${hasApplied(job.id) ? 'bg-green-400/10 text-green-400 border-green-400/20 hover:bg-green-400/10' : 'bg-gradient-to-r from-primary to-accent text-white border-0'}`}
                  >
                    <Send className="w-3 h-3" />
                    {hasApplied(job.id) ? 'Candidatado' : applying === job.id ? 'Enviando...' : 'Candidatar'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
