import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const finishAuth = async () => {
      if (!supabase) {
        setError('Supabase nao esta configurado.');
        return;
      }

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!data?.session) {
          navigate('/login', { replace: true });
          return;
        }

        await checkUserAuth();
        navigate('/marketplace', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao finalizar autenticacao.');
      }
    };

    finishAuth();
  }, [checkUserAuth, navigate]);

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
