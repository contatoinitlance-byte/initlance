import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, ArrowLeft } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { calculateProofScore, db, getBanState, getRankFromProofScore } from '@/api/supabaseData';
import FreelancerCard from '@/Components/marketplace/FreelancerCard';

const toSkills = (value) => {
  if (Array.isArray(value)) return value;
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
};

export default function Marketplace() {
  const [freelancers, setFreelancers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFreelancers = async () => {
      setLoading(true);
      setError('');

      try {
        const profiles = await db.users.list();
        const freelancerProfiles = profiles.filter((profile) => {
          const ban = getBanState(profile);
          return !ban.banned && (profile.role === 'freelancer' || !profile.role);
        });
        const rows = await Promise.all(freelancerProfiles.map(async (profile) => {
          const email = profile.email || profile.user_email;
          const [stats, portfolio, reviews] = await Promise.all([
            db.freelancerStats.byEmail(email),
            db.portfolios.forUser(email).catch(() => []),
            db.reviews.forUser(email).catch(() => []),
          ]);
          const proofScore = calculateProofScore({ portfolio, reviews, stats: stats || {} }) || Number(stats?.proof_score || 0);
          const rank = getRankFromProofScore(proofScore);

          return {
            id: email || profile.id,
            name: profile.full_name || email,
            role: stats?.profissao || 'Freelancer',
            avatar: profile.foto_perfil || profile.avatar_url,
            proofScore,
            rank,
            badges: rank !== 'Rookie' ? [rank] : [],
            hourlyRate: Number(stats?.valor_hora || 0),
            rateNegotiable: Boolean(stats?.valor_a_combinar),
            skills: toSkills(stats?.habilidades),
            location: [profile.cidade, profile.pais].filter(Boolean).join(', '),
            links: {
              linkedin: stats?.linkedin,
              instagram: stats?.instagram,
              website: stats?.website,
            },
          };
        }));

        setFreelancers(rows);
      } catch (err) {
        console.error('Marketplace load error:', err);
        setError(err instanceof Error ? err.message : 'Nao foi possivel carregar o marketplace.');
      } finally {
        setLoading(false);
      }
    };

    loadFreelancers();
  }, []);

  const filteredFreelancers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return freelancers;

    return freelancers.filter((freelancer) => [
      freelancer.name,
      freelancer.role,
      freelancer.location,
      ...freelancer.skills,
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [freelancers, search]);

  return (
    <div className="min-h-screen bg-background font-body">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="min-w-0">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /> Inicio
            </Link>
            <h1 className="font-heading font-bold text-3xl text-foreground">Marketplace</h1>
            <p className="text-sm text-muted-foreground mt-1">Encontre freelancers com perfis reais</p>
          </div>
          <Link to="/register">
            <Button className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl">Criar perfil</Button>
          </Link>
        </div>

        <div className="relative mb-6 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, habilidade ou local..."
            className="pl-10 bg-secondary/50 border-border/50 rounded-xl h-11"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {error && <div className="glass rounded-2xl p-4 text-sm text-destructive mb-6">{error}</div>}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="glass rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredFreelancers.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <h2 className="font-heading font-semibold text-foreground">Nenhum freelancer encontrado</h2>
            <p className="text-sm text-muted-foreground mt-1">Quando perfis freelancer forem salvos, eles aparecem aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFreelancers.map((freelancer) => (
              <FreelancerCard key={freelancer.id} freelancer={freelancer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
