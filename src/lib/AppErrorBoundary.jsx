import React from 'react';
import { Button } from '@/Components/ui/button';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App render error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const message = this.state.error instanceof Error
      ? this.state.error.message
      : String(this.state.error || 'Erro desconhecido');

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-6 max-w-md text-center">
          <h1 className="font-heading font-bold text-xl text-foreground mb-2">Algo saiu do lugar</h1>
          <p className="text-sm text-muted-foreground mb-4">
            A pagina encontrou um erro, mas seus dados nao foram apagados.
          </p>
          <pre className="mb-4 max-h-32 overflow-auto rounded-xl bg-black/30 p-3 text-left text-xs text-muted-foreground whitespace-pre-wrap">
            {message}
          </pre>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => window.location.reload()} className="rounded-xl">
              Recarregar
            </Button>
            <Button onClick={() => window.location.assign('/dashboard/settings')} variant="outline" className="rounded-xl">
              Configuracoes
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
