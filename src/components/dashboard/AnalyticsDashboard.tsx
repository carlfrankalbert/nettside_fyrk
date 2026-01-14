import { MousePointer, Eye, Zap, BarChart3, ExternalLink, Sparkles, ThumbsUp, Activity, Lightbulb } from 'lucide-react';
import { KPICard } from './KPICard';
import { TrafficChart } from './TrafficChart';
import { ButtonClickList } from './ButtonClickList';

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

interface AnalyticsDashboardProps {
  buttonCounts: Record<string, ButtonCount>;
  pageStats: Record<string, PageStat>;
  totalClicks: number;
  refreshToken: string;
}

const OKR_BUTTONS = ['okr_submit', 'okr_example', 'okr_reset', 'okr_privacy_toggle', 'okr_copy_suggestion', 'okr_read_more'];
const KONSEPTSPEIL_BUTTONS = ['konseptspeil_submit', 'konseptspeil_example', 'konseptspeil_edit', 'konseptspeil_reset', 'konseptspeil_privacy_toggle', 'konseptspeil_share_colleague', 'konseptspeil_copy_analysis'];
const LANDING_BUTTONS = ['hero_cta', 'tools_okr_cta', 'tools_konseptspeilet_cta', 'contact_email', 'contact_linkedin', 'about_linkedin'];
const OKR_FUNNEL_EVENTS = ['check_success', 'feedback_up', 'feedback_down'];
const KONSEPTSPEIL_FUNNEL_EVENTS = ['konseptspeil_success', 'konseptspeil_error', 'konseptspeil_feedback_up', 'konseptspeil_feedback_down'];

export function AnalyticsDashboard({ buttonCounts, pageStats, totalClicks, refreshToken }: AnalyticsDashboardProps) {
  const totalViews = Object.values(pageStats).reduce((sum, p) => sum + p.totalViews, 0);
  const totalVisitors = Object.values(pageStats).reduce((sum, p) => sum + p.totalVisitors, 0);
  const todayVisitors = Object.values(pageStats).reduce((sum, p) => sum + p.todayVisitors, 0);

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

  const landingButtonData = LANDING_BUTTONS.map(id => ({
    id,
    label: buttonCounts[id]?.label || id,
    count: buttonCounts[id]?.count || 0,
  }));

  const okrFunnelData = OKR_FUNNEL_EVENTS.map(id => ({
    id,
    label: buttonCounts[id]?.label || id,
    count: buttonCounts[id]?.count || 0,
  }));

  const konseptspeilFunnelData = KONSEPTSPEIL_FUNNEL_EVENTS.map(id => ({
    id,
    label: buttonCounts[id]?.label || id,
    count: buttonCounts[id]?.count || 0,
  }));

  // Calculate OKR satisfaction rate
  const okrFeedbackUp = buttonCounts['feedback_up']?.count || 0;
  const okrFeedbackDown = buttonCounts['feedback_down']?.count || 0;
  const okrTotalFeedback = okrFeedbackUp + okrFeedbackDown;
  const okrSatisfactionRate = okrTotalFeedback > 0 ? Math.round((okrFeedbackUp / okrTotalFeedback) * 100) : null;

  // Calculate Konseptspeilet satisfaction rate
  const ksFeedbackUp = buttonCounts['konseptspeil_feedback_up']?.count || 0;
  const ksFeedbackDown = buttonCounts['konseptspeil_feedback_down']?.count || 0;
  const ksTotalFeedback = ksFeedbackUp + ksFeedbackDown;
  const ksSatisfactionRate = ksTotalFeedback > 0 ? Math.round((ksFeedbackUp / ksTotalFeedback) * 100) : null;

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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Totalt knappeklikk"
              value={totalClicks}
              icon={<MousePointer className="w-5 h-5" />}
              variant="primary"
            />
            <KPICard
              title="Totale sidevisninger"
              value={totalViews}
              icon={<Eye className="w-5 h-5" />}
            />
            <KPICard
              title="Unike besøkende"
              value={totalVisitors}
              icon={<Zap className="w-5 h-5" />}
            />
            <KPICard
              title="Besøkende i dag"
              value={todayVisitors}
              icon={<Sparkles className="w-5 h-5" />}
            />
            {okrSatisfactionRate !== null && (
              <KPICard
                title="OKR Tilfredshet"
                value={`${okrSatisfactionRate}%`}
                subtitle={`${okrTotalFeedback} svar`}
                icon={<ThumbsUp className="w-5 h-5" />}
                variant={okrSatisfactionRate >= 70 ? 'success' : okrSatisfactionRate >= 50 ? 'warning' : 'danger'}
              />
            )}
            {ksSatisfactionRate !== null && (
              <KPICard
                title="Konseptspeil Tilfredshet"
                value={`${ksSatisfactionRate}%`}
                subtitle={`${ksTotalFeedback} svar`}
                icon={<Lightbulb className="w-5 h-5" />}
                variant={ksSatisfactionRate >= 70 ? 'success' : ksSatisfactionRate >= 50 ? 'warning' : 'danger'}
              />
            )}
          </div>
        </section>

        {/* Traffic Charts */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-slate-400" />
            Sidetrafikk
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(pageStats).map(([pageId, stats]) => (
              <TrafficChart key={pageId} pageId={pageId} stats={stats} />
            ))}
          </div>
        </section>

        {/* Button Click Lists */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-slate-400" />
            Knappeklikk
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              title="Landingsside"
              buttons={landingButtonData}
              icon={<ExternalLink className="w-5 h-5" />}
            />
          </div>
        </section>

        {/* Funnel & Feedback */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            Funnel & Tilbakemeldinger
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ButtonClickList
              title="OKR-sjekk funnel"
              buttons={okrFunnelData}
              icon={<ThumbsUp className="w-5 h-5" />}
            />
            <ButtonClickList
              title="Konseptspeilet funnel"
              buttons={konseptspeilFunnelData}
              icon={<Lightbulb className="w-5 h-5" />}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-slate-400 pt-8 pb-4">
          Sist oppdatert: {new Date().toLocaleString('no-NO')}
        </footer>
      </main>
    </div>
  );
}
