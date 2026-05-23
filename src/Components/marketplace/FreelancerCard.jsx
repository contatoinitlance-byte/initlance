import { useNavigate } from 'react-router-dom';
import { Globe, Instagram, Linkedin, MapPin, Shield } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';

const rankColors = {
  Rookie: 'text-slate-400',
  Builder: 'text-green-400',
  Specialist: 'text-blue-400',
  Expert: 'text-purple-400',
  Elite: 'text-yellow-400',
};

export default function FreelancerCard({ freelancer }) {
  const navigate = useNavigate();
  const { id, name, role, avatar, proofScore, rank, badges, hourlyRate, rateNegotiable, skills, location, links = {} } = freelancer;
  const initials = name ? name[0].toUpperCase() : '?';
  const formatUrl = (url) => {
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };
  const socialLinks = [
    { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', url: links.linkedin },
    { key: 'instagram', icon: Instagram, label: 'Instagram', url: links.instagram },
    { key: 'website', icon: Globe, label: 'Site', url: links.website },
  ].filter((item) => item.url);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/profile/${encodeURIComponent(id)}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') navigate(`/profile/${encodeURIComponent(id)}`);
      }}
      className="block min-w-0"
    >
      <div className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition-all duration-300 group cursor-pointer h-full">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30 flex-shrink-0 flex items-center justify-center">
            {avatar
              ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-sm">{initials}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-heading font-semibold text-foreground truncate">{name}</h3>
              <span className={`flex-shrink-0 text-xs font-medium ${rankColors[rank] || 'text-slate-400'}`}>{rank}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{role}</p>
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 min-w-0">
                <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{location}</span>
              </p>
            )}
          </div>
        </div>

        {/* Proof Score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-xs font-heading font-bold gradient-text">{proofScore}</span>
            </div>
            <span className="text-xs text-muted-foreground">Proof Score</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-heading font-semibold gradient-text">{proofScore}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {badges?.slice(0, 3).map(b => (
            <div key={b} className="flex min-w-0 items-center gap-1 glass rounded-full px-2 py-0.5">
              <Shield className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="text-xs text-foreground/80 truncate">{b}</span>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills?.slice(0, 4).map(s => (
            <Badge key={s} variant="secondary" className="max-w-full break-words text-xs bg-secondary/50 text-muted-foreground border-0 rounded-md">{s}</Badge>
          ))}
        </div>

        {socialLinks.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {socialLinks.map((item) => (
              <a
                key={item.key}
                href={formatUrl(item.url)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                title={item.label}
                onClick={(event) => event.stopPropagation()}
                className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <span className="text-xs text-muted-foreground">A partir de</span>
          <span className="font-heading font-semibold text-foreground truncate">
            {rateNegotiable || !hourlyRate ? 'A combinar' : `R$${hourlyRate}/h`}
          </span>
        </div>
      </div>
    </div>
  );
}
