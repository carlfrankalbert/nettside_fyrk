import { useState, useEffect } from 'react';
import { Globe, Share2, Megaphone, Tag } from 'lucide-react';

interface AcquisitionData {
  referrers: Record<string, number>;
  sources: Record<string, number>;
  mediums: Record<string, number>;
  campaigns: Record<string, number>;
}

interface AcquisitionChartProps {
  globalPeriod: 'today' | '7d' | '30d' | 'all';
}

const TRACKED_PAGES = ['home', 'okr', 'konseptspeil', 'antakelseskart', 'beslutningslogg', 'premortem'];

const API_PERIOD_MAP: Record<string, string> = {
  today: '24h',
  '7d': 'week',
  '30d': 'month',
  all: 'all',
};

function emptyAcquisition(): AcquisitionData {
  return { referrers: {}, sources: {}, mediums: {}, campaigns: {} };
}

function mergeAcquisition(target: AcquisitionData, source: AcquisitionData): void {
  for (const field of ['referrers', 'sources', 'mediums', 'campaigns'] as const) {
    for (const [key, count] of Object.entries(source[field])) {
      target[field][key] = (target[field][key] || 0) + count;
    }
  }
}

/** Maximum entries to display per field */
const MAX_DISPLAY_ENTRIES = 10;

const FIELD_CONFIG = [
  {
    field: 'referrers' as const,
    title: 'Topphenvisere',
    icon: <Globe className="w-4 h-4" />,
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    barFrom: 'from-emerald-100',
    barTo: 'to-emerald-50',
  },
  {
    field: 'sources' as const,
    title: 'UTM-kilder',
    icon: <Share2 className="w-4 h-4" />,
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    barFrom: 'from-blue-100',
    barTo: 'to-blue-50',
  },
  {
    field: 'mediums' as const,
    title: 'UTM-medium',
    icon: <Megaphone className="w-4 h-4" />,
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
    barFrom: 'from-violet-100',
    barTo: 'to-violet-50',
  },
  {
    field: 'campaigns' as const,
    title: 'UTM-kampanjer',
    icon: <Tag className="w-4 h-4" />,
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    barFrom: 'from-amber-100',
    barTo: 'to-amber-50',
  },
];

function AcquisitionList({ config, data }: {
  config: typeof FIELD_CONFIG[number];
  data: Record<string, number>;
}) {
  const entries = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_DISPLAY_ENTRIES);

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
                  className={`absolute inset-0 bg-gradient-to-r ${config.barFrom} ${config.barTo} transition-all`}
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex items-center justify-between px-4 py-2.5">
                  <span className="font-medium text-slate-700 truncate mr-4">{key}</span>
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

export function AcquisitionChart({ globalPeriod }: AcquisitionChartProps) {
  const [data, setData] = useState<AcquisitionData>(emptyAcquisition);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const period = API_PERIOD_MAP[globalPeriod];

    Promise.all(
      TRACKED_PAGES.map(pageId =>
        fetch(`/api/pageview?acquisition=true&pageId=${pageId}&period=${period}`)
          .then(r => r.json() as Promise<{ acquisition?: AcquisitionData }>)
          .then(result => result.acquisition)
          .catch(() => undefined)
      )
    ).then(results => {
      const merged = emptyAcquisition();
      for (const result of results) {
        if (result) mergeAcquisition(merged, result);
      }
      setData(merged);
    }).finally(() => setLoading(false));
  }, [globalPeriod]);

  const hasData = Object.values(data).some(field => Object.keys(field).length > 0);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-center text-slate-400">
          <div className="animate-pulse">Laster anskaffelsesdata...</div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="p-3 bg-slate-50 rounded-full w-fit mx-auto mb-3">
          <Globe className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-medium text-slate-600 mb-1">Ingen anskaffelsesdata enn&aring;</p>
        <p className="text-sm text-slate-400">
          Referrer- og UTM-data vises n&aring;r bes&oslash;kende kommer fra eksterne kilder eller lenker med UTM-parametere.
        </p>
      </div>
    );
  }

  // Only render fields that have data
  const activeFields = FIELD_CONFIG.filter(c => Object.keys(data[c.field]).length > 0);

  return (
    <div className={`grid gap-6 ${activeFields.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
      {activeFields.map(config => (
        <AcquisitionList key={config.field} config={config} data={data[config.field]} />
      ))}
    </div>
  );
}
