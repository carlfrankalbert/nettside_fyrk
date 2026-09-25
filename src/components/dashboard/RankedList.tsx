import type { ReactNode } from 'react';

export interface RankedListStyle {
  title: string;
  icon: ReactNode;
  iconBg: string;
  iconText: string;
  barFrom: string;
  barTo: string;
}

interface RankedListProps {
  config: RankedListStyle;
  data: Record<string, number>;
  /** Maximum rows to show (default 10) */
  maxEntries?: number;
  /** Optional display label for a key (e.g. country code → name) */
  formatKey?: (key: string) => string;
}

/** A card with the top entries of a count map, drawn as horizontal bars */
export function RankedList({ config, data, maxEntries = 10, formatKey = (k) => k }: RankedListProps) {
  const entries = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxEntries);

  const maxCount = entries.length > 0 ? entries[0][1] : 1;
  const total = Object.values(data).reduce((sum, c) => sum + c, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${config.iconBg} rounded-lg ${config.iconText}`}>
            {config.icon}
          </div>
          <h4 className="font-semibold text-slate-900">{config.title}</h4>
        </div>
        {total > 0 && (
          <span className="text-sm text-slate-400">{total.toLocaleString('no-NO')} totalt</span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">Ingen data enn&aring;</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, count]) => {
            const percentage = (count / maxCount) * 100;
            return (
              <div key={key} className="relative overflow-hidden rounded-xl">
                <div
                  className={`absolute inset-0 bg-linear-to-r ${config.barFrom} ${config.barTo} transition-all`}
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex items-center justify-between px-4 py-2.5">
                  <span className="font-medium text-slate-700 truncate mr-4">{formatKey(key)}</span>
                  <span className="font-bold text-slate-900 shrink-0">
                    {count.toLocaleString('no-NO')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
