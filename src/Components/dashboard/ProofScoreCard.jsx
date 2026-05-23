export default function ProofScoreCard({ score = 0, projectsScore = 0, portfolioScore = 0, responsesScore = 0, deadlinesScore = 0 }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const metrics = [
    { label: 'Projetos', value: Math.round(projectsScore) },
    { label: 'Portfólio', value: Math.round(portfolioScore) },
    { label: 'Respostas', value: Math.round(responsesScore) },
    { label: 'Prazos', value: Math.round(deadlinesScore) },
  ];

  return (
    <div className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">Proof Score</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <defs>
              <linearGradient id="psGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(258 70% 58%)" />
                <stop offset="100%" stopColor="hsl(217 80% 56%)" />
              </linearGradient>
            </defs>
            <circle cx="48" cy="48" r={r} fill="none" stroke="hsl(240 5% 17%)" strokeWidth="8" />
            <circle
              cx="48" cy="48" r={r} fill="none"
              stroke="url(#psGrad)" strokeWidth="8"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 0.7s ease' }}
            />
            <text x="48" y="53" textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="Space Grotesk, sans-serif">
              {score}
            </text>
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          {metrics.map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="text-foreground font-medium">{m.value}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-border">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                  style={{ width: `${Math.min(100, m.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}