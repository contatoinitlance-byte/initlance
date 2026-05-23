import { ExternalLink, Github, Globe } from 'lucide-react';

const COLORS = [
  'bg-[#2563eb]',
  'bg-[#7c3aed]',
  'bg-[#0891b2]',
  'bg-[#16a34a]',
  'bg-[#db2777]',
  'bg-[#ea580c]',
];

const normalizeUrl = (url) => {
  if (!url) return null;
  const value = String(url).trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const getDomain = (url) => {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, '');
  } catch {
    return String(url || '').replace(/^https?:\/\//i, '').split('/')[0] || 'link do projeto';
  }
};

const getColor = (domain) => {
  const total = domain.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COLORS[total % COLORS.length];
};

export default function LinkPreviewCover({ projectUrl, repositoryUrl, title }) {
  const url = projectUrl || repositoryUrl;
  const domain = getDomain(url);
  const isGithub = /(^|\.)github\.com$/i.test(domain);
  const Icon = isGithub ? Github : projectUrl ? ExternalLink : Globe;

  return (
    <div className={`w-full h-full ${getColor(domain)} flex flex-col items-center justify-center p-5 text-center`}>
      <div className="w-14 h-14 rounded-2xl bg-white/16 border border-white/20 flex items-center justify-center shadow-lg">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <p className="mt-3 max-w-full truncate text-sm font-semibold text-white">{title || domain}</p>
      <p className="mt-1 max-w-full truncate text-xs text-white/75">{domain}</p>
    </div>
  );
}
