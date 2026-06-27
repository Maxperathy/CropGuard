import { Card } from './Card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
}

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  trend,
}: StatCardProps) {
  return (
    <Card hoverEffect className="flex flex-col justify-between h-32 p-5 relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-zinc-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {trend || subtext ? (
        <div className="flex items-center gap-1.5 mt-auto">
          {trend && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                trend.type === 'up'
                  ? 'bg-emerald-50 text-emerald-700'
                  : trend.type === 'down'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-zinc-50 text-zinc-500'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtext && <span className="text-[10px] font-medium text-zinc-400">{subtext}</span>}
        </div>
      ) : null}
    </Card>
  );
}
