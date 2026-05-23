import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import StatCard from '@/Components/dashboard/StatCard';
import EarningsChart from '@/Components/dashboard/EarningsChart';
import { Eye, Heart, CheckCircle, Send } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '@/api/supabaseData';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const itemDate = (item) => item.created_at || item.created_date || item.inserted_at;

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div className="glass-strong rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
                ))}
            </div>
        );
    }
    return null;
};

function buildMonthlyProposals(proposals) {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const sent = proposals.filter((proposal) => {
            const pd = new Date(itemDate(proposal));
            return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        }).length;
        const accepted = proposals.filter((proposal) => {
            const pd = new Date(itemDate(proposal));
            return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear() && proposal.status === 'aceita';
        }).length;
        return { month: MONTHS[d.getMonth()], sent, accepted };
    });
}

function buildMonthlyPortfolio(portfolioItems) {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const count = portfolioItems.filter((project) => {
            const pd = new Date(itemDate(project));
            return pd <= new Date(d.getFullYear(), d.getMonth() + 1, 0);
        }).length;
        return { month: MONTHS[d.getMonth()], projetos: count };
    });
}

function buildEarnings(transactions) {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const ganhos = transactions
            .filter((transaction) => {
                const td = new Date(itemDate(transaction));
                return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && transaction.tipo === 'recebimento';
            })
            .reduce((sum, transaction) => sum + Number(transaction.valor || 0), 0);
        return { month: MONTHS[d.getMonth()], ganhos };
    });
}

export default function Analytics() {
    const { user } = useAuth();
    const [proposals, setProposals] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user?.email) return;
        loadData();
    }, [user?.email]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        const [propsData, portData, txData] = await Promise.allSettled([
            db.proposals.forFreelancer(user.email),
            db.portfolios.forUser(user.email),
            db.transactions.forUser(user.email),
        ]);

        setProposals(propsData.status === 'fulfilled' ? propsData.value : []);
        setPortfolio(portData.status === 'fulfilled' ? portData.value : []);
        setTransactions(txData.status === 'fulfilled' ? txData.value : []);

        const firstError = [propsData, portData, txData].find((result) => result.status === 'rejected');
        if (firstError) {
            console.warn('Analytics partial load error:', firstError.reason);
            setError(firstError.reason instanceof Error ? firstError.reason.message : 'Alguns dados ainda nao estao disponiveis.');
        }

        setLoading(false);
    };

    const totalViews = portfolio.reduce((sum, project) => sum + Number(project.views || 0), 0);
    const totalSaves = portfolio.reduce((sum, project) => sum + Number(project.saves || 0), 0);
    const acceptedCount = proposals.filter((proposal) => proposal.status === 'aceita').length;
    const acceptanceRate = proposals.length > 0 ? Math.round((acceptedCount / proposals.length) * 100) : 0;
    const proposalData = buildMonthlyProposals(proposals);
    const growthData = buildMonthlyPortfolio(portfolio);
    const earningsData = buildEarnings(transactions);

    if (loading) {
        return (
            <div className="space-y-6">
                <div><h1 className="font-heading font-bold text-2xl text-foreground">Analytics</h1></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass rounded-2xl h-24 animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading font-bold text-2xl text-foreground">Analytics</h1>
                <p className="text-sm text-muted-foreground mt-1">Metricas detalhadas do seu perfil e portfolio</p>
            </div>

            {error && <div className="glass rounded-2xl p-4 text-sm text-destructive">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Views Totais" value={totalViews.toLocaleString()} trend={totalViews > 0 ? 'Total acumulado' : 'Adicione projetos'} trendUp={totalViews > 0} icon={Eye} iconColor="text-cyan-400" />
                <StatCard title="Saves / Bookmarks" value={String(totalSaves)} trend={totalSaves > 0 ? 'Projetos salvos' : 'Nenhum ainda'} trendUp={totalSaves > 0} icon={Heart} iconColor="text-pink-400" />
                <StatCard title="Taxa de Aceitacao" value={`${acceptanceRate}%`} trend={proposals.length > 0 ? `${acceptedCount} de ${proposals.length} propostas` : 'Envie propostas'} trendUp={acceptanceRate > 50} icon={CheckCircle} iconColor="text-green-400" />
                <StatCard title="Propostas Enviadas" value={String(proposals.length)} trend={acceptedCount > 0 ? `${acceptedCount} aceitas` : 'Nenhuma aceita ainda'} trendUp={acceptedCount > 0} icon={Send} iconColor="text-yellow-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <EarningsChart data={earningsData} />
                <div className="glass rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Views por Projeto</h3>
                    {portfolio.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Nenhum projeto no portfolio</div>
                    ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                            {portfolio.map((project) => (
                                <div key={project.id}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground truncate">{project.titulo}</span>
                                        <span className="text-foreground font-medium flex-shrink-0">{project.views || 0} views</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-border">
                                        <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(100, (Number(project.views || 0) / Math.max(1, totalViews)) * 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Crescimento do Portfolio</h3>
                    {portfolio.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Adicione projetos para ver o crescimento</div>
                    ) : (
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={growthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" />
                                    <XAxis dataKey="month" tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="projetos" stroke="hsl(258 70% 58%)" strokeWidth={2} dot={{ fill: 'hsl(258 70% 58%)', r: 3 }} name="Projetos" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="glass rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Conversao de Propostas</h3>
                    {proposals.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Nenhuma proposta enviada ainda</div>
                    ) : (
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={proposalData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 15%)" />
                                    <XAxis dataKey="month" tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'hsl(240 5% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="sent" stroke="hsl(240 5% 55%)" strokeWidth={2} dot={{ r: 3 }} name="Enviadas" />
                                    <Line type="monotone" dataKey="accepted" stroke="hsl(258 70% 58%)" strokeWidth={2} dot={{ r: 3 }} name="Aceitas" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
