import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Star, MapPin, Calendar, Award, ExternalLink, ArrowLeft,
  Briefcase, Eye, Github, Globe, Instagram, Linkedin, FolderOpen, MessageSquare, UserPlus
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { motion } from 'framer-motion';
import { db, getConversationId } from '@/api/supabaseData';
import LinkPreviewCover from '@/Components/portfolio/LinkPreviewCover';

export default function Profile() {
  const { id } = useParams();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    setNotFound(false);

    try {
      const decodedId = decodeURIComponent(id);
      const foundProfile = await db.users.byIdentity(decodedId);
      const looksLikeEmail = decodedId.includes('@');
      const found = foundProfile || (looksLikeEmail ? {
        email: decodedId,
        user_email: decodedId,
        full_name: decodedId.split('@')[0],
      } : null);

      if (!found) {
        setNotFound(true);
        return;
      }

      const targetEmail = found.email || found.user_email;
      const targetIdentity = found.user_id || found.id || targetEmail;
      const [statsData, portfolioData, reviewsData] = await Promise.allSettled([
        db.freelancerStats.byEmail(targetIdentity),
        db.portfolios.forUser(targetIdentity),
        db.reviews.forUser(targetIdentity),
      ]);

      setProfileUser(found);
      setStats(statsData.status === 'fulfilled' ? statsData.value : null);
      setPortfolio(portfolioData.status === 'fulfilled' ? portfolioData.value.filter((project) => project.status !== 'rascunho') : []);
      setReviews(reviewsData.status === 'fulfilled' ? reviewsData.value : []);
    } catch (err) {
      console.error('Profile load error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    const email = profileUser.email || profileUser.user_email;
    const targetId = profileUser.user_id || profileUser.id;
    const contactIdentity = email || targetId;
    const conversation = getConversationId(currentUser.email, contactIdentity);
    window.location.href = currentUser.role === 'client'
      ? `/client/messages?to=${encodeURIComponent(contactIdentity)}&toId=${encodeURIComponent(targetId || '')}&conversation=${encodeURIComponent(conversation)}`
      : `/dashboard/messages?to=${encodeURIComponent(contactIdentity)}&toId=${encodeURIComponent(targetId || '')}&conversation=${encodeURIComponent(conversation)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profileUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h2 className="font-heading font-bold text-2xl text-foreground">Perfil nao encontrado</h2>
        <p className="text-muted-foreground">Este usuario nao existe ou foi removido.</p>
        <Link to="/marketplace"><Button variant="outline" className="rounded-xl">Ver Marketplace</Button></Link>
      </div>
    );
  }

  const email = profileUser.email || profileUser.user_email;
  const backTo = location.state?.from || '/marketplace';
  const backLabel = location.state?.label || 'Voltar ao Marketplace';
  const displayName = profileUser.full_name || profileUser.nome_empresa || email;
  const avatar = profileUser.foto_perfil || profileUser.avatar_url;
  const createdAt = profileUser.created_at || profileUser.created_date;
  const portfolioViews = portfolio.reduce((sum, project) => sum + Number(project.views || 0), 0);
  const skills = Array.isArray(stats?.habilidades)
    ? stats.habilidades
    : String(stats?.habilidades || '').split(',').map((skill) => skill.trim()).filter(Boolean);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + Number(review.nota || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-background font-body">
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 min-h-14 py-2">
          <Link to={backTo} className="flex min-w-0 items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{backLabel}</span>
          </Link>
          {currentUser && currentUser.email !== email && (
            <div className="flex flex-shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={handleContact} className="rounded-xl border-border/50 gap-1.5 text-xs px-2 sm:px-3">
                <MessageSquare className="w-3.5 h-3.5" /> Mensagem
              </Button>
              <Button size="sm" className="hidden sm:inline-flex bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl gap-1.5 text-xs">
                <UserPlus className="w-3.5 h-3.5" /> Contratar
              </Button>
            </div>
          )}
        </div>
      </nav>

      <div className="h-48 md:h-56 relative overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-5 mb-8 min-w-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-background flex-shrink-0 bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            {avatar
              ? <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-white">{displayName[0].toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-heading font-bold text-2xl text-foreground min-w-0 max-w-full break-words">{displayName}</h1>
              {stats?.rank && stats.rank !== 'Rookie' && <span className="max-w-full truncate text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">{stats.rank}</span>}
            </div>
            {stats?.profissao && <p className="text-sm text-muted-foreground mb-2 break-words">{stats.profissao}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-3">
              {profileUser.cidade && <span className="flex min-w-0 max-w-full items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{profileUser.cidade}{profileUser.pais && `, ${profileUser.pais}`}</span></span>}
              {createdAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 flex-shrink-0" />Desde {new Date(createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>}
              {avgRating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />{avgRating} ({reviews.length})</span>}
            </div>
            {profileUser.bio && <p className="text-sm text-foreground/70 leading-relaxed max-w-2xl break-words">{profileUser.bio}</p>}

            <div className="flex gap-2 mt-3">
              {stats?.github && <a href={stats.github.startsWith('http') ? stats.github : `https://${stats.github}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-white/10"><Github className="w-3.5 h-3.5 text-muted-foreground" /></a>}
              {stats?.linkedin && <a href={stats.linkedin.startsWith('http') ? stats.linkedin : `https://${stats.linkedin}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-white/10"><Linkedin className="w-3.5 h-3.5 text-muted-foreground" /></a>}
              {stats?.instagram && <a href={stats.instagram.startsWith('http') ? stats.instagram : `https://${stats.instagram}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-white/10"><Instagram className="w-3.5 h-3.5 text-muted-foreground" /></a>}
              {stats?.website && <a href={stats.website.startsWith('http') ? stats.website : `https://${stats.website}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-white/10"><Globe className="w-3.5 h-3.5 text-muted-foreground" /></a>}
            </div>
          </div>
          {stats && (
            <div className="flex flex-col items-center glass rounded-2xl p-4 w-full md:w-auto md:min-w-[120px] max-w-full">
              <span className="text-xs text-muted-foreground mb-1">Proof Score</span>
              <span className="font-heading font-bold text-3xl gradient-text max-w-full truncate">{stats.proof_score || 0}</span>
              <span className="text-xs text-foreground font-medium mt-1 max-w-full truncate">
                {stats.valor_a_combinar || !Number(stats.valor_hora) ? 'A combinar' : `R$${stats.valor_hora}/h`}
              </span>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Projetos', value: portfolio.length, icon: Briefcase },
            { label: 'Jobs', value: stats?.proposals_accepted || 0, icon: Award },
            { label: 'Views Portfolio', value: portfolioViews.toLocaleString(), icon: Eye },
            { label: 'Avaliacao', value: avgRating || '-', icon: Star },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl p-3 text-center">
              <item.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="font-heading font-bold text-lg text-foreground truncate">{item.value}</p>
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
            </div>
          ))}
        </div>

        {skills.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading font-semibold text-lg mb-3">Habilidades</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="max-w-full break-words bg-secondary/50 text-foreground/80 rounded-lg px-3 py-1 border-0">{skill}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="font-heading font-semibold text-lg mb-3">Portfolio</h2>
          {portfolio.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">Nenhum projeto publicado ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {portfolio.map((project) => (
                <div key={project.id} className="glass rounded-2xl overflow-hidden group hover:bg-white/[0.04] transition-all">
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    {(Array.isArray(project.imagens) ? project.imagens[0] : project.imagens) ? (
                      <img src={Array.isArray(project.imagens) ? project.imagens[0] : project.imagens} alt={project.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : project.link_projeto || project.link_repositorio ? (
                      <LinkPreviewCover projectUrl={project.link_projeto} repositoryUrl={project.link_repositorio} title={project.titulo} />
                    ) : (
                      <FolderOpen className="w-8 h-8 text-primary/30" />
                    )}
                    {project.link_projeto && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a href={project.link_projeto} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-white text-xs glass-strong px-3 py-1.5 rounded-full">
                          <ExternalLink className="w-3 h-3" /> Ver Projeto
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-foreground text-sm break-words">{project.titulo}</h3>
                    {project.categoria && <p className="text-xs text-muted-foreground mt-0.5 break-words">{project.categoria}</p>}
                    {(Array.isArray(project.tecnologias) ? project.tecnologias : String(project.tecnologias || '').split(',').map((tech) => tech.trim()).filter(Boolean)).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(Array.isArray(project.tecnologias) ? project.tecnologias : String(project.tecnologias || '').split(',').map((tech) => tech.trim()).filter(Boolean)).slice(0, 3).map((tech) => <span key={tech} className="max-w-full break-words text-xs glass rounded-full px-2 py-0.5 text-muted-foreground">{tech}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="font-heading font-semibold text-lg mb-3">Avaliacoes</h2>
          {reviews.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">Nenhuma avaliacao ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="min-w-0 truncate text-sm font-medium text-foreground">{review.remetente_email?.split('@')[0]}</span>
                    <div className="flex flex-shrink-0 gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3 h-3 ${star <= Number(review.nota) ? 'text-yellow-400 fill-yellow-400' : 'text-border'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comentario && <p className="text-sm text-foreground/70 break-words">{review.comentario}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
