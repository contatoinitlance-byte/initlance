import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/Components/ui/button";
import { ArrowRight, Play, CheckCircle, Star, Send, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import PlatformLogo from '@/Components/PlatformLogo';

function PhoneMockup() {
  return (
    <div className="relative flex items-center justify-center w-full h-full px-8 mx-5">
      {/* Glow behind phone */}
      <div className="absolute w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute w-48 h-48 bg-accent/15 rounded-full blur-2xl translate-x-12" />

      {/* iPhone frame */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10 w-[240px] h-full rounded-[44px] bg-[#111115] border-[6px] border-[#2a2a35] shadow-2xl overflow-hidden flex flex-col"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(120,80,255,0.15)' }}>
        
        {/* Notch */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-20 h-5 bg-[#0a0a0e] rounded-full" />
        </div>

        {/* Status bar */}
        <div className="flex justify-between items-center px-5 py-1 text-[9px] text-white/50">
          <span>9:41</span>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-1.5 border border-white/40 rounded-sm"><div className="w-2 h-full bg-white/40 rounded-sm" /></div>
          </div>
        </div>

        {/* App header */}
        <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
          <PlatformLogo className="w-6 h-6" />
          <span className="text-white text-xs font-semibold">Initlance</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] text-green-400">online</span>
          </div>
        </div>

        {/* Chat header */}
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            T
          </div>
          <div>
            <div className="text-white text-[11px] font-semibold">TechCorp Brasil</div>
            <div className="text-white/40 text-[9px]">Cliente verificado</div>
          </div>
          <CheckCircle className="w-3.5 h-3.5 text-blue-400 ml-auto" />
        </div>

        {/* Messages */}
        <div className="px-3 py-3 space-y-2.5 bg-[#0d0d12] flex-1 overflow-hidden">
          {/* Client message */}
          <div className="flex gap-2 items-end">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex-shrink-0 flex items-center justify-center text-white text-[7px] font-bold">T</div>
            <div className="bg-[#1e1e28] rounded-2xl rounded-bl-sm px-3 py-2 max-w-[160px]">
              <p className="text-white/80 text-[10px] leading-relaxed">Olá! Vi seu portfólio e adorei seu trabalho com UI/UX. Tem disponibilidade?</p>
              <span className="text-white/25 text-[8px]">10:32</span>
            </div>
          </div>

          {/* Freelancer message */}
          <div className="flex gap-2 items-end justify-end">
            <div className="bg-gradient-to-br from-primary/80 to-accent/80 rounded-2xl rounded-br-sm px-3 py-2 max-w-[160px]">
              <p className="text-white text-[10px] leading-relaxed">Oi! Sim, tenho disponibilidade. Vi que buscam um redesign do app. </p>
              <span className="text-white/50 text-[8px]">10:34</span>
            </div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-violet-500 flex-shrink-0 flex items-center justify-center text-white text-[7px] font-bold">A</div>
          </div>

          {/* Client message 2 */}
          <div className="flex gap-2 items-end">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex-shrink-0 flex items-center justify-center text-white text-[7px] font-bold">T</div>
            <div className="bg-[#1e1e28] rounded-2xl rounded-bl-sm px-3 py-2 max-w-[160px]">
              <p className="text-white/80 text-[10px] leading-relaxed">Perfeito! Seu Proof Score de 87 nos convenceu. Qual sua proposta?</p>
              <span className="text-white/25 text-[8px]">10:35</span>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="px-3 py-2.5 bg-[#0d0d12] border-t border-white/5 flex items-center gap-2">
          <div className="flex-1 bg-[#1e1e28] rounded-full px-3 py-1.5">
            <span className="text-white/20 text-[10px]">Mensagem...</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Send className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-2">
          <div className="w-24 h-1 bg-white/20 rounded-full" />
        </div>
      </motion.div>
    </div>);

}

export default function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleContratarTalentos = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent('/role-selection?intent=client')}`);
      return;
    }
    if (user?.role === 'client') {
      navigate('/client');
    } else if (!user?.role) {
      navigate('/role-selection?intent=client');
    } else {
      navigate('/marketplace');
    }
  };
  return (
    <section className="relative flex items-center pt-24 pb-16 px-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/6 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">

        {/* LEFT — text content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start text-left">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium">O futuro da prova de habilidades</span>
          </div>

          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight tracking-tight mb-6">
            Construa seu{' '}
            <span className="gradient-text">legado</span>,<br />
            não apenas um currículo.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed font-body">
            Mostre habilidades reais, projetos e evoluções, adquira experiências. Somos a plataforma que te prepara para o futuro.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 h-12 px-8 text-sm font-semibold rounded-xl gap-2">
                Começar como Freelancer
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <button onClick={handleContratarTalentos}>
              <Button variant="outline" size="lg" className="h-12 px-8 text-sm font-semibold rounded-xl border-border/50 hover:bg-secondary gap-2">
                <Play className="w-4 h-4" />
                Contratar Talentos
              </Button>
            </button>
          </div>
        </motion.div>

        {/* RIGHT — phone mockup */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative hidden lg:flex items-stretch justify-center self-stretch">
          
          <PhoneMockup />
        </motion.div>

      </div>
    </section>);

}
