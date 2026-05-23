import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/Components/ui/button";
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PlatformLogo from '@/Components/PlatformLogo';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Preços', href: '#pricing' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <PlatformLogo className="w-8 h-8" />
            <span className="font-heading font-bold text-lg text-foreground">Initlance</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0">
                Começar Grátis
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-strong border-t border-border"
          >
            <div className="px-4 py-4 space-y-3">
              {links.map(l => (
                <a key={l.label} href={l.href} className="block text-sm text-muted-foreground hover:text-foreground py-2">
                  {l.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login"><Button variant="ghost" className="w-full">Entrar</Button></Link>
                <Link to="/register"><Button className="w-full bg-gradient-to-r from-primary to-accent text-white border-0">Começar Grátis</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
