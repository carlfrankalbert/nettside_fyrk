import { Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface HourlyDistributionProps {
  title: React.ReactNode;
  distribution: Record<string, number>;
  icon?: React.ReactNode;
}

export function HourlyDistributionChart({ title, distribution, icon }: HourlyDistributionProps) {
  // Convert to array format for chart, ensuring all 24 hours exist
  const data = Array.from({ length: 24 }, (_, hour) => ({
    hour: String(hour),
    label: `${String(hour).padStart(2, '0')}:00`,
    count: distribution[String(hour)] || 0,
  }));

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  // Find peak hours (top 3)
  const peakHours = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter(d => d.count > 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; count: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalCount > 0 ? ((data.count / totalCount) * 100).toFixed(1) : '0';
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-xs text-slate-500 mb-1">{data.label} UTC</p>
          <p className="text-sm font-semibold text-slate-900">{data.count} hendelser</p>
          <p className="text-xs text-slate-400">{percentage}% av total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon || <div className="p-2 bg-purple-50 rounded-lg"><Clock className="w-5 h-5 text-purple-600" /></div>}
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        {peakHours.length > 0 && (
          <div className="text-xs text-slate-500">
            Topp: {peakHours.map(h => h.label).join(', ')}
          </div>
        )}
      </div>

      <div className="h-32">
        {totalCount === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Ingen data ennå
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                interval={5}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count === maxCount ? '#8b5cf6' : '#c4b5fd'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
