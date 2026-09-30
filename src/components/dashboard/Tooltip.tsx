import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

/**
 * An ⓘ that explains a metric. Opens on hover (mouse), tap (touch) or keyboard
 * focus; closes when the pointer leaves, on a tap elsewhere, or on Escape.
 */
export function Tooltip({ text, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  // Keep the bubble on screen: centred over the ⓘ, nudged in from the viewport edges
  useLayoutEffect(() => {
    if (!isVisible || !tipRef.current) return;
    const margin = 8;
    const { left, right } = tipRef.current.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    setShift((current) => {
      const centredLeft = left - current;
      const centredRight = right - current;
      if (centredLeft < margin) return margin - centredLeft;
      if (centredRight > width - margin) return width - margin - centredRight;
      return 0;
    });
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsVisible(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsVisible(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isVisible]);

  return (
    <span ref={rootRef} className="relative inline-flex items-center group">
      {children}
      <button
        type="button"
        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-medium cursor-help transition-colors group-hover:bg-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        // Hover only for a mouse: on touch, mouse emulation would open and close it around the tap
        onPointerEnter={(event) => event.pointerType === 'mouse' && setIsVisible(true)}
        onPointerLeave={(event) => event.pointerType === 'mouse' && setIsVisible(false)}
        onClick={() => setIsVisible(true)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="Mer informasjon"
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        <Info className="w-2.5 h-2.5" aria-hidden="true" />
      </button>
      {isVisible && (
        <span
          ref={tipRef}
          id={tooltipId}
          role="tooltip"
          // transform, not translate: Tailwind's -translate-x-1/2 centring uses the translate property
          style={{ transform: `translateX(${shift}px)` }}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 w-64 max-w-[calc(100vw-2rem)] text-xs font-normal text-white bg-slate-800 rounded-lg shadow-lg whitespace-normal text-center pointer-events-none"
        >
          {text}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"
            style={{ transform: `translateX(${-shift}px)` }}
          />
        </span>
      )}
    </span>
  );
}

/** Metric explanations for non-technical users */
export const METRIC_EXPLANATIONS = {
  totalClicks: 'Totalt antall ganger brukere har klikket på knapper på siden.',
  pageViews: 'Antall ganger sider har blitt lastet.',
  uniqueVisitors: 'Antall forskjellige besøkende per dag (anonym daglig kode av IP og nettleser, uten cookies). Samme person på to dager teller to ganger.',
  todayVisitors: 'Unike besøkende som har vært innom i dag.',
  conversionRate: 'Hvor mange som fullfører verktøyet av de som starter. Grønn = over 50% (bra), gul = 25-50% (ok), rød = under 25% (bør undersøkes).',
  satisfaction: 'Andel positive tilbakemeldinger. Grønn = over 70% (bra), gul = 50-70% (ok), rød = under 50% (bør forbedres).',
  cacheHit: 'Hvor ofte vi gjenbruker tidligere svar. Høyere = raskere og billigere. Over 20% er bra.',
  responseTime: 'Gjennomsnittlig ventetid. Under 3 sekunder er bra, over 10 sekunder er tregt.',
  errorRate: 'Hvor ofte noe går galt. Grønn = under 1% (bra), gul = 1-5% (ok), rød = over 5% (problem).',
  uniqueSessions: 'Unike brukere per dag, summert over perioden. Telles uten cookies, så samme person på to dager teller to ganger.',
  hourlyActivity: 'Når på døgnet brukerne er mest aktive. Tidene er i UTC (+1 time for norsk vintertid, +2 for sommertid).',
  funnel: 'Viser brukerreisen steg for steg. Grønn = over 70% går videre (bra), gul = 40-70% (ok), rød = under 40% (flaskehals).',
  audience: 'Hvem som besøker, telt én gang per unike besøkende per dag. Nettverk er eieren av IP-adressen: oftest en internettleverandør, men store virksomheter og offentlige etater har ofte egne nett. AS-nummeret lenker til en oppslagstjeneste om nettverket; «datasenter» betyr nesten alltid roboter. 404 viser adresser folk prøvde å åpne som ikke finnes.',
  acquisition: 'Hvor besøkende kommer fra. Viser eksterne henvisere og UTM-parametere fra kampanjelenker (utm_source, utm_medium, utm_campaign).',
} as const;

/** Threshold definitions for KPI cards */
export const THRESHOLDS = {
  conversionRate: { good: 50, warning: 25 },
  satisfaction: { good: 70, warning: 50 },
  errorRate: { good: 1, warning: 5 },
  funnelStep: { good: 70, warning: 40 },
} as const;
