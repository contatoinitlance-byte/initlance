import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const ranks = [
  { name: 'Rookie', color: 'from-slate-400 to-slate-500', level: 1, desc: 'Primeiros passos na plataforma' },
  { name: 'Builder', color: 'from-green-400 to-emerald-500', level: 2, desc: 'Portfólio em construção' },
  { name: 'Specialist', color: 'from-blue-400 to-cyan-500', level: 3, desc: 'Skills verificadas' },
  { name: 'Expert', color: 'from-primary to-violet-500', level: 4, desc: 'Reputação consolidada' },
  { name: 'Elite', color: 'from-yellow-400 to-orange-500', level: 5, desc: 'Topo da plataforma' },
];

const milestones = [
  'Primeiro Projeto',
  '10 Clientes Satisfeitos',
  '50 Visualizações de Portfólio',
  'Primeira Skill Verificada',
];

export default function RanksSection() {
  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Progressão</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
              Evolua seu{' '}
              <span className="gradient-text">legado</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Um sistema de ranks que recompensa seu crescimento profissional.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-12">
          {ranks.map((r, i) => (
            <div
              key={r.name}
              className="glass rounded-2xl p-5 text-center group hover:bg-white/[0.04] transition-all"
            >
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${r.color} mx-auto mb-3 flex items-center justify-center`}>
                <span className="text-white font-heading font-bold text-lg">{r.level}</span>
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1">{r.name}</h3>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
              <div className="flex justify-center gap-0.5 mt-2">
                {Array.from({ length: r.level }).map((_, j) => (
                  <Star key={j} className={`w-3 h-3 fill-current bg-gradient-to-br ${r.color} bg-clip-text`} style={{ color: i === 4 ? '#facc15' : i === 3 ? '#a855f7' : i === 2 ? '#3b82f6' : i === 1 ? '#22c55e' : '#94a3b8' }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6 md:p-8">
          <h3 className="font-heading font-semibold text-lg mb-4">Milestones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {milestones.map((m, i) => (
              <div key={m} className="flex items-center gap-3 glass rounded-xl p-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <span className="text-sm text-foreground">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}