import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, trend, trendUp = true, icon: Icon, iconColor = 'text-primary' }) {
    return (
        <div className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{title}</span>
                {Icon && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Icon className={cn("w-4 h-4", iconColor)} />
                    </div>
                )}
            </div>
            <div className="font-heading font-bold text-2xl text-foreground mb-1">{value}</div>
            {trend && (
                <div className={cn("flex items-center gap-1 text-xs font-medium", trendUp ? "text-green-400" : "text-red-400")}>
                    {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend}
                </div>
            )}
        </div>
    );
}