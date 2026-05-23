import { Shield } from 'lucide-react';

export default function ScoreCard({ score = 87 }) {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground font-medium">Proof Score</span>
                <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-5">
                <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                        <circle
                            cx="50" cy="50" r="45" fill="none"
                            stroke="url(#proofGradient)" strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className="transition-all duration-1000"
                        />
                        <defs>
                            <linearGradient id="proofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="hsl(258 70% 58%)" />
                                <stop offset="100%" stopColor="hsl(217 80% 56%)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-heading font-bold text-2xl gradient-text">{score}</span>
                    </div>
                </div>
                <div className="space-y-2 flex-1">
                    {[
                        { label: 'Projetos', value: 92 },
                        { label: 'Portfólio', value: 85 },
                        { label: 'Resposta', value: 78 },
                        { label: 'Prazos', value: 95 },
                    ].map(item => (
                        <div key={item.label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="text-foreground">{item.value}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-border">
                                <div
                                    className="h-1 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                                    style={{ width: `${item.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}