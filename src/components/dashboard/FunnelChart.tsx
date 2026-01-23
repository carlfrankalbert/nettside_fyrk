import { ArrowDown } from 'lucide-react';

interface FunnelStep {
  id: string;
  label: string;
  count: number;
}

interface FunnelChartProps {
  title: string;
  steps: FunnelStep[];
  icon?: React.ReactNode;
}

export function FunnelChart({ title, steps, icon }: FunnelChartProps) {
  const maxCount = Math.max(...steps.map(s => s.count), 1);

  // Calculate conversion rates between steps
  const stepsWithRates = steps.map((step, index) => {
    const prevCount = index > 0 ? steps[index - 1].count : step.count;
    const conversionRate = prevCount > 0 ? (step.count / prevCount) * 100 : 0;
    const dropoffRate = prevCount > 0 ? ((prevCount - step.count) / prevCount) * 100 : 0;
    return { ...step, conversionRate, dropoffRate, prevCount };
  });

  // Overall funnel conversion (first to last)
  const overallConversion = steps.length > 1 && steps[0].count > 0
    ? ((steps[steps.length - 1].count / steps[0].count) * 100).toFixed(1)
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon && <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">{icon}</div>}
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        {overallConversion && (
          <div className="text-sm">
            <span className="text-slate-500">Total konvertering: </span>
            <span className={`font-bold ${parseFloat(overallConversion) >= 50 ? 'text-emerald-600' : parseFloat(overallConversion) >= 25 ? 'text-amber-600' : 'text-red-500'}`}>
              {overallConversion}%
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {stepsWithRates.map((step, index) => {
          const widthPercent = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id}>
              {/* Step bar */}
              <div className="relative">
                <div
                  className={`h-12 rounded-lg transition-all flex items-center justify-between px-4 ${
                    isFirst ? 'bg-slate-100' :
                    isLast ? 'bg-emerald-100' :
                    'bg-blue-50'
                  }`}
                  style={{ width: `${Math.max(widthPercent, 20)}%` }}
                >
                  <span className={`font-medium text-sm ${
                    isFirst ? 'text-slate-700' :
                    isLast ? 'text-emerald-700' :
                    'text-blue-700'
                  }`}>
                    {step.label}
                  </span>
                  <span className={`font-bold ${
                    step.count === 0 ? 'text-slate-300' :
                    isLast ? 'text-emerald-700' :
                    'text-slate-900'
                  }`}>
                    {step.count.toLocaleString('no-NO')}
                  </span>
                </div>
              </div>

              {/* Conversion arrow between steps */}
              {!isLast && (
                <div className="flex items-center gap-2 py-2 pl-4">
                  <ArrowDown className="w-4 h-4 text-slate-300" />
                  <div className="flex gap-4 text-xs">
                    <span className={`font-medium ${
                      step.conversionRate >= 70 ? 'text-emerald-600' :
                      step.conversionRate >= 40 ? 'text-amber-600' :
                      'text-red-500'
                    }`}>
                      {step.count > 0 ? `${stepsWithRates[index + 1].conversionRate.toFixed(0)}% videre` : '—'}
                    </span>
                    {step.dropoffRate > 0 && stepsWithRates[index + 1].count < step.count && (
                      <span className="text-slate-400">
                        ({Math.round(step.count - stepsWithRates[index + 1].count)} falt av)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
