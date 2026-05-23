import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import supabase from '@/api/supabaseClient';
import { getRoleRedirectPath, useAuth } from '@/lib/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkUserAuth } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const finishAuth = async () => {
      if (!supabase) {
        setError('Supabase não está configurado.');
        return;
      }

      const next = searchParams.get('next');

      try {
        let { data, error: sessionError } = await supabase.auth.getSession();

        if (!data?.session) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          ({ data, error: sessionError } = await supabase.auth.getSession());
        }

        if (sessionError) throw sessionError;

        const authUser = data?.session?.user;
        if (!authUser) {
          navigate('/login', { replace: true });
          return;
        }

        await checkUserAuth();

        if (next === 'role-selection') {
          navigate('/role-selection', { replace: true });
          return;
        }

        navigate(getRoleRedirectPath(authUser.user_metadata?.role), { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao finalizar autenticação.');
      }
    };

    finishAuth();
  }, [checkUserAuth, navigate, searchParams]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">
          {error || 'Finalizando login...'}
        </p>
      </div>
    </div>
  );
}
