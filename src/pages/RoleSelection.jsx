import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Building2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/api/supabaseData';
import PlatformLogo from '@/Components/PlatformLogo';

export default function RoleSelection() {
  const [selecting, setSelecting] = useState(null);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoadingAuth, updateUserRole } = useAuth();
  const intent = searchParams.get('intent');

  const handleSelect = async (role) => {
    setSelecting(role);
    setError('');

    try {
      await updateUserRole(role);

      if (user?.email) {
        await db.users.upsertById({
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          foto_perfil: user.user_metadata?.foto_perfil || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          role,
        });
      }

      window.location.href = role === 'freelancer' ? '/dashboard' : '/client';
    } catch (e) {
      console.error('Role update error:', e);
      setError(e instanceof Error ? e.message : 'Nao foi possivel salvar seu perfil.');
      setSelecting(null);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/6 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="flex items-center justify-center gap-2 mb-10">
          <PlatformLogo className="w-8 h-8" />
          <span className="font-heading font-bold text-xl text-foreground">Initlance</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
            Como voce quer usar o Initlance?
          </h1>
          <p className="text-muted-foreground text-sm">
            Escolha seu perfil. Voce podera alterar depois nas configuracoes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            disabled={!!selecting}
            onClick={() => handleSelect('freelancer')}
            className={`group glass rounded-2xl p-6 text-left hover:bg-white/[0.06] transition-all duration-300 border border-border/50 hover:border-primary/40 disabled:opacity-60 disabled:cursor-not-allowed
              ${selecting === 'freelancer' ? 'border-primary/60 bg-primary/5' : ''}
              ${intent === 'client' ? 'opacity-50' : ''}
            `}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-heading font-semibold text-lg text-foreground mb-1">Freelancer</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mostre seus projetos, envie propostas e construa seu legado profissional.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs text-primary font-medium">
              {selecting === 'freelancer' ? 'Entrando...' : 'Comecar como Freelancer'}
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            disabled={!!selecting}
            onClick={() => handleSelect('client')}
            className={`group glass rounded-2xl p-6 text-left hover:bg-white/[0.06] transition-all duration-300 border border-border/50 hover:border-accent/40 disabled:opacity-60 disabled:cursor-not-allowed
              ${intent === 'client' ? 'ring-1 ring-accent/40 border-accent/40' : ''}
              ${selecting === 'client' ? 'border-accent/60 bg-accent/5' : ''}
            `}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            <h2 className="font-heading font-semibold text-lg text-foreground mb-1">Cliente / Empresa</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Contrate freelancers verificados e gerencie seus projetos com facilidade.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs text-accent font-medium">
              {selecting === 'client' ? 'Entrando...' : 'Comecar como Cliente'}
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </div>

        {error && (
          <p className="text-center text-xs text-destructive mt-6">
            {error}
          </p>
        )}

        {intent === 'client' && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            Voce veio pela opcao <strong className="text-accent">Contratar Talentos</strong>. Sugerimos o perfil de <strong className="text-accent">Cliente</strong>.
          </p>
        )}
      </motion.div>
    </div>
  );
}
