import { useEffect, useMemo, useState } from 'react';
import StatCard from '@/Components/dashboard/StatCard';
import { Briefcase, Users, UserCheck, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/AuthContext';
import { getClientJobs, getClientProposals, getClientTransactions } from '@/api/clientData';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const funnelColors = [
    'hsl(258 70% 58%)',
    'hsl(217 80% 56%)',
    'hsl(180 60% 50%)',
    'hsl(142 71% 45%)',
];

const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
});

const getItemDate = (item) => item.created_at || item.created_date || item.inserted_at;

const isSameMonth = (item, date) => {
    const rawDate = getItemDate(item);
    if (!rawDate) return false;
    const itemDate = new Date(rawDate);
    return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
};

const buildMonthlySpend = (transactions, fallbackJobs) => {
    const now = new Date();

    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        const month = MONTHS[date.getMonth()];

        const transactionTotal = transactions
            .filter((transaction) => isSameMonth(transaction, date))
            .filter((transaction) => !transaction.status || transaction.status === 'concluido')
            .filter((transaction) => !transaction.tipo || ['pagamento', 'taxa'].includes(transaction.tipo))
            .reduce((sum, transaction) => sum + Number(transaction.valor || 0), 0);

        const fallbackTotal = fallbackJobs
            .filter((job) => isSameMonth(job, date))
            .reduce((sum, job) => sum + Number(job.valor || 0), 0);

        return {
            month,
            gastos: transactionTotal || fallbackTotal,
        };
    });
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-strong rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground">{currency.format(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

export default function ClientDashboard() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user?.email) return;

        const loadDashboardData = async () => {
            setLoading(true);
            setError('');

            try {
                const [jobsData, proposalsData, transactionsData] = await Promise.all([
                    getClientJobs(user.email),
                    getClientProposals(user.email),
                    getClientTransactions(user.email),
                ]);

                setJobs(jobsData);
                setProposals(proposalsData);
                setTransactions(transactionsData);
            } catch (err) {
                console.error('Client dashboard data error:', err);
                setError(err instanceof Error ? err.message : 'Nao foi possivel carregar os dados.');
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [user?.email]);

    const metrics = useMemo(() => {
        const visibleJobs = jobs.filter((job) => job.status !== 'cancelado');
        const openJobs = visibleJobs.filter((job) => job.status === 'aberto');
        const activeJobs = visibleJobs.filter((job) => job.status === 'em_andamento');
        const completedJobs = visibleJobs.filter((job) => job.status === 'concluido');
        const acceptedProposals = proposals.filter((proposal) => proposal.status === 'aceita');
        const pendingProposals = proposals.filter((proposal) => proposal.status === 'pendente');
        const interviewedProposals = proposals.filter((proposal) => ['aceita', 'recusada'].includes(proposal.status));

        const completedSpend = transactions
            .filter((transaction) => !transaction.status || transaction.status === 'concluido')
            .filter((transaction) => !transaction.tipo || ['pagamento', 'taxa'].includes(transaction.tipo))
            .reduce((sum, transaction) => sum + Number(transaction.valor || 0), 0);

        const fallbackSpend = [...activeJobs, ...completedJobs]
            .reduce((sum, job) => sum + Number(job.valor || 0), 0);

        const spend = completedSpend || fallbackSpend;
        const conversion = proposals.length > 0
            ? (acceptedProposals.length / proposals.length) * 100
            : 0;

        return {
            visibleJobs,
            openJobs,
            activeJobs,
            completedJobs,
            acceptedProposals,
            pendingProposals,
            interviewedProposals,
            spend,
            conversion,
        };
    }, [jobs, proposals, transactions]);

    const spendData = useMemo(
        () => buildMonthlySpend(transactions, metrics.activeJobs.concat(metrics.completedJobs)),
        [transactions, metrics.activeJobs, metrics.completedJobs]
    );

    const funnelData = useMemo(() => ([
        { name: 'Vagas publicadas', value: metrics.visibleJobs.length, fill: funnelColors[0] },
        { name: 'Candidaturas', value: proposals.length, fill: funnelColors[1] },
        { name: 'Avaliadas', value: metrics.interviewedProposals.length, fill: funnelColors[2] },
        { name: 'Contratados', value: metrics.acceptedProposals.length, fill: funnelColors[3] },
    ]), [metrics, proposals.length]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="font-heading font-bold text-2xl text-foreground">Dashboard Empresa</h1>
                    <p className="text-sm text-muted-foreground mt-1">Carregando seus dados...</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="glass rounded-2xl h-28 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading font-bold text-2xl text-foreground">Dashboard Empresa</h1>
                <p className="text-sm text-muted-foreground mt-1">Gerencie suas contratacoes e vagas</p>
            </div>

            {error && (
                <div className="glass rounded-2xl p-4 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Vagas Abertas" value={metrics.openJobs.length} trend={`${metrics.activeJobs.length} em andamento`} trendUp icon={Briefcase} iconColor="text-primary" />
                <StatCard title="Candidatos" value={proposals.length} trend={`${metrics.pendingProposals.length} pendentes`} trendUp icon={Users} iconColor="text-accent" />
                <StatCard title="Contratacoes" value={metrics.acceptedProposals.length} trend={`${metrics.completedJobs.length} concluidas`} trendUp icon={UserCheck} iconColor="text-green-400" />
                <StatCard title="Gasto Total" value={currency.format(metrics.spend)} trend="dados do banco" trendUp={false} icon={DollarSign} iconColor="text-yellow-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard title="Contratos Ativos" value={metrics.activeJobs.length} trend={`${metrics.visibleJobs.length} vagas no total`} trendUp icon={FileText} iconColor="text-cyan-400" />
                <StatCard title="Conversao" value={`${metrics.conversion.toFixed(1)}%`} trend={`${metrics.acceptedProposals.length} de ${proposals.length} candidaturas`} trendUp icon={TrendingUp} iconColor="text-primary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Historico de Gastos</h3>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={spendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" />
                                <XAxis dataKey="month" tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="gastos" fill="hsl(258 70% 58%)" radius={[4, 4, 0, 0]} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Funil de Contratacao</h3>
                    <div className="space-y-3">
                        {funnelData.map((item) => {
                            const maxValue = Math.max(...funnelData.map((row) => row.value), 1);

                            return (
                                <div key={item.name}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">{item.name}</span>
                                        <span className="text-foreground font-medium">{item.value}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-border">
                                        <div
                                            className="h-2 rounded-full transition-all duration-700"
                                            style={{
                                                width: `${(item.value / maxValue) * 100}%`,
                                                background: item.fill,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 glass rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Taxa de conversao total</p>
                        <p className="font-heading font-bold text-lg gradient-text">{metrics.conversion.toFixed(1)}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
