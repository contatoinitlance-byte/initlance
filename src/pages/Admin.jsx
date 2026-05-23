import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import {
    Users, Briefcase, DollarSign, TrendingUp, Trash2, Shield, CheckCircle,
    Plus, X, Loader2, Swords, Edit2, UserX, RotateCcw, LogOut
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { db } from '@/api/supabaseData';

const tabs = ['Usuários', 'Vagas', 'Transações', 'Desafios'];

function ChallengeModal({ challenge, onClose, onSaved }) {
    const { user } = useAuth();
    const [form, setForm] = useState({
        titulo: challenge?.titulo || '',
        descricao: challenge?.descricao || '',
        categoria: challenge?.categoria || '',
        dificuldade: challenge?.dificuldade || 'Iniciante',
        recompensa: challenge?.recompensa || '',
        prazo: challenge?.prazo || '',
        regras: challenge?.regras || '',
        status: challenge?.status || 'ativo',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!form.titulo || !form.descricao) return;
        setSaving(true);
        setError('');

        try {
            const createdById = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user?.id || '')
                ? user.id
                : undefined;

            if (challenge?.id) {
                await db.challenges.update(challenge.id, form);
            } else {
                await db.challenges.create({ ...form, created_by_id: createdById, participantes_count: 0 });
            }
            onSaved();
        } catch (err) {
            console.error('Admin challenge save error:', err);
            setError(err instanceof Error ? err.message : 'Não foi possível publicar.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-strong rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-heading font-bold text-xl text-foreground">{challenge ? 'Editar Desafio' : 'Novo Desafio'}</h2>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg glass flex items-center justify-center">
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Título *</Label>
                            <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Descrição *</Label>
                            <textarea className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={3} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Categoria</Label>
                                <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Dificuldade</Label>
                                <select className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground" value={form.dificuldade} onChange={e => setForm(p => ({ ...p, dificuldade: e.target.value }))}>
                                    <option value="Iniciante">Iniciante</option>
                                    <option value="Intermediário">Intermediário</option>
                                    <option value="Avançado">Avançado</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Recompensa</Label>
                                <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="ex: +50 Proof Score" value={form.recompensa} onChange={e => setForm(p => ({ ...p, recompensa: e.target.value }))} />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Prazo</Label>
                                <Input className="mt-1 bg-secondary/50 border-border/50 rounded-xl" placeholder="ex: 7 dias" value={form.prazo} onChange={e => setForm(p => ({ ...p, prazo: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Regras</Label>
                            <textarea className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={2} value={form.regras} onChange={e => setForm(p => ({ ...p, regras: e.target.value }))} />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <select className="mt-1 w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                <option value="ativo">Ativo (visível para usuários)</option>
                                <option value="rascunho">Rascunho (invisível)</option>
                                <option value="encerrado">Encerrado</option>
                            </select>
                        </div>
                    </div>
                    {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                    <div className="flex gap-3 mt-5">
                        <Button variant="outline" onClick={onClose} className="rounded-xl flex-1">Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving || !form.titulo} className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl flex-1 gap-2">
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><CheckCircle className="w-4 h-4" />Publicar</>}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Admin() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Usuários');
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [challengeModal, setChallengeModal] = useState(null); // null | 'new' | challenge obj
    const [banDays, setBanDays] = useState({});
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        const [u, j, t, c] = await Promise.allSettled([
            db.users.list(),
            db.jobs.list(),
            db.transactions.forUser(user?.email || ''),
            db.challenges.list(),
        ]);
        setUsers(u.status === 'fulfilled' ? u.value : []);
        setJobs(j.status === 'fulfilled' ? j.value : []);
        setTransactions(t.status === 'fulfilled' ? t.value : []);
        setChallenges(c.status === 'fulfilled' ? c.value : []);
        setLoading(false);
    };

    if (user && user.role !== 'admin') return <Navigate to="/" replace />;

    const totalRevenue = transactions
        .filter(t => t.tipo === 'pagamento' && t.status === 'concluido')
        .reduce((s, t) => s + (t.valor || 0), 0);

    const freelancerCount = users.filter(u => u.role === 'freelancer').length;
    const clientCount = users.filter(u => u.role === 'client').length;
    const openJobs = jobs.filter(j => j.status === 'aberto').length;

    const handleDeleteJob = async (id) => {
        await db.jobs.delete(id);
        setJobs(prev => prev.filter(j => j.id !== id));
    };

    const handleDeleteChallenge = async (id) => {
        await db.challenges.delete(id);
        setChallenges(prev => prev.filter(c => c.id !== id));
    };

    const handleToggleChallengeStatus = async (ch) => {
        const newStatus = ch.status === 'ativo' ? 'rascunho' : 'ativo';
        await db.challenges.update(ch.id, { status: newStatus });
        setChallenges(prev => prev.map(c => c.id === ch.id ? { ...c, status: newStatus } : c));
    };

    const handleBanUser = async (targetUser, type) => {
        const days = Number(banDays[targetUser.email] || 7);
        const payload = type === 'permanent'
            ? { ban_status: 'permanent', banned_until: null, ban_reason: 'Banido pelo admin' }
            : {
                ban_status: 'temporary',
                banned_until: new Date(Date.now() + Math.max(1, days) * 24 * 60 * 60 * 1000).toISOString(),
                ban_reason: 'Suspenso temporariamente pelo admin',
            };

        const updated = await db.users.update(targetUser.email, payload);
        setUsers(prev => prev.map(item => item.email === targetUser.email ? { ...item, ...updated } : item));
    };

    const handleUnbanUser = async (targetUser) => {
        const updated = await db.users.update(targetUser.email, { ban_status: 'active', banned_until: null, ban_reason: null });
        setUsers(prev => prev.map(item => item.email === targetUser.email ? { ...item, ...updated } : item));
    };

    const handleLogout = async () => {
        setSigningOut(true);
        try {
            await logout(false);
        } finally {
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-heading font-bold text-2xl text-foreground">Painel Admin</h1>
                        <p className="text-sm text-muted-foreground">Gerenciamento da plataforma Initlance · {user?.email}</p>
                    </div>
                </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleLogout}
                        disabled={signingOut}
                        className="w-full sm:w-auto h-10 rounded-xl border-border/50 gap-2 flex-shrink-0"
                    >
                        {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                        Sair
                    </Button>
                </div>

                {/* Stats */}
                {!loading && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: 'Total Usuários', value: users.length, icon: Users, color: 'text-primary' },
                            { title: 'Freelancers', value: freelancerCount, icon: TrendingUp, color: 'text-accent' },
                            { title: 'Clientes', value: clientCount, icon: CheckCircle, color: 'text-green-400' },
                            { title: 'Vagas Abertas', value: openJobs, icon: Briefcase, color: 'text-yellow-400' },
                        ].map(s => (
                            <div key={s.title} className="glass rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">{s.title}</span>
                                    <s.icon className={`w-4 h-4 ${s.color}`} />
                                </div>
                                <p className="font-heading font-bold text-2xl text-foreground">{s.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Revenue */}
                <div className="glass rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Receita Total da Plataforma</p>
                        <p className="font-heading font-bold text-3xl gradient-text">R${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <DollarSign className="w-12 h-12 text-primary/20" />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border flex-wrap">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                            {tab}
                            {tab === 'Desafios' && challenges.filter(c => c.status === 'ativo').length > 0 && (
                                <span className="ml-1.5 text-xs bg-primary/20 text-primary rounded-full px-1.5">{challenges.filter(c => c.status === 'ativo').length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl h-14 animate-pulse" />)}</div>
                ) : (
                    <>
                        {activeTab === 'Usuários' && (
                            <div className="glass rounded-2xl overflow-hidden">
                                <table className="w-full [&_td:nth-child(3)]:hidden [&_th:nth-child(3)]:hidden">
                                    <thead><tr className="border-b border-border text-xs text-muted-foreground">
                                        <th className="text-left p-4">Nome</th><th className="text-left p-4">Email</th>
                                        <th className="text-left p-4">Username</th><th className="text-left p-4">Tipo</th><th className="text-left p-4">Status</th><th className="text-left p-4">Cadastro</th><th className="text-left p-4">Ações</th>
                                    </tr></thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                                                <td className="p-4 text-sm font-medium text-foreground">{u.full_name || '—'}</td>
                                                <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                                                <td className="p-4 text-sm text-muted-foreground">{u.username ? `@${u.username}` : '—'}</td>
                                                <td className="p-4"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-red-400/10 text-red-400' : u.role === 'freelancer' ? 'bg-primary/10 text-primary' : u.role === 'client' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>{u.role || 'user'}</span></td>
                                                <td className="p-4 text-xs text-muted-foreground">{u.ban_status === 'permanent' ? 'Ban permanente' : u.ban_status === 'temporary' ? `Suspenso até ${u.banned_until ? new Date(u.banned_until).toLocaleDateString('pt-BR') : 'revisão'}` : 'Ativo'}</td>
                                                <td className="p-4 text-xs text-muted-foreground">{new Date(u.created_date || u.created_at || Date.now()).toLocaleDateString('pt-BR')}</td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Input type="number" min="1" max="365" value={banDays[u.email] || 7} onChange={(event) => setBanDays(prev => ({ ...prev, [u.email]: event.target.value }))} className="h-8 w-16 bg-secondary/50 border-border/50 rounded-lg text-xs" aria-label="Dias de suspensão" />
                                                        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1" onClick={() => handleBanUser(u, 'temporary')}><UserX className="w-3 h-3" /> Temp</Button>
                                                        <Button size="sm" className="h-8 rounded-lg text-xs bg-red-400/10 text-red-400 hover:bg-red-400/20 border-0 gap-1" onClick={() => handleBanUser(u, 'permanent')}><UserX className="w-3 h-3" /> Perm</Button>
                                                        {u.ban_status && u.ban_status !== 'active' && <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs gap-1" onClick={() => handleUnbanUser(u)}><RotateCcw className="w-3 h-3" /> Reativar</Button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'Vagas' && (
                            <div className="space-y-3">
                                {jobs.length === 0 && <div className="glass rounded-2xl p-10 text-center text-muted-foreground">Nenhuma vaga cadastrada</div>}
                                {jobs.map(job => (
                                    <div key={job.id} className="glass rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{job.titulo}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{job.cliente_email} · R${job.valor?.toLocaleString('pt-BR')}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${job.status === 'aberto' ? 'bg-green-400/10 text-green-400' : job.status === 'em_andamento' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>{job.status.replace('_', ' ')}</span>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-400/10" onClick={() => handleDeleteJob(job.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'Transações' && (
                            <div className="glass rounded-2xl overflow-hidden">
                                {transactions.length === 0 ? <div className="p-10 text-center text-muted-foreground">Nenhuma transação ainda</div> : (
                                    <table className="w-full">
                                        <thead><tr className="border-b border-border text-xs text-muted-foreground">
                                            <th className="text-left p-4">Usuário</th><th className="text-left p-4">Tipo</th>
                                            <th className="text-left p-4">Valor</th><th className="text-left p-4">Status</th><th className="text-left p-4">Data</th>
                                        </tr></thead>
                                        <tbody>
                                            {transactions.map(t => (
                                                <tr key={t.id} className="border-b border-border/50">
                                                    <td className="p-4 text-sm text-muted-foreground">{t.usuario_email}</td>
                                                    <td className="p-4 text-sm text-foreground capitalize">{t.tipo}</td>
                                                    <td className="p-4 text-sm font-medium text-foreground">R${t.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-4"><span className={`text-xs px-2.5 py-1 rounded-full ${t.status === 'concluido' ? 'bg-green-400/10 text-green-400' : t.status === 'pendente' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'}`}>{t.status}</span></td>
                                                    <td className="p-4 text-xs text-muted-foreground">{new Date(t.created_date).toLocaleDateString('pt-BR')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {activeTab === 'Desafios' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">{challenges.filter(c => c.status === 'ativo').length} ativos · {challenges.filter(c => c.status === 'rascunho').length} rascunhos</p>
                                    <Button onClick={() => setChallengeModal('new')} className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl gap-2">
                                        <Plus className="w-4 h-4" /> Novo Desafio
                                    </Button>
                                </div>
                                {challenges.length === 0 ? (
                                    <div className="glass rounded-2xl p-16 text-center">
                                        <Swords className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                                        <h3 className="font-heading font-semibold text-foreground mb-1">Nenhum desafio criado</h3>
                                        <p className="text-sm text-muted-foreground mb-4">Crie desafios para engajar os freelancers da plataforma.</p>
                                        <Button onClick={() => setChallengeModal('new')} className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl gap-2">
                                            <Plus className="w-4 h-4" /> Criar Primeiro Desafio
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {challenges.map(ch => (
                                            <div key={ch.id} className="glass rounded-xl p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-heading font-semibold text-foreground text-sm">{ch.titulo}</h3>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${ch.status === 'ativo' ? 'bg-green-400/10 text-green-400' : ch.status === 'rascunho' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-muted text-muted-foreground'}`}>{ch.status}</span>
                                                            {ch.dificuldade && <span className="text-xs text-muted-foreground">{ch.dificuldade}</span>}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-2">{ch.descricao}</p>
                                                        {ch.recompensa && <p className="text-xs text-primary mt-1">🏆 {ch.recompensa}</p>}
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <Button size="sm" variant="outline" onClick={() => setChallengeModal(ch)} className="rounded-xl border-border/50 gap-1 text-xs">
                                                            <Edit2 className="w-3 h-3" /> Editar
                                                        </Button>
                                                        <Button size="sm" onClick={() => handleToggleChallengeStatus(ch)}
                                                            className={`rounded-xl border-0 gap-1 text-xs ${ch.status === 'ativo' ? 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20' : 'bg-green-400/10 text-green-400 hover:bg-green-400/20'}`}>
                                                            {ch.status === 'ativo' ? 'Arquivar' : 'Publicar'}
                                                        </Button>
                                                        <Button size="sm" onClick={() => handleDeleteChallenge(ch.id)} className="bg-red-400/10 text-red-400 hover:bg-red-400/20 border-0 rounded-xl text-xs">
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {challengeModal && (
                <ChallengeModal
                    challenge={challengeModal === 'new' ? null : challengeModal}
                    onClose={() => setChallengeModal(null)}
                    onSaved={() => { setChallengeModal(null); loadAll(); }}
                />
            )}
        </div>
    );
}
