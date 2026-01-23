import { useState, useEffect } from 'react';
import { MousePointer, Eye, Zap, BarChart3, ExternalLink, Sparkles, ThumbsUp, Activity, Lightbulb, Map, FileText, TrendingUp, Calendar, Clock } from 'lucide-react';
import { KPICard } from './KPICard';
import { TrafficChart } from './TrafficChart';
import { ButtonClickList } from './ButtonClickList';
import { FunnelChart } from './FunnelChart';
import { HourlyDistributionChart } from './HourlyDistributionChart';
import { MetricsSummary } from './MetricsSummary';
import { Tooltip, METRIC_EXPLANATIONS } from './Tooltip';
import { Section } from './Section';
import { EmptyState } from './EmptyState';

interface ButtonCount {
  count: number;
  label: string;
}

interface PageStat {
  label: string;
  totalViews: number;
  totalVisitors: number;
  todayVisitors: number;
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

interface AnalyticsDashboardProps {
  buttonCounts: Record<string, ButtonCount>;
  pageStats: Record<string, PageStat>;
  totalClicks: number;
  refreshToken: string;
  toolMetrics: Record<string, ToolMetrics>;
  /** Timestamp when data was last fetched from KV */
  dataTimestamp?: number;
}

const OKR_BUTTONS = ['okr_submit', 'okr_example', 'okr_reset', 'okr_privacy_toggle', 'okr_copy_suggestion', 'okr_read_more'];
const KONSEPTSPEIL_BUTTONS = ['konseptspeil_submit', 'konseptspeil_example', 'konseptspeil_edit', 'konseptspeil_reset', 'konseptspeil_privacy_toggle', 'konseptspeil_share_colleague', 'konseptspeil_copy_analysis'];
const ANTAKELSESKART_BUTTONS = ['antakelseskart_submit', 'antakelseskart_example', 'antakelseskart_reset', 'antakelseskart_copy', 'antakelseskart_privacy_toggle'];
const PREMORTEM_BUTTONS = ['premortem_submit', 'premortem_copy', 'premortem_reset', 'premortem_privacy_toggle'];
const LANDING_BUTTONS = ['hero_cta', 'tools_okr_cta', 'tools_konseptspeilet_cta', 'contact_email', 'contact_linkedin', 'about_linkedin'];

export function AnalyticsDashboard({ buttonCounts, pageStats, totalClicks, refreshToken, toolMetrics, dataTimestamp }: AnalyticsDashboardProps) {
  const [activeSection, setActiveSection] = useState('today');

  const totalViews = Object.values(pageStats).reduce((sum, p) => sum + p.totalViews, 0);
  const totalVisitors = Object.values(pageStats).reduce((sum, p) => sum + p.totalVisitors, 0);
  const todayVisitors = Object.values(pageStats).reduce((sum, p) => sum + p.todayVisitors, 0);

  // Track active section based on scroll position
  useEffect(() => {
    const sectionIds = ['today', 'alltime', 'funnels', 'traffic', 'buttons'];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // Offset for header

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Funnel data for each tool (input_started → submit_attempted → success)
  const okrFunnelSteps = [
    { id: 'okr_input_started', label: 'Startet', count: buttonCounts['okr_input_started']?.count || 0 },
    { id: 'okr_submit_attempted', label: 'Sendt inn', count: buttonCounts['okr_submit_attempted']?.count || 0 },
    { id: 'check_success', label: 'Fullført', count: buttonCounts['check_success']?.count || 0 },
    { id: 'feedback_up', label: 'Positiv feedback', count: buttonCounts['feedback_up']?.count || 0 },
  ];

  const konseptspeilFunnelSteps = [
    { id: 'konseptspeil_input_started', label: 'Startet', count: buttonCounts['konseptspeil_input_started']?.count || 0 },
    { id: 'konseptspeil_submit_attempted', label: 'Sendt inn', count: buttonCounts['konseptspeil_submit_attempted']?.count || 0 },
    { id: 'konseptspeil_success', label: 'Fullført', count: buttonCounts['konseptspeil_success']?.count || 0 },
    { id: 'konseptspeil_feedback_up', label: 'Positiv feedback', count: buttonCounts['konseptspeil_feedback_up']?.count || 0 },
  ];

  const antakelseskartFunnelSteps = [
    { id: 'antakelseskart_input_started', label: 'Startet', count: buttonCounts['antakelseskart_input_started']?.count || 0 },
    { id: 'antakelseskart_submit_attempted', label: 'Sendt inn', count: buttonCounts['antakelseskart_submit_attempted']?.count || 0 },
    { id: 'antakelseskart_success', label: 'Fullført', count: buttonCounts['antakelseskart_success']?.count || 0 },
  ];

  const premortemFunnelSteps = [
    { id: 'premortem_input_started', label: 'Startet', count: buttonCounts['premortem_input_started']?.count || 0 },
    { id: 'premortem_submit_attempted', label: 'Sendt inn', count: buttonCounts['premortem_submit_attempted']?.count || 0 },
    { id: 'premortem_success', label: 'Fullført', count: buttonCounts['premortem_success']?.count || 0 },
  ];

  // Calculate satisfaction rates
  const okrFeedbackUp = buttonCounts['feedback_up']?.count || 0;
  const okrFeedbackDown = buttonCounts['feedback_down']?.count || 0;
  const okrTotalFeedback = okrFeedbackUp + okrFeedbackDown;
  const okrSatisfactionRate = okrTotalFeedback > 0 ? Math.round((okrFeedbackUp / okrTotalFeedback) * 100) : null;

  const ksFeedbackUp = buttonCounts['konseptspeil_feedback_up']?.count || 0;
  const ksFeedbackDown = buttonCounts['konseptspeil_feedback_down']?.count || 0;
  const ksTotalFeedback = ksFeedbackUp + ksFeedbackDown;
  const ksSatisfactionRate = ksTotalFeedback > 0 ? Math.round((ksFeedbackUp / ksTotalFeedback) * 100) : null;

  // Calculate overall conversion rates
  const totalStarts = (buttonCounts['okr_input_started']?.count || 0) +
    (buttonCounts['konseptspeil_input_started']?.count || 0) +
    (buttonCounts['antakelseskart_input_started']?.count || 0) +
    (buttonCounts['premortem_input_started']?.count || 0);

  const totalSuccesses = (buttonCounts['check_success']?.count || 0) +
    (buttonCounts['konseptspeil_success']?.count || 0) +
    (buttonCounts['antakelseskart_success']?.count || 0) +
    (buttonCounts['premortem_success']?.count || 0);

  const overallConversionRate = totalStarts > 0 ? Math.round((totalSuccesses / totalStarts) * 100) : null;

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

  // Check if we have any data at all
  const hasAnyData = totalClicks > 0 || totalViews > 0;
  const hasTodayActivity = Object.keys(aggregatedHourlyDistribution).length > 0;

  // Navigation sections
  const sections = [
    { id: 'today', label: 'I dag', icon: Clock },
    { id: 'alltime', label: 'Totalt', icon: Calendar },
    { id: 'funnels', label: 'Funneler', icon: TrendingUp },
    { id: 'traffic', label: 'Trafikk', icon: Eye },
    { id: 'buttons', label: 'Knapper', icon: MousePointer },
  ];

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
                <p className="text-sm text-slate-500">Klikk og besøksstatistikk</p>
              </div>
            </div>
            <a
              href={`/stats?token=${refreshToken}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Oppdater
            </a>
          </div>

          {/* Quick navigation */}
          {hasAnyData && (
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Gå til seksjon">
              {sections.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    activeSection === id
                      ? 'text-indigo-700 bg-indigo-100'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                  aria-current={activeSection === id ? 'true' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Today's Metrics */}
        <Section id="today" title="I dag" icon={<Clock className="w-5 h-5" />} badge={new Date().toLocaleDateString('no-NO')}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title={<Tooltip text={METRIC_EXPLANATIONS.todayVisitors}>Besøkende i dag</Tooltip>}
              value={todayVisitors}
              icon={<Sparkles className="w-5 h-5" />}
              variant="primary"
            />
            {hasTodayActivity && aggregatedMetrics.count > 0 && (
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hasTodayActivity ? (
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
        </Section>

        {/* All-time Metrics */}
        <Section id="alltime" title="Totalt" icon={<Calendar className="w-5 h-5" />} badge="All tid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title={<Tooltip text={METRIC_EXPLANATIONS.totalClicks}>Totalt knappeklikk</Tooltip>}
              value={totalClicks}
              icon={<MousePointer className="w-5 h-5" />}
              variant="primary"
            />
            <KPICard
              title={<Tooltip text={METRIC_EXPLANATIONS.pageViews}>Totale sidevisninger</Tooltip>}
              value={totalViews}
              icon={<Eye className="w-5 h-5" />}
            />
            <KPICard
              title={<Tooltip text={METRIC_EXPLANATIONS.uniqueVisitors}>Unike besøkende</Tooltip>}
              value={totalVisitors}
              icon={<Zap className="w-5 h-5" />}
            />
            {overallConversionRate !== null && (
              <KPICard
                title={<Tooltip text={METRIC_EXPLANATIONS.conversionRate}>Total konvertering</Tooltip>}
                value={`${overallConversionRate}%`}
                subtitle={`${totalSuccesses} av ${totalStarts} startet`}
                icon={<TrendingUp className="w-5 h-5" />}
                variant={overallConversionRate >= 50 ? 'success' : overallConversionRate >= 25 ? 'warning' : 'danger'}
              />
            )}
            {okrSatisfactionRate !== null && (
              <KPICard
                title={<Tooltip text={METRIC_EXPLANATIONS.satisfaction}>OKR Tilfredshet</Tooltip>}
                value={`${okrSatisfactionRate}%`}
                subtitle={`${okrTotalFeedback} svar`}
                icon={<ThumbsUp className="w-5 h-5" />}
                variant={okrSatisfactionRate >= 70 ? 'success' : okrSatisfactionRate >= 50 ? 'warning' : 'danger'}
              />
            )}
            {ksSatisfactionRate !== null && (
              <KPICard
                title={<Tooltip text={METRIC_EXPLANATIONS.satisfaction}>Konseptspeil Tilfredshet</Tooltip>}
                value={`${ksSatisfactionRate}%`}
                subtitle={`${ksTotalFeedback} svar`}
                icon={<Lightbulb className="w-5 h-5" />}
                variant={ksSatisfactionRate >= 70 ? 'success' : ksSatisfactionRate >= 50 ? 'warning' : 'danger'}
              />
            )}
          </div>
        </Section>

        {/* Conversion Funnels */}
        <Section
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
        </Section>

        {/* Traffic Charts */}
        <Section id="traffic" title="Sidetrafikk" icon={<Eye className="w-5 h-5" />}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(pageStats).map(([pageId, stats]) => (
              <TrafficChart key={pageId} pageId={pageId} stats={stats} />
            ))}
          </div>
        </Section>

        {/* Button Click Lists */}
        <Section
          id="buttons"
          title="Knappeklikk per verktøy"
          icon={<MousePointer className="w-5 h-5" />}
          defaultExpanded={false}
          collapsedSummary={`5 verktøy, ${totalClicks.toLocaleString('no-NO')} klikk totalt`}
        >
          <p className="text-sm text-slate-500 mb-4">
            <span className="inline-flex items-center gap-1 mr-3">
              <span className="w-2 h-2 bg-indigo-400 rounded-full" /> Hovedhandlinger
            </span>
            <span className="inline-flex items-center gap-1 mr-3">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" /> Engasjement
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-slate-300 rounded-full" /> Sekundære
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
        </Section>

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
            {' · '}
            <a href={`/stats?token=${refreshToken}`} className="text-indigo-500 hover:text-indigo-600">
              Oppdater data
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
