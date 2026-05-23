import { useEffect, useState } from 'react';
import { Trophy, Users, Calendar, Award, Zap } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { db } from '@/api/supabaseData';

const DIFF_STYLES = {
    Iniciante: 'bg-green-400/10 text-green-400 border-green-400/20',
    Intermediario: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    'Intermediário': 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    Avancado: 'bg-red-400/10 text-red-400 border-red-400/20',
    'Avançado': 'bg-red-400/10 text-red-400 border-red-400/20',
};

export default function Challenges() {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadChallenges();
    }, []);

    const loadChallenges = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await db.challenges.visible();
            setChallenges(data.filter((challenge) => challenge.status === 'ativo'));
        } catch (err) {
            console.error('Challenges load error:', err);
            setError(err instanceof Error ? err.message : 'Nao foi possivel carregar desafios.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading font-bold text-2xl text-foreground">Challenges</h1>
                <p className="text-sm text-muted-foreground mt-1">Prove suas habilidades e ganhe reconhecimento</p>
            </div>

            {error && <div className="glass rounded-2xl p-4 text-sm text-destructive">{error}</div>}

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass rounded-2xl h-56 animate-pulse" />)}
                </div>
            ) : challenges.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <h3 className="font-heading font-semibold text-foreground mb-2">Sem desafios ainda</h3>
                    <p className="text-sm text-muted-foreground">Quando o admin lançar um desafio, ele aparecerá aqui.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {challenges.map((challenge) => (
                        <div key={challenge.id} className="glass rounded-2xl overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
                            <div className="relative h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                                <Zap className="w-12 h-12 text-primary/30" />
                                <div className="absolute top-3 left-3 flex gap-2">
                                    {challenge.dificuldade && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DIFF_STYLES[challenge.dificuldade] || ''}`}>{challenge.dificuldade}</span>
                                    )}
                                </div>
                            </div>

                            <div className="p-4">
                                {challenge.categoria && <p className="text-xs text-primary font-medium mb-1">{challenge.categoria}</p>}
                                <h3 className="font-heading font-semibold text-foreground mb-2 leading-snug">{challenge.titulo}</h3>
                                {challenge.descricao && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{challenge.descricao}</p>}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                                    {Number(challenge.participantes_count) > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{challenge.participantes_count}</span>}
                                    {challenge.prazo && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{challenge.prazo}</span>}
                                    {challenge.recompensa && <span className="flex items-center gap-1 text-yellow-400"><Award className="w-3 h-3" />{challenge.recompensa}</span>}
                                </div>
                                <Button size="sm" className="w-full bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl text-xs">Participar</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
