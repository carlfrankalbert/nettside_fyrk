import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Globe, Users, Eye } from 'lucide-react';

interface PageStats {
  label: string;
  views: number;
  visitors: number;
}

interface TrafficChartProps {
  pageId: string;
  stats: PageStats;
  globalPeriod: 'today' | '7d' | '30d' | 'all';
}

interface TimeseriesPoint {
  label: string;
  value: number;
}

const API_PERIOD_MAP: Record<string, string> = {
  today: '24h',
  '7d': 'week',
  '30d': 'month',
  all: 'all',
};

export function TrafficChart({ pageId, stats, globalPeriod }: TrafficChartProps) {
  const [data, setData] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pageview?timeseries=true&pageId=${pageId}&period=${API_PERIOD_MAP[globalPeriod]}`)
      .then(r => r.json() as Promise<{ timeseries?: TimeseriesPoint[] }>)
      .then(result => {
        if (result.timeseries) setData(result.timeseries);
      })
      .catch(err => console.error('Error fetching chart data:', err))
      .finally(() => setLoading(false));
  }, [pageId, globalPeriod]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className="text-sm font-semibold text-slate-900">{payload[0].value} visninger</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="font-semibold text-slate-900">{stats.label}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-slate-50 rounded-xl">
          <div className="flex justify-center mb-2">
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.views.toLocaleString('no-NO')}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Visninger</div>
        </div>
        <div className="text-center p-4 bg-slate-50 rounded-xl">
          <div className="flex justify-center mb-2">
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.visitors.toLocaleString('no-NO')}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Unike</div>
        </div>
      </div>

      <div className="h-48">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="animate-pulse">Laster...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            Ingen data enn&aring;
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id={`gradient-${pageId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill={`url(#gradient-${pageId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
