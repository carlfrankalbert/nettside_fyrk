import { MousePointer, Eye, Zap, BarChart3, ExternalLink, Sparkles, ThumbsUp, Activity, Lightbulb, Map, FileText, TrendingUp } from 'lucide-react';
import { KPICard } from './KPICard';
import { TrafficChart } from './TrafficChart';
import { ButtonClickList } from './ButtonClickList';
import { FunnelChart } from './FunnelChart';
import { HourlyDistributionChart } from './HourlyDistributionChart';
import { MetricsSummary } from './MetricsSummary';
import { Tooltip, METRIC_EXPLANATIONS } from './Tooltip';
import { CollapsibleSection } from './CollapsibleSection';
import { EmptyState } from './EmptyState';

interface ButtonCount {
  count: number;
  label: string;
}

interface PageStat {
  label: string;
  views: number;
  visitors: number;
}

interface ToolMetrics {
  count: number;
  totalCharCount: number;
  totalProcessingTimeMs: number;
  cachedCount: number;
  freshCount: number;
  errorTypes: Record<string, number>;
  uniqueSessionCount: number;
  hourlyDistribution: Record<string, number>;
}

type Period = 'today' | '7d' | '30d' | 'all';

interface AnalyticsDashboardProps {
  period: Period;
  buttonCounts: Record<string, ButtonCount>;
  pageStats: Record<string, PageStat>;
  totalClicks: number;
  refreshToken: string;
  toolMetrics: Record<string, ToolMetrics>;
  dataTimestamp?: number;
}

const OKR_BUTTONS = ['okr_submit', 'okr_example', 'okr_reset', 'okr_privacy_toggle', 'okr_copy_suggestion', 'okr_read_more'];
const KONSEPTSPEIL_BUTTONS = ['konseptspeil_submit', 'konseptspeil_example', 'konseptspeil_edit', 'konseptspeil_reset', 'konseptspeil_privacy_toggle', 'konseptspeil_share_colleague', 'konseptspeil_copy_analysis'];
const ANTAKELSESKART_BUTTONS = ['antakelseskart_submit', 'antakelseskart_example', 'antakelseskart_reset', 'antakelseskart_copy', 'antakelseskart_privacy_toggle'];
const PREMORTEM_BUTTONS = ['premortem_submit', 'premortem_copy', 'premortem_reset', 'premortem_privacy_toggle'];
const LANDING_BUTTONS = ['hero_cta', 'tools_okr_cta', 'tools_konseptspeilet_cta', 'contact_email', 'contact_linkedin', 'about_linkedin'];

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'today', label: 'I dag' },
  { id: '7d', label: '7 dager' },
  { id: '30d', label: '30 dager' },
  { id: 'all', label: 'Alt' },
];

const PERIOD_BADGES: Record<Period, string> = {
  today: new Date().toLocaleDateString('no-NO'),
  '7d': 'Siste 7 dager',
  '30d': 'Siste 30 dager',
  all: 'All tid',
};

export function AnalyticsDashboard({ period, buttonCounts, pageStats, totalClicks, refreshToken, toolMetrics, dataTimestamp }: AnalyticsDashboardProps) {
  const totalViews = Object.values(pageStats).reduce((sum, p) => sum + p.views, 0);
  const totalVisitors = Object.values(pageStats).reduce((sum, p) => sum + p.visitors, 0);

  // Button data for each tool
  const okrButtonData = OKR_BUTTONS.map(id => ({
    id,
    label: buttonCounts[id]?.label || id,
    count: buttonCounts[id]?.count || 0,
  }));

  const konseptspeilButtonData = KONSEPTSPEIL_BUTTONS.map(id => ({
    id,
    label: buttonCounts[id]?.label || id,
    count: buttonCounts[id]?.count || 0,
  }));

  const antakelseskartButtonData = ANTAKELSESKART_BUTTONS.map(id => ({
    id,
    label: buttonCounts[id]?.label || id,
    count: buttonCounts[id]?.count || 0,
  }));

  const premortemButtonData = PREMORTEM_BUTTONS.map(id => ({
    id,
    label: buttonCounts[id]?.label || id,
    count: buttonCounts[id]?.count || 0,
  }));

  const landingButtonData = LANDING_BUTTONS.map(id => ({
    id,
    label: buttonCounts[id]?.label || id,
    count: buttonCounts[id]?.count || 0,
  }));

  // Funnel data for each tool
  const okrFunnelSteps = [
    { id: 'okr_input_started', label: 'Startet', count: buttonCounts['okr_input_started']?.count || 0 },
    { id: 'okr_submit_attempted', label: 'Sendt inn', count: buttonCounts['okr_submit_attempted']?.count || 0 },
    { id: 'check_success', label: 'Fullf\u00f8rt', count: buttonCounts['check_success']?.count || 0 },
    { id: 'feedback_up', label: 'Positiv feedback', count: buttonCounts['feedback_up']?.count || 0 },
  ];

  const konseptspeilFunnelSteps = [
    { id: 'konseptspeil_input_started', label: 'Startet', count: buttonCounts['konseptspeil_input_started']?.count || 0 },
    { id: 'konseptspeil_submit_attempted', label: 'Sendt inn', count: buttonCounts['konseptspeil_submit_attempted']?.count || 0 },
    { id: 'konseptspeil_success', label: 'Fullf\u00f8rt', count: buttonCounts['konseptspeil_success']?.count || 0 },
    { id: 'konseptspeil_feedback_up', label: 'Positiv feedback', count: buttonCounts['konseptspeil_feedback_up']?.count || 0 },
  ];

  const antakelseskartFunnelSteps = [
    { id: 'antakelseskart_input_started', label: 'Startet', count: buttonCounts['antakelseskart_input_started']?.count || 0 },
    { id: 'antakelseskart_submit_attempted', label: 'Sendt inn', count: buttonCounts['antakelseskart_submit_attempted']?.count || 0 },
    { id: 'antakelseskart_success', label: 'Fullf\u00f8rt', count: buttonCounts['antakelseskart_success']?.count || 0 },
  ];

  const premortemFunnelSteps = [
    { id: 'premortem_input_started', label: 'Startet', count: buttonCounts['premortem_input_started']?.count || 0 },
    { id: 'premortem_submit_attempted', label: 'Sendt inn', count: buttonCounts['premortem_submit_attempted']?.count || 0 },
    { id: 'premortem_success', label: 'Fullf\u00f8rt', count: buttonCounts['premortem_success']?.count || 0 },
  ];

  // Overall conversion
  const totalStarts = (buttonCounts['okr_input_started']?.count || 0) +
    (buttonCounts['konseptspeil_input_started']?.count || 0) +
    (buttonCounts['antakelseskart_input_started']?.count || 0) +
    (buttonCounts['premortem_input_started']?.count || 0);

  const totalSuccesses = (buttonCounts['check_success']?.count || 0) +
    (buttonCounts['konseptspeil_success']?.count || 0) +
    (buttonCounts['antakelseskart_success']?.count || 0) +
    (buttonCounts['premortem_success']?.count || 0);

  const overallConversionRate = totalStarts > 0 ? Math.round((totalSuccesses / totalStarts) * 100) : null;

  // Combined satisfaction
  const totalFeedbackUp = (buttonCounts['feedback_up']?.count || 0) + (buttonCounts['konseptspeil_feedback_up']?.count || 0);
  const totalFeedbackDown = (buttonCounts['feedback_down']?.count || 0) + (buttonCounts['konseptspeil_feedback_down']?.count || 0);
  const totalFeedback = totalFeedbackUp + totalFeedbackDown;
  const satisfactionRate = totalFeedback > 0 ? Math.round((totalFeedbackUp / totalFeedback) * 100) : null;

  // Aggregate hourly distribution from all tools
  const aggregatedHourlyDistribution: Record<string, number> = {};
  Object.values(toolMetrics).forEach(metrics => {
    if (metrics.hourlyDistribution) {
      Object.entries(metrics.hourlyDistribution).forEach(([hour, count]) => {
        aggregatedHourlyDistribution[hour] = (aggregatedHourlyDistribution[hour] || 0) + count;
      });
    }
  });

  // Aggregate metrics for summary
  const aggregatedMetrics: ToolMetrics = {
    count: Object.values(toolMetrics).reduce((sum, m) => sum + m.count, 0),
    totalCharCount: Object.values(toolMetrics).reduce((sum, m) => sum + m.totalCharCount, 0),
    totalProcessingTimeMs: Object.values(toolMetrics).reduce((sum, m) => sum + m.totalProcessingTimeMs, 0),
    cachedCount: Object.values(toolMetrics).reduce((sum, m) => sum + m.cachedCount, 0),
    freshCount: Object.values(toolMetrics).reduce((sum, m) => sum + m.freshCount, 0),
    errorTypes: Object.values(toolMetrics).reduce((acc, m) => {
      Object.entries(m.errorTypes || {}).forEach(([type, count]) => {
        acc[type] = (acc[type] || 0) + count;
      });
      return acc;
    }, {} as Record<string, number>),
    uniqueSessionCount: Object.values(toolMetrics).reduce((sum, m) => sum + m.uniqueSessionCount, 0),
    hourlyDistribution: aggregatedHourlyDistribution,
  };

  const hasActivity = Object.keys(aggregatedHourlyDistribution).length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">FYRK Analytics</h1>
                <p className="text-sm text-slate-500">Klikk og bes&oslash;ksstatistikk</p>
              </div>
            </div>
            <a
              href={`/stats?token=${refreshToken}&period=${period}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Oppdater
            </a>
          </div>

          {/* Period selector */}
          <nav className="mt-4 flex gap-1 bg-slate-100 rounded-lg p-1 w-fit" aria-label="Velg tidsperiode">
            {PERIOD_OPTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`/stats?token=${refreshToken}&period=${id}`}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  period === id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-current={period === id ? 'page' : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Oversikt */}
        <CollapsibleSection id="overview" title="Oversikt" icon={<BarChart3 className="w-5 h-5" />} badge={PERIOD_BADGES[period]}>
          {/* Primary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title={<Tooltip text={METRIC_EXPLANATIONS.uniqueVisitors}>Bes&oslash;kende</Tooltip>}
              value={totalVisitors}
              icon={<Sparkles className="w-5 h-5" />}
              variant="primary"
            />
            <KPICard
              title={<Tooltip text={METRIC_EXPLANATIONS.pageViews}>Sidevisninger</Tooltip>}
              value={totalViews}
              icon={<Eye className="w-5 h-5" />}
            />
            <KPICard
              title="Verkt&oslash;ybruk"
              value={totalSuccesses}
              subtitle={totalStarts > 0 ? `${totalStarts} startet` : undefined}
              icon={<Zap className="w-5 h-5" />}
            />
            {overallConversionRate !== null && (
              <KPICard
                title={<Tooltip text={METRIC_EXPLANATIONS.conversionRate}>Konvertering</Tooltip>}
                value={`${overallConversionRate}%`}
                subtitle={`${totalSuccesses} av ${totalStarts}`}
                icon={<TrendingUp className="w-5 h-5" />}
                variant={overallConversionRate >= 50 ? 'success' : overallConversionRate >= 25 ? 'warning' : 'danger'}
              />
            )}
          </div>

          {/* Secondary KPIs: performance + satisfaction */}
          {(aggregatedMetrics.count > 0 || satisfactionRate !== null) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {aggregatedMetrics.count > 0 && (
                <>
                  <KPICard
                    title={<Tooltip text={METRIC_EXPLANATIONS.responseTime}>Snitt responstid</Tooltip>}
                    value={aggregatedMetrics.totalProcessingTimeMs / aggregatedMetrics.count > 1000
                      ? `${(aggregatedMetrics.totalProcessingTimeMs / aggregatedMetrics.count / 1000).toFixed(1)}s`
                      : `${Math.round(aggregatedMetrics.totalProcessingTimeMs / aggregatedMetrics.count)}ms`}
                    icon={<Zap className="w-5 h-5" />}
                  />
                  <KPICard
                    title={<Tooltip text={METRIC_EXPLANATIONS.cacheHit}>Cache hit</Tooltip>}
                    value={`${((aggregatedMetrics.cachedCount / (aggregatedMetrics.cachedCount + aggregatedMetrics.freshCount)) * 100 || 0).toFixed(0)}%`}
                    icon={<Activity className="w-5 h-5" />}
                  />
                </>
              )}
              {satisfactionRate !== null && (
                <KPICard
                  title={<Tooltip text={METRIC_EXPLANATIONS.satisfaction}>Tilfredshet</Tooltip>}
                  value={`${satisfactionRate}%`}
                  subtitle={`${totalFeedback} svar`}
                  icon={<ThumbsUp className="w-5 h-5" />}
                  variant={satisfactionRate >= 70 ? 'success' : satisfactionRate >= 50 ? 'warning' : 'danger'}
                />
              )}
            </div>
          )}

          {/* Charts (skip for all-time since no hourly data) */}
          {period !== 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hasActivity ? (
                <>
                  <HourlyDistributionChart
                    title={<Tooltip text={METRIC_EXPLANATIONS.hourlyActivity}>Aktivitet per time</Tooltip>}
                    distribution={aggregatedHourlyDistribution}
                  />
                  {aggregatedMetrics.count > 0 && (
                    <MetricsSummary
                      title="Ytelsesmetrikker"
                      metrics={aggregatedMetrics}
                    />
                  )}
                </>
              ) : (
                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl">
                  <EmptyState type="activity" />
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>

        {/* Conversion Funnels */}
        <CollapsibleSection
          id="funnels"
          title={<Tooltip text={METRIC_EXPLANATIONS.funnel}>Konverteringsfunneler</Tooltip>}
          icon={<TrendingUp className="w-5 h-5" />}
          defaultExpanded={totalStarts > 0}
        >
          {totalStarts > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FunnelChart
                title="OKR-sjekken"
                steps={okrFunnelSteps}
                icon={<Zap className="w-5 h-5" />}
              />
              <FunnelChart
                title="Konseptspeilet"
                steps={konseptspeilFunnelSteps}
                icon={<Lightbulb className="w-5 h-5" />}
              />
              <FunnelChart
                title="Antakelseskart"
                steps={antakelseskartFunnelSteps}
                icon={<Map className="w-5 h-5" />}
              />
              <FunnelChart
                title="Pre-Mortem Brief"
                steps={premortemFunnelSteps}
                icon={<FileText className="w-5 h-5" />}
              />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl">
              <EmptyState type="funnel" />
            </div>
          )}
        </CollapsibleSection>

        {/* Traffic Charts */}
        <CollapsibleSection id="traffic" title="Sidetrafikk" icon={<Eye className="w-5 h-5" />}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(pageStats).map(([pageId, stats]) => (
              <TrafficChart key={pageId} pageId={pageId} stats={stats} />
            ))}
          </div>
        </CollapsibleSection>

        {/* Button Click Lists */}
        <CollapsibleSection
          id="buttons"
          title="Knappeklikk per verkt&oslash;y"
          icon={<MousePointer className="w-5 h-5" />}
          defaultExpanded={false}
          collapsedSummary={`5 verkt\u00f8y, ${totalClicks.toLocaleString('no-NO')} klikk totalt`}
        >
          <p className="text-sm text-slate-500 mb-4">
            <span className="inline-flex items-center gap-1 mr-3">
              <span className="w-2 h-2 bg-indigo-400 rounded-full" /> Hovedhandlinger
            </span>
            <span className="inline-flex items-center gap-1 mr-3">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" /> Engasjement
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-slate-300 rounded-full" /> Sekund&aelig;re
            </span>
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <ButtonClickList
              title="OKR-sjekken"
              buttons={okrButtonData}
              icon={<Zap className="w-5 h-5" />}
            />
            <ButtonClickList
              title="Konseptspeilet"
              buttons={konseptspeilButtonData}
              icon={<Lightbulb className="w-5 h-5" />}
            />
            <ButtonClickList
              title="Antakelseskart"
              buttons={antakelseskartButtonData}
              icon={<Map className="w-5 h-5" />}
            />
            <ButtonClickList
              title="Pre-Mortem Brief"
              buttons={premortemButtonData}
              icon={<FileText className="w-5 h-5" />}
            />
            <ButtonClickList
              title="Landingsside"
              buttons={landingButtonData}
              icon={<ExternalLink className="w-5 h-5" />}
            />
          </div>
        </CollapsibleSection>

        {/* Footer */}
        <footer className="text-center text-sm text-slate-400 pt-8 pb-4 space-y-1">
          <p>
            Data hentet: {dataTimestamp
              ? new Date(dataTimestamp).toLocaleString('no-NO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Ukjent'}
          </p>
          <p className="text-xs">
            Side lastet: {new Date().toLocaleString('no-NO', { hour: '2-digit', minute: '2-digit' })}
            {' \u00b7 '}
            <a href={`/stats?token=${refreshToken}&period=${period}`} className="text-indigo-500 hover:text-indigo-600">
              Oppdater data
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
