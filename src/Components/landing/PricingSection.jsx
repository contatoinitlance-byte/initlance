import { motion } from 'framer-motion';
import { Button } from "@/Components/ui/button";
import { Check, Sparkles, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
    {
        name: 'Free',
        price: 'R$0',
        period: '/mês',
        description: 'Perfeito para começar',
        features: [
            'Portfólio básico',
            'Propostas limitadas (5/mês)',
            'Uploads limitados',
            'Proof Score básico',
            'Perfil público',
        ],
        cta: 'Começar Grátis',
        popular: false,
        gradient: '',
    },
    {
        name: 'Pro Freelancer',
        price: 'R$49',
        period: '/mês',
        description: 'Para quem quer se destacar',
        features: [
            'Temas premium de portfólio',
            'Propostas ilimitadas',
            'Analytics avançados',
            'Perfil destacado no marketplace',
            'Ferramentas premium de portfólio',
            'Badges prioritárias',
            'Suporte prioritário',
        ],
        cta: 'Começar Pro',
        popular: true,
        gradient: 'from-primary to-accent',
        icon: Sparkles,
    },
    {
        name: 'Business',
        price: 'R$149',
        period: '/mês',
        description: 'Para empresas contratando',
        features: [
            'Vagas ilimitadas',
            'Analytics de contratação',
            'Gestão de equipe',
            'Vagas destacadas',
            'Filtros avançados',
            'Shortlist de talentos',
            'Suporte dedicado',
        ],
        cta: 'Falar com Vendas',
        popular: false,
        gradient: '',
        icon: Building2,
    },
];

export default function PricingSection() {
    return (
        <section id="pricing" className="py-24 px-4 relative">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-3">Preços</p>
                        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
                            Escolha seu{' '}
                            <span className="gradient-text">plano</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Comece grátis e evolua conforme seu crescimento profissional.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {plans.map((plan, i) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl p-6 transition-all duration-300 ${plan.popular
                                    ? 'glass-strong glow-purple scale-105'
                                    : 'glass hover:bg-white/[0.04]'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold px-4 py-1 rounded-full">
                                        Mais Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="font-heading font-semibold text-lg text-foreground mb-1">{plan.name}</h3>
                                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-heading font-bold text-4xl text-foreground">{plan.price}</span>
                                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm">
                                        <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className="text-foreground/80">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link to="/register">
                                <Button
                                    className={`w-full rounded-xl h-11 font-semibold ${plan.popular
                                            ? 'bg-gradient-to-r from-primary to-accent text-white border-0 hover:opacity-90'
                                            : 'bg-secondary hover:bg-secondary/80 text-foreground border-border/50'
                                        }`}
                                >
                                    {plan.cta}
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}