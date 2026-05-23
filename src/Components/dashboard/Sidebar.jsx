import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderOpen, Briefcase, BarChart3, 
  Swords, MessageCircle, Settings, Zap, LogOut,
  Building2, Users, Bookmark, FileText, CreditCard, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import PlatformLogo from '@/Components/PlatformLogo';

const freelancerLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Portfólio', icon: FolderOpen, href: '/dashboard/portfolio' },
  { label: 'Jobs', icon: Briefcase, href: '/dashboard/jobs' },
  { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { label: 'Challenges', icon: Swords, href: '/dashboard/challenges' },
  { label: 'Mensagens', icon: MessageCircle, href: '/dashboard/messages' },
  { label: 'Configurações', icon: Settings, href: '/dashboard/settings' },
];

const clientLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/client' },
  { label: 'Criar Vaga', icon: FileText, href: '/client/create-job' },
  { label: 'Candidatos', icon: Users, href: '/client/candidates' },
  { label: 'Minhas Vagas', icon: Briefcase, href: '/client/jobs' },
  { label: 'Mensagens', icon: MessageCircle, href: '/client/messages' },
  { label: 'Configurações', icon: Settings, href: '/client/settings' },
];

export default function Sidebar({ mode = 'freelancer' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const links = mode === 'freelancer' ? freelancerLinks : clientLinks;
  const modeLabel = mode === 'freelancer' ? 'Freelancer' : 'Empresa';

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/30 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <PlatformLogo className="w-8 h-8" />
          <span className="font-heading font-bold text-foreground">Initlance</span>
        </Link>
        <button
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode badge */}
      <div className="px-3 pt-4 pb-2">
        <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-2">
          {mode === 'freelancer' ? <Zap className="w-3.5 h-3.5 text-primary" /> : <Building2 className="w-3.5 h-3.5 text-accent" />}
          <span className="text-xs font-medium text-foreground/70">{modeLabel}</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {links.map(link => {
          const active = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
              )}
            >
              <link.icon className="w-4 h-4 flex-shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border/30">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-border/30 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <PlatformLogo className="w-6 h-6" />
          <span className="font-heading font-bold text-sm text-foreground">Initlance</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "md:hidden fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col bg-sidebar border-r border-border/50 transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-60 flex-col border-r border-border/50 bg-sidebar">
        <NavContent />
      </aside>
    </>
  );
}
