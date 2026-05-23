import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Eye, Bookmark, ExternalLink, Github, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import AddProjectModal from '@/Components/portfolio/AddProjectModal';
import LinkPreviewCover from '@/Components/portfolio/LinkPreviewCover';
import { db } from '@/api/supabaseData';

const STATUS_STYLES = {
  publicado: 'bg-green-400/10 text-green-400',
  rascunho: 'bg-yellow-400/10 text-yellow-400',
};

const FILTERS = ['Todos', 'publicado', 'rascunho'];

export default function Portfolio() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await db.portfolios.forUser(user.email);
      setProjects(data);
    } catch (err) {
      console.error('Portfolio load error:', err);
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar o portfolio.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await db.portfolios.delete(id);
    setProjects(p => p.filter(pr => pr.id !== id));
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditProject(null);
    loadProjects();
  };

  const filtered = filter === 'Todos' ? projects : projects.filter(p => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Portfólio</h1>
          <p className="text-sm text-muted-foreground mt-1">Mostre seus melhores trabalhos</p>
        </div>
        <Button onClick={() => { setEditProject(null); setShowModal(true); }} className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Novo Projeto
        </Button>
      </div>

      {error && <div className="glass rounded-2xl p-4 text-sm text-destructive">{error}</div>}

      {/* Filters */}
      {projects.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-primary text-white' : 'glass text-muted-foreground hover:text-foreground'}`}
            >
              {f === 'Todos' ? `Todos (${projects.length})` : f === 'publicado' ? `Publicados (${projects.filter(p => p.status === 'publicado').length})` : `Rascunhos (${projects.filter(p => p.status === 'rascunho').length})`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-56 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="font-heading font-semibold text-foreground mb-2">
            {projects.length === 0 ? 'Nenhum projeto adicionado ainda' : 'Nenhum projeto nesta categoria'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {projects.length === 0 ? 'Adicione seus melhores trabalhos para atrair clientes e construir seu legado.' : 'Tente outro filtro ou adicione um novo projeto.'}
          </p>
          {projects.length === 0 && (
            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-primary to-accent text-white border-0 rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Adicionar Primeiro Projeto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => (
            <div key={project.id} className="glass rounded-2xl overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
              {/* Cover image */}
              <div className="relative h-40 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                {project.imagens?.[0] ? (
                  <img src={project.imagens[0]} alt={project.titulo} className="w-full h-full object-cover" />
                ) : project.link_projeto || project.link_repositorio ? (
                  <LinkPreviewCover projectUrl={project.link_projeto} repositoryUrl={project.link_repositorio} title={project.titulo} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen className="w-10 h-10 text-primary/30" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[project.status]}`}>
                    {project.status}
                  </span>
                </div>
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => { setEditProject(project); setShowModal(true); }} className="w-9 h-9 rounded-xl glass-strong flex items-center justify-center hover:bg-white/20">
                    <Pencil className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center hover:bg-red-500/40">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-heading font-semibold text-foreground text-sm leading-snug">{project.titulo}</h3>
                </div>
                {project.categoria && (
                  <span className="text-xs text-primary/80 font-medium">{project.categoria}</span>
                )}
                {project.descricao && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{project.descricao}</p>
                )}

                {project.tecnologias?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {project.tecnologias.slice(0, 3).map(t => (
                      <span key={t} className="text-xs glass rounded-full px-2 py-0.5 text-muted-foreground">{t}</span>
                    ))}
                    {project.tecnologias.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{project.tecnologias.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{project.views || 0}</span>
                    <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{project.saves || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    {project.link_projeto && (
                      <a href={project.link_projeto} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:bg-white/10">
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    )}
                    {project.link_repositorio && (
                      <a href={project.link_repositorio} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:bg-white/10">
                        <Github className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showModal || editProject) && (
        <AddProjectModal
          project={editProject}
          userEmail={user.email}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
