import { AlertTriangle, Users, Zap, Database } from 'lucide-react';

interface MetricsSummaryProps {
  title: string;
  metrics: {
    count: number;
    totalCharCount: number;
    totalProcessingTimeMs: number;
    cachedCount: number;
    freshCount: number;
    errorTypes: Record<string, number>;
    uniqueSessionCount: number;
  };
  icon?: React.ReactNode;
}

const ERROR_LABELS: Record<string, string> = {
  timeout: 'Timeout',
  rate_limit: 'Rate limit',
  budget_exceeded: 'Budsjett overskredet',
  validation: 'Validering',
  api_error: 'API-feil',
  network: 'Nettverk',
  unknown: 'Ukjent',
};

export function MetricsSummary({ title, metrics, icon }: MetricsSummaryProps) {
  const _avgCharCount = metrics.count > 0 ? Math.round(metrics.totalCharCount / metrics.count) : 0;
  const avgProcessingTime = metrics.count > 0 ? Math.round(metrics.totalProcessingTimeMs / metrics.count) : 0;
  const cacheHitRate = (metrics.cachedCount + metrics.freshCount) > 0
    ? ((metrics.cachedCount / (metrics.cachedCount + metrics.freshCount)) * 100).toFixed(0)
    : '0';

  const totalErrors = Object.values(metrics.errorTypes).reduce((sum, count) => sum + count, 0);
  const errorRate = metrics.count > 0 ? ((totalErrors / metrics.count) * 100).toFixed(1) : '0';

  const sortedErrors = Object.entries(metrics.errorTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        {icon || <div className="p-2 bg-cyan-50 rounded-lg"><Zap className="w-5 h-5 text-cyan-600" /></div>}
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Unike sesjoner</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics.uniqueSessionCount.toLocaleString('no-NO')}
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Cache hit</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {cacheHitRate}%
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Snitt responstid</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {avgProcessingTime > 1000 ? `${(avgProcessingTime / 1000).toFixed(1)}s` : `${avgProcessingTime}ms`}
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Feilrate</span>
          </div>
          <div className={`text-xl font-bold ${parseFloat(errorRate) > 5 ? 'text-red-500' : parseFloat(errorRate) > 1 ? 'text-amber-500' : 'text-emerald-600'}`}>
            {errorRate}%
          </div>
        </div>
      </div>

      {/* Error breakdown */}
      {sortedErrors.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Feilfordeling</h4>
          <div className="space-y-2">
            {sortedErrors.map(([type, count]) => {
              const percentage = totalErrors > 0 ? (count / totalErrors) * 100 : 0;
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{ERROR_LABELS[type] || type}</span>
                      <span className="font-medium text-slate-900">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sortedErrors.length === 0 && (
        <div className="text-center text-sm text-slate-400 py-4">
          Ingen feil registrert
        </div>
      )}
    </div>
  );
}
