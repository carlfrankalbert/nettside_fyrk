import { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center group">
      {children}
      <span
        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-medium cursor-help transition-colors group-hover:bg-slate-300"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        aria-label="Hover for mer informasjon"
      >
        <Info className="w-2.5 h-2.5" />
      </span>
      {isVisible && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-slate-800 rounded-lg shadow-lg max-w-xs whitespace-normal text-center pointer-events-none"
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  );
}

/** Metric explanations for non-technical users */
export const METRIC_EXPLANATIONS = {
  totalClicks: 'Totalt antall ganger brukere har klikket på knapper på siden.',
  pageViews: 'Antall ganger sider har blitt lastet.',
  uniqueVisitors: 'Antall forskjellige personer som har besøkt siden (basert på nettleser-ID).',
  todayVisitors: 'Unike besøkende som har vært innom i dag.',
  conversionRate: 'Hvor mange som fullfører verktøyet av de som starter. Grønn = over 50% (bra), gul = 25-50% (ok), rød = under 25% (bør undersøkes).',
  satisfaction: 'Andel positive tilbakemeldinger. Grønn = over 70% (bra), gul = 50-70% (ok), rød = under 50% (bør forbedres).',
  cacheHit: 'Hvor ofte vi gjenbruker tidligere svar. Høyere = raskere og billigere. Over 20% er bra.',
  responseTime: 'Gjennomsnittlig ventetid. Under 3 sekunder er bra, over 10 sekunder er tregt.',
  errorRate: 'Hvor ofte noe går galt. Grønn = under 1% (bra), gul = 1-5% (ok), rød = over 5% (problem).',
  uniqueSessions: 'Antall separate brukerøkter (en økt varer til 30 min inaktivitet).',
  hourlyActivity: 'Når på døgnet brukerne er mest aktive. Tidene er i UTC (+1 time for norsk vintertid, +2 for sommertid).',
  funnel: 'Viser brukerreisen steg for steg. Grønn = over 70% går videre (bra), gul = 40-70% (ok), rød = under 40% (flaskehals).',
  acquisition: 'Hvor besøkende kommer fra. Viser eksterne henvisere og UTM-parametere fra kampanjelenker (utm_source, utm_medium, utm_campaign).',
} as const;

/** Threshold definitions for KPI cards */
export const THRESHOLDS = {
  conversionRate: { good: 50, warning: 25 },
  satisfaction: { good: 70, warning: 50 },
  errorRate: { good: 1, warning: 5 },
  funnelStep: { good: 70, warning: 40 },
} as const;
