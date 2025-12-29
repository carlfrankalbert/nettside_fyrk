import { useState, useEffect, useCallback } from 'react';
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
  totalViews: number;
  totalVisitors: number;
  todayVisitors: number;
}

interface TrafficChartProps {
  pageId: string;
  stats: PageStats;
}

type Period = '24h' | 'week' | 'month' | 'year';

interface TimeseriesPoint {
  label: string;
  value: number;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '24h', label: '24t' },
  { value: 'week', label: 'Uke' },
  { value: 'month', label: 'Måned' },
  { value: 'year', label: 'År' },
];

export function TrafficChart({ pageId, stats }: TrafficChartProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pageview?timeseries=true&pageId=${pageId}&period=${period}`);
      const result = await response.json();
      if (result.timeseries) {
        setData(result.timeseries);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [pageId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900">{stats.label}</h3>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === option.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-slate-50 rounded-xl">
          <div className="flex justify-center mb-2">
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalViews.toLocaleString('no-NO')}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Visninger</div>
        </div>
        <div className="text-center p-4 bg-slate-50 rounded-xl">
          <div className="flex justify-center mb-2">
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalVisitors.toLocaleString('no-NO')}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Unike</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <div className="flex justify-center mb-2">
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.todayVisitors}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">I dag</div>
        </div>
      </div>

      <div className="h-48">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="animate-pulse">Laster...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            Ingen data ennå
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
