import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle, XCircle, MessageSquare, Star, Eye, Briefcase, UserX } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { db, getConversationId } from '@/api/supabaseData';

const STATUS_STYLES = {
  pendente: 'bg-yellow-400/10 text-yellow-400',
  aceita: 'bg-green-400/10 text-green-400',
  recusada: 'bg-red-400/10 text-red-400',
  cancelada: 'bg-muted text-muted-foreground',
};

export default function ClientCandidates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [freelancerData, setFreelancerData] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.email) return;
    loadData();
  }, [user?.email]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [myJobs, allProposals] = await Promise.all([
        db.jobs.forClient(user.email),
        db.proposals.forClient(user.email),
      ]);

      setJobs(myJobs.filter((job) => job.status !== 'cancelado'));
      setProposals(allProposals);

      const identities = [...new Set(allProposals.map((proposal) => proposal.freelancer_id || proposal.freelancer_email).filter(Boolean))];
      const pairs = await Promise.all(identities.map(async (identity) => {
        const [profile, stats] = await Promise.all([
          db.users.byIdentity(identity),
          db.freelancerStats.byEmail(identity),
        ]);
        return [identity, { user: profile, stats }];
      }));

      setFreelancerData(Object.fromEntries(pairs));
    } catch (err) {
      console.error('Client candidates load error:', err);
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar candidatos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (proposal, accept) => {
    setProcessing(proposal.id);
    const newStatus = accept ? 'aceita' : 'recusada';

    try {
      if (accept) {
        await db.proposals.update(proposal.id, { status: newStatus });
        await db.jobs.update(proposal.job_id, {
          status: 'em_andamento',
          freelancer_id: proposal.freelancer_id,
          freelancer_email: proposal.freelancer_email,
        });

        const others = proposals.filter((item) => item.job_id === proposal.job_id && item.id !== proposal.id && item.status === 'pendente');
        await Promise.all(others.map((item) => db.proposals.delete(item.id)));

        await db.notifications.create({
          usuario_email: proposal.freelancer_email,
          tipo: 'proposta_aceita',
          titulo: 'Sua proposta foi aceita!',
          mensagem: `${user.full_name || user.email} aceitou sua candidatura para o projeto.`,
          lida: false,
          referencia_id: proposal.job_id,
          link: '/dashboard/jobs',
        });
      } else {
        await db.proposals.delete(proposal.id);
        await db.notifications.create({
          usuario_email: proposal.freelancer_email,
          tipo: 'sistema',
          titulo: 'Atualizacao sobre sua candidatura',
          mensagem: 'Sua candidatura nao avancou desta vez. Continue se candidatando!',
          lida: false,
        });
      }

      await loadData();
    } catch (err) {
      console.error('Candidate decision error:', err);
      setError(err instanceof Error ? err.message : 'Nao foi possivel atualizar a candidatura.');
    } finally {
      setProcessing(null);
    }
  };

  const openMessage = (proposal) => {
    const to = proposal.freelancer_email || proposal.freelancer_id;
    const conversationId = getConversationId(proposal.cliente_email, to, proposal.job_id);
    navigate(`/client/messages?to=${encodeURIComponent(to)}&toId=${encodeURIComponent(proposal.freelancer_id || '')}&job=${encodeURIComponent(proposal.job_id)}&conversation=${encodeURIComponent(conversationId)}`);
  };

  const filteredProposals = selectedJob
    ? proposals.filter((proposal) => proposal.job_id === selectedJob)
    : proposals;

  const pendingCount = proposals.filter((proposal) => proposal.status === 'pendente').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Candidatos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os candidatos as suas vagas</p>
        </div>
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="glass rounded-2xl h-24 animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Candidatos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount > 0 ? `${pendingCount} candidatura${pendingCount > 1 ? 's' : ''} aguardando resposta` : 'Gerencie os candidatos as suas vagas'}
          </p>
        </div>
        <Link to="/client/create-job">
          <Button className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl gap-2 text-sm">
            + Nova Vaga
          </Button>
        </Link>
      </div>

      {error && <div className="glass rounded-2xl p-4 text-sm text-destructive">{error}</div>}

      {jobs.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="font-heading font-semibold text-foreground mb-2">Nenhuma vaga publicada ainda</h3>
          <p className="text-sm text-muted-foreground mb-6">Publique uma vaga para comecar a receber candidaturas.</p>
          <Link to="/client/create-job">
            <Button className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl gap-2">+ Publicar Vaga</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedJob(null)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${!selectedJob ? 'bg-primary/10 text-primary font-medium' : 'glass text-muted-foreground hover:text-foreground'}`}
            >
              Todas as vagas ({proposals.length})
            </button>
            {jobs.map((job) => {
              const count = proposals.filter((proposal) => proposal.job_id === job.id).length;
              const pending = proposals.filter((proposal) => proposal.job_id === job.id && proposal.status === 'pendente').length;

              return (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${selectedJob === job.id ? 'bg-primary/10 text-primary font-medium' : 'glass text-muted-foreground hover:text-foreground'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{job.titulo}</span>
                    {pending > 0 && (
                      <span className="ml-1 flex-shrink-0 w-4 h-4 rounded-full bg-primary text-white text-xs flex items-center justify-center">{pending}</span>
                    )}
                  </div>
                  <span className="text-xs opacity-70">{count} candidato{count !== 1 ? 's' : ''}</span>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3 space-y-3">
            {filteredProposals.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <UserX className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <h3 className="font-heading font-semibold text-foreground mb-1">Nenhuma candidatura ainda</h3>
                <p className="text-sm text-muted-foreground">Aguarde freelancers se candidatarem as suas vagas.</p>
              </div>
            ) : (
              filteredProposals.map((proposal) => {
                const identity = proposal.freelancer_id || proposal.freelancer_email;
                const data = freelancerData[identity] || {};
                const flUser = data.user;
                const flStats = data.stats;
                const jobTitle = jobs.find((job) => job.id === proposal.job_id)?.titulo || '-';
                const profileLink = flUser?.user_id || flUser?.email || proposal.freelancer_email || proposal.freelancer_id;
                const displayName = flUser?.full_name || flUser?.name || flUser?.email || proposal.freelancer_email || 'Freelancer';

                return (
                  <div key={proposal.id} className="glass rounded-2xl p-4 hover:bg-white/[0.03] transition-all">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                        {flUser?.foto_perfil || flUser?.avatar_url
                          ? <img src={flUser.foto_perfil || flUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                          : <span className="text-white font-bold">{displayName[0]?.toUpperCase()}</span>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="min-w-0 max-w-full break-words font-heading font-semibold text-foreground text-sm">{displayName}</span>
                          {flStats?.rank && <span className="max-w-full truncate text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{flStats.rank}</span>}
                          <span className={`max-w-full truncate text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[proposal.status] || 'bg-muted text-muted-foreground'}`}>{proposal.status}</span>
                        </div>

                        {flStats?.profissao && <p className="text-xs text-muted-foreground mb-1 break-words">{flStats.profissao}</p>}
                        {proposal.mensagem && <p className="text-xs text-foreground/60 line-clamp-2 mb-2 break-words">{proposal.mensagem}</p>}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {Number(proposal.valor_proposto) > 0 && (
                            <span className="text-green-400 font-medium">R${Number(proposal.valor_proposto).toLocaleString('pt-BR')}</span>
                          )}
                          {proposal.prazo_proposto && <span className="break-words">{proposal.prazo_proposto}</span>}
                          {Number(flStats?.proof_score) > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary" />Score: {flStats.proof_score}</span>}
                          {Number(flStats?.portfolio_views) > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{flStats.portfolio_views} views</span>}
                        </div>

                        <p className="text-xs text-muted-foreground mt-2 break-words">Candidatura para: <span className="text-foreground/70">{jobTitle}</span></p>
                      </div>

                      <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 w-full sm:w-auto sm:flex-shrink-0">
                        <Link
                          className="min-w-0"
                          to={`/profile/${encodeURIComponent(profileLink)}`}
                          state={{ from: '/client/candidates', label: 'Voltar aos Candidatos' }}
                        >
                          <Button size="sm" variant="outline" className="rounded-xl border-border/50 gap-1 text-xs w-full">
                            <Eye className="w-3 h-3" /> Ver Perfil
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => openMessage(proposal)} className="rounded-xl border-border/50 gap-1 text-xs w-full">
                          <MessageSquare className="w-3 h-3" /> Mensagem
                        </Button>
                        {proposal.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              disabled={processing === proposal.id}
                              onClick={() => handleDecision(proposal, true)}
                              className="rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 border-0 gap-1 text-xs"
                            >
                              <CheckCircle className="w-3 h-3" /> Aceitar
                            </Button>
                            <Button
                              size="sm"
                              disabled={processing === proposal.id}
                              onClick={() => handleDecision(proposal, false)}
                              className="rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border-0 gap-1 text-xs"
                            >
                              <XCircle className="w-3 h-3" /> Recusar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
