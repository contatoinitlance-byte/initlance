import { motion } from 'framer-motion';
import { Layers, Shield, Award, Trophy, Swords, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Layers,
    title: 'Portfólio Vivo',
    description: 'Anexe imagens, vídeos, modelos 3D, snippets de código, websites, PDFs e links GitHub.',
    gradient: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    icon: BarChart3,
    title: 'Proof Score',
    description: 'Sistema de reputação baseado em trabalhos concluídos, portfólio, taxa de resposta, prazos e satisfação de clientes.',
    gradient: 'from-accent/20 to-accent/5',
    iconColor: 'text-accent',
    badge: '87/100',
  },
  {
    icon: Shield,
    title: 'Verificação de Skills',
    description: 'Conquiste badges verificadas: Frontend, UI Design, Artista 3D, Editor de Vídeo e muito mais.',
    gradient: 'from-green-500/20 to-green-500/5',
    iconColor: 'text-green-400',
  },
  {
    icon: Trophy,
    title: 'Sistema de Legado',
    description: 'Evolua pelos ranks: Rookie → Builder → Specialist → Expert → Elite. Desbloqueie conquistas e milestones.',
    gradient: 'from-yellow-500/20 to-yellow-500/5',
    iconColor: 'text-yellow-400',
  },
  {
    icon: Swords,
    title: 'Desafios e Missões',
    description: 'Prove suas habilidades com desafios reais: redesign de landing pages, modelos 3D, edição de vídeos e mais. Ganhe certificados que podem ir para seu portifólio.',
    gradient: 'from-pink-500/20 to-pink-500/5',
    iconColor: 'text-pink-400',
  },
  {
    icon: Award,
    title: 'Analytics Avançados',
    description: 'Acompanhe visualizações, engajamento, crescimento de perfil, conversão de propostas e ganhos em tempo real.',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
    iconColor: 'text-cyan-400',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Funcionalidades</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
              Tudo que você precisa para{' '}
              <span className="gradient-text">provar seu valor</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas poderosas projetadas para freelancers que querem ir além do currículo tradicional.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group glass rounded-2xl p-6 hover:bg-white/[0.04] transition-all duration-300 cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.iconColor}`} />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-heading font-semibold text-lg text-foreground">{f.title}</h3>
                {f.badge && (
                  <span className="text-xs font-semibold bg-gradient-to-r from-primary to-accent text-white px-2 py-0.5 rounded-full">
                    {f.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}