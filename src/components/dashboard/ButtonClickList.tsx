import { useState, useEffect, useCallback } from 'react';
import { MousePointer, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ButtonData {
  id: string;
  label: string;
  count: number;
}

interface ButtonClickListProps {
  title: string;
  buttons: ButtonData[];
  icon?: React.ReactNode;
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

function ButtonRow({ button, maxCount }: { button: ButtonData; maxCount: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [period, setPeriod] = useState<Period>('week');
  const [chartData, setChartData] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const percentage = maxCount > 0 ? (button.count / maxCount) * 100 : 0;

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/track?timeseries=true&buttonId=${button.id}&period=${period}`);
      const result = (await response.json()) as { timeseries?: TimeseriesPoint[] };
      if (result.timeseries) {
        setChartData(result.timeseries);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [button.id, period]);

  useEffect(() => {
    if (isExpanded) {
      fetchChartData();
    }
  }, [isExpanded, fetchChartData]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className="text-sm font-semibold text-slate-900">{payload[0].value} klikk</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="group">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full relative overflow-hidden rounded-xl transition-all hover:shadow-sm"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-indigo-50 transition-all"
          style={{ width: `${percentage}%` }}
        />
        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <MousePointer className="w-4 h-4 text-indigo-500" />
            <span className="font-medium text-slate-700 text-left">{button.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-bold text-lg ${button.count === 0 ? 'text-slate-300' : 'text-slate-900'}`}>
              {button.count}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 bg-slate-50 rounded-xl p-4">
          <div className="flex justify-end mb-3">
            <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    period === option.value
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-24">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="animate-pulse text-sm">Laster...</div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Ingen data ennå
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`btn-gradient-${button.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    interval="preserveStartEnd"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill={`url(#btn-gradient-${button.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ButtonClickList({ title, buttons, icon }: ButtonClickListProps) {
  const maxCount = Math.max(...buttons.map(b => b.count), 1);
  const sortedButtons = [...buttons].sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        {icon && <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">{icon}</div>}
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2">
        {sortedButtons.map((button) => (
          <ButtonRow key={button.id} button={button} maxCount={maxCount} />
        ))}
      </div>
    </div>
  );
}
