import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    const { user, isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background font-body">
            <div className="max-w-md w-full text-center space-y-6">
                <h1 className="text-7xl font-heading font-bold gradient-text">404</h1>
                <div className="h-px w-16 bg-border mx-auto" />
                <h2 className="text-xl font-heading font-semibold text-foreground">Página não encontrada</h2>
                <p className="text-sm text-muted-foreground">
                    A página <span className="text-foreground font-medium">"{pageName}"</span> não foi encontrada.
                </p>

                {isAuthenticated && user?.role === 'admin' && (
                    <div className="glass rounded-xl p-4 text-left">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Admin:</span> Esta página pode ainda não ter sido implementada.
                        </p>
                    </div>
                )}

                <button
                    onClick={() => window.location.href = '/'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar ao Início
                </button>
            </div>
        </div>
    );
}
