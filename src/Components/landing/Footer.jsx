import PlatformLogo from '@/Components/PlatformLogo';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <PlatformLogo className="w-7 h-7" />
            <span className="font-heading font-bold text-foreground">Initlance</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
            <span>Privacidade</span>
            <span>Termos</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Initlance. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
