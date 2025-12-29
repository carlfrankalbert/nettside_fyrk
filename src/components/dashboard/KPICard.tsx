import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary';
}

export function KPICard({ title, value, icon, trend, variant = 'default' }: KPICardProps) {
  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return 'text-emerald-600 bg-emerald-50';
    if (trendValue < 0) return 'text-red-600 bg-red-50';
    return 'text-slate-500 bg-slate-100';
  };

  const getTrendIcon = (trendValue: number) => {
    if (trendValue > 0) return <TrendingUp className="w-3 h-3" />;
    if (trendValue < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const formatTrendValue = (trendValue: number) => {
    const sign = trendValue > 0 ? '+' : '';
    return `${sign}${trendValue}%`;
  };

  if (variant === 'primary') {
    return (
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-indigo-100 font-medium text-sm">{title}</span>
          {icon && <div className="text-indigo-200">{icon}</div>}
        </div>
        <div className="text-4xl font-bold mb-2">{value.toLocaleString('no-NO')}</div>
        {trend && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-white/20`}>
              {getTrendIcon(trend.value)}
              {formatTrendValue(trend.value)}
            </span>
            <span className="text-indigo-200 text-xs">{trend.label}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-500 font-medium text-sm">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-2">{value.toLocaleString('no-NO')}</div>
      {trend && (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getTrendColor(trend.value)}`}>
            {getTrendIcon(trend.value)}
            {formatTrendValue(trend.value)}
          </span>
          <span className="text-slate-400 text-xs">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
