import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import StatCard from '@/Components/dashboard/StatCard';
import ProofScoreCard from '@/Components/dashboard/ProofScoreCard';
import EarningsChart from '@/Components/dashboard/EarningsChart';
import PortfolioViewsChart from '@/Components/dashboard/PortfolioViewsChart';
import { DollarSign, Send, CheckCircle, Briefcase, Eye } from 'lucide-react';
import { calculateProofScore, db, getRankFromProofScore } from '@/api/supabaseData';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getDate(item) {
  return item.created_at || item.created_date || item.inserted_at;
}

function buildMonthlyData(items, tipo, field) {
  const now = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const value = items
      .filter((item) => {
        const itemDate = new Date(getDate(item));
        return itemDate.getMonth() === monthDate.getMonth() &&
          itemDate.getFullYear() === monthDate.getFullYear() &&
          item.tipo === tipo;
      })
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);

    return { month: MONTHS[monthDate.getMonth()], [field]: value };
  });
}

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [statsProfile, setStatsProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.email) return;
    loadData();
  }, [user?.email]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [txs, portItems, props, allJobs, profileStats, reviewItems] = await Promise.allSettled([
        db.transactions.forUser(user.email),
        db.portfolios.forUser(user.email),
        db.proposals.forFreelancer(user.email),
        db.jobs.list(),
        db.freelancerStats.byEmail(user.email),
        db.reviews.forUser(user.email),
      ]);

      setTransactions(txs.status === 'fulfilled' ? txs.value : []);
      setPortfolioItems(portItems.status === 'fulfilled' ? portItems.value : []);
      setProposals(props.status === 'fulfilled' ? props.value : []);
      setJobs(allJobs.status === 'fulfilled' ? allJobs.value.filter((job) => job.freelancer_email === user.email || job.freelancer_id === user.id) : []);
      setStatsProfile(profileStats.status === 'fulfilled' ? profileStats.value : null);
      setReviews(reviewItems.status === 'fulfilled' ? reviewItems.value : []);
    } catch (err) {
      console.error('Freelancer dashboard data error:', err);
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const acceptedProposals = proposals.filter((proposal) => proposal.status === 'aceita');
  const activeJobs = jobs.filter((job) => job.status === 'em_andamento');
  const completedJobs = jobs.filter((job) => job.status === 'concluido');
  const balance = transactions
    .filter((transaction) => !transaction.status || transaction.status === 'concluido')
    .filter((transaction) => !transaction.tipo || transaction.tipo === 'recebimento')
    .reduce((sum, transaction) => sum + Number(transaction.valor || 0), 0);
  const portfolioViews = portfolioItems.reduce((sum, project) => sum + Number(project.views || 0), 0);
  const acceptanceRate = proposals.length > 0 ? Math.round((acceptedProposals.length / proposals.length) * 100) : 0;
  const profileCompletion = Math.min(
    100,
    10 +
      (user?.bio ? 20 : 0) +
      Math.min(30, portfolioItems.length * 10) +
      (statsProfile?.profissao ? 20 : 0) +
      (statsProfile?.habilidades?.length ? 20 : 0)
  );
  const proofScore = calculateProofScore({ portfolio: portfolioItems, proposals, reviews, stats: statsProfile || {} });
  const rank = getRankFromProofScore(proofScore);

  useEffect(() => {
    if (!user?.email || loading) return;
    if (Number(statsProfile?.proof_score || 0) === proofScore && statsProfile?.rank === rank && Number(statsProfile?.portfolio_views || 0) === portfolioViews) return;

    db.freelancerStats.upsert({
      ...(statsProfile || {}),
      user_email: user.email,
      proof_score: proofScore,
      rank,
      portfolio_views: portfolioViews,
    }).catch((err) => console.warn('Proof Score sync failed:', err));
  }, [user?.email, loading, statsProfile, proofScore, rank, portfolioViews]);
  const earningsData = buildMonthlyData(transactions, 'recebimento', 'ganhos');
  const portfolioViewsData = buildMonthlyData(
    portfolioItems.map((project) => ({ ...project, tipo: 'views', valor: Number(project.views || 0) })),
    'views',
    'views'
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Carregando dados reais do banco...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="glass rounded-2xl h-24 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ola, {user?.full_name || user?.email}! Visao geral da sua carreira freelancer.
        </p>
      </div>

      {error && <div className="glass rounded-2xl p-4 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo Total"
          value={`R$${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={balance > 0 ? 'Disponivel para saque' : 'Sem ganhos ainda'}
          trendUp={balance > 0}
          icon={DollarSign}
          iconColor="text-green-400"
        />
        <StatCard
          title="Propostas Enviadas"
          value={String(proposals.length)}
          trend={acceptedProposals.length > 0 ? `${acceptedProposals.length} aceitas` : 'Nenhuma aceita ainda'}
          trendUp={acceptedProposals.length > 0}
          icon={Send}
          iconColor="text-accent"
        />
        <StatCard
          title="Taxa de Aceitacao"
          value={`${acceptanceRate}%`}
          trend={acceptanceRate > 50 ? 'Boa taxa!' : acceptanceRate > 0 ? 'Continue enviando' : 'Envie propostas'}
          trendUp={acceptanceRate > 50}
          icon={CheckCircle}
          iconColor="text-primary"
        />
        <StatCard
          title="Jobs Ativos"
          value={String(activeJobs.length)}
          trend={activeJobs.length > 0 ? 'Em andamento' : 'Nenhum ainda'}
          trendUp={activeJobs.length > 0}
          icon={Briefcase}
          iconColor="text-yellow-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Views do Portfolio"
          value={String(portfolioViews)}
          trend={portfolioViews > 0 ? 'Total de visualizacoes' : 'Adicione projetos!'}
          trendUp={portfolioViews > 0}
          icon={Eye}
          iconColor="text-cyan-400"
        />
        <ProofScoreCard
          score={proofScore}
          projectsScore={Math.min(100, (portfolioItems.length / 5) * 100)}
          portfolioScore={Math.min(100, (portfolioViews / 50) * 100)}
          responsesScore={acceptanceRate}
          deadlinesScore={Math.min(100, (acceptedProposals.length / 5) * 100)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EarningsChart data={earningsData} />
        <PortfolioViewsChart data={portfolioViewsData} />
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Resumo da Conta</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Rank</p>
            <p className="font-heading font-semibold text-foreground">{rank}</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Jobs Concluidos</p>
            <p className="font-heading font-semibold text-foreground">{completedJobs.length}</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Proof Score</p>
            <p className="font-heading font-semibold gradient-text">{proofScore}</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Jobs Ativos</p>
            <p className="font-heading font-semibold text-foreground">{activeJobs.length}</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Completude do Perfil</h3>
          <span className="text-sm font-heading font-bold gradient-text">{profileCompletion}%</span>
        </div>
        <div className="h-2 rounded-full bg-border">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {profileCompletion < 100 && (
            <>
              {!user?.bio && <span className="text-xs glass rounded-full px-3 py-1 text-muted-foreground">Adicionar bio</span>}
              {portfolioItems.length === 0 && <span className="text-xs glass rounded-full px-3 py-1 text-muted-foreground">Adicionar portfolio</span>}
              {proofScore === 0 && <span className="text-xs glass rounded-full px-3 py-1 text-muted-foreground">Completar Proof Score</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
