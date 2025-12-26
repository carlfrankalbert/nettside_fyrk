import { cn } from '../utils/classes';
import {
  parseKonseptSpeilResult,
  type Observasjon,
  FASE_LABELS,
  MODENHET_LABELS,
  STYRINGSMØNSTER_LABELS,
  OBSERVASJON_LABELS,
  getModenhetColor,
  getFaseColor,
  countObservasjoner,
} from '../utils/konseptspeil-parser';
import { SpinnerIcon } from './ui/Icon';

interface KonseptSpeilResultDisplayProps {
  result: string;
  isStreaming: boolean;
}

/**
 * Display component for a single observation dimension
 */
function ObservasjonCard({
  label,
  observasjon,
}: {
  label: string;
  observasjon: Observasjon | null;
}) {
  if (!observasjon) return null;

  const colors = getModenhetColor(observasjon.modenhet);

  return (
    <div className={cn('p-4 rounded-lg border', colors.border, colors.bg)}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-neutral-700">{label}</h4>
        {/* Vis kun badge for modenhetsnivåer over "antakelse" - antakelse er default og trenger ikke merkes */}
        {observasjon.modenhet !== 'antakelse' && (
          <span className={cn('text-xs px-2 py-0.5 rounded-full', colors.bg, colors.text)}>
            {MODENHET_LABELS[observasjon.modenhet]}
          </span>
        )}
      </div>
      {observasjon.tilstede && (
        <p className="text-sm text-neutral-700 mb-2">
          <span className="font-medium">Tilstede:</span> {observasjon.tilstede}
        </p>
      )}
      {observasjon.uutforsket && (
        <p className="text-sm text-neutral-500 italic">
          <span className="font-medium not-italic">Uutforsket:</span> {observasjon.uutforsket}
        </p>
      )}
    </div>
  );
}

/**
 * Display component for styringsmønster
 */
function StyringsmønsterCard({
  mønster,
  signal,
}: {
  mønster: string;
  signal: string;
}) {
  const label = STYRINGSMØNSTER_LABELS[mønster as keyof typeof STYRINGSMØNSTER_LABELS] || mønster;

  return (
    <div className="p-3 bg-feedback-warning/5 border border-feedback-warning/20 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-feedback-warning text-lg leading-none">!</span>
        <div>
          <p className="font-medium text-neutral-700 text-sm">{label}</p>
          <p className="text-sm text-neutral-600 mt-1">{signal}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Check if the parsed result has meaningful content
 */
function hasMinimalContent(parsed: ReturnType<typeof parseKonseptSpeilResult>): boolean {
  return Boolean(
    parsed.fase.begrunnelse ||
    parsed.fase.fokusområde ||
    parsed.refleksjon.kjernespørsmål ||
    countObservasjoner(parsed.observasjoner) > 0
  );
}

/**
 * Main result display component
 */
export default function KonseptSpeilResultDisplay({
  result,
  isStreaming,
  onRetry,
}: KonseptSpeilResultDisplayProps & { onRetry?: () => void }) {
  const parsed = parseKonseptSpeilResult(result);

  // During streaming, show loading state if we don't have enough content yet
  if (isStreaming && !parsed.isComplete && !parsed.fase.begrunnelse) {
    return (
      <div className="flex items-center gap-3 text-neutral-500 py-4">
        <SpinnerIcon className="animate-spin h-5 w-5" />
        <span>Speiler konseptet ditt...</span>
      </div>
    );
  }

  // Show parse error if any
  if (parsed.parseError && !isStreaming) {
    return (
      <div className="p-4 bg-feedback-error/10 border border-feedback-error/20 rounded-lg">
        <p className="text-feedback-error text-sm">{parsed.parseError}</p>
        <details className="mt-2">
          <summary className="text-xs text-neutral-500 cursor-pointer">Vis rådata</summary>
          <pre className="mt-2 text-xs text-neutral-600 whitespace-pre-wrap overflow-auto max-h-48">
            {result}
          </pre>
        </details>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-sm text-brand-navy hover:text-brand-cyan-darker underline"
          >
            Prøv igjen
          </button>
        )}
      </div>
    );
  }

  // Show warning if response is incomplete (missing key fields)
  const isIncomplete = !isStreaming && !hasMinimalContent(parsed);
  if (isIncomplete) {
    return (
      <div className="p-4 bg-feedback-warning/10 border border-feedback-warning/20 rounded-lg">
        <p className="text-feedback-warning text-sm font-medium mb-2">
          Responsen ser ut til å være ufullstendig
        </p>
        <p className="text-neutral-600 text-sm mb-3">
          AI-en returnerte ikke alle forventede felter. Dette kan skyldes et midlertidig problem.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm text-brand-navy hover:text-brand-cyan-darker underline"
          >
            Prøv igjen
          </button>
        )}
        <details className="mt-3">
          <summary className="text-xs text-neutral-500 cursor-pointer">Vis rådata</summary>
          <pre className="mt-2 text-xs text-neutral-600 whitespace-pre-wrap overflow-auto max-h-48">
            {result}
          </pre>
        </details>
      </div>
    );
  }

  const faseColors = getFaseColor(parsed.fase.status);
  const obsCount = countObservasjoner(parsed.observasjoner);

  return (
    <div className="space-y-6">
      {/* Fase og fokusområde - hovedrammen for analysen */}
      <div className="p-5 rounded-lg border-2 border-brand-navy/20 bg-brand-navy/8">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
          Slik leser speilet konseptet ditt
        </p>
        <div className="flex items-center gap-3 mb-3">
          <span className={cn('text-sm font-medium px-3 py-1 rounded-full', faseColors.bg, faseColors.text)}>
            {FASE_LABELS[parsed.fase.status]}
          </span>
          {isStreaming && <SpinnerIcon className="animate-spin h-4 w-4 text-neutral-400" />}
        </div>
        {parsed.fase.begrunnelse && (
          <p className="text-neutral-700 mb-3">{parsed.fase.begrunnelse}</p>
        )}
        {parsed.fase.fokusområde && (
          <div className="pt-3 border-t border-brand-navy/10">
            <p className="text-sm font-medium text-neutral-600 mb-1">Fokusområde:</p>
            <p className="text-base text-brand-navy">{parsed.fase.fokusområde}</p>
          </div>
        )}
      </div>

      {/* Observasjoner */}
      {obsCount > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">Observasjoner</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <ObservasjonCard
              label={OBSERVASJON_LABELS.bruker}
              observasjon={parsed.observasjoner.bruker}
            />
            <ObservasjonCard
              label={OBSERVASJON_LABELS.brukbarhet}
              observasjon={parsed.observasjoner.brukbarhet}
            />
            <ObservasjonCard
              label={OBSERVASJON_LABELS.gjennomførbarhet}
              observasjon={parsed.observasjoner.gjennomførbarhet}
            />
            <ObservasjonCard
              label={OBSERVASJON_LABELS.levedyktighet}
              observasjon={parsed.observasjoner.levedyktighet}
            />
          </div>
        </div>
      )}

      {/* Styringsmønstre */}
      {parsed.styringsmønstre && parsed.styringsmønstre.observerte.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">Observerte mønstre</h3>
          <div className="space-y-2">
            {parsed.styringsmønstre.observerte.map((m, i) => (
              <StyringsmønsterCard key={i} mønster={m.mønster} signal={m.signal} />
            ))}
          </div>
          {parsed.styringsmønstre.kommentar && (
            <p className="text-sm text-neutral-600 mt-3 italic">
              {parsed.styringsmønstre.kommentar}
            </p>
          )}
        </div>
      )}

      {/* Refleksjon */}
      {parsed.refleksjon.kjernespørsmål && (
        <div className="p-5 bg-brand-navy/5 border border-brand-navy/10 rounded-lg">
          <h3 className="text-lg font-semibold text-brand-navy mb-3">Refleksjon</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-1">Kjernespørsmål:</p>
              <p className="text-brand-navy text-lg">{parsed.refleksjon.kjernespørsmål}</p>
            </div>

            {parsed.refleksjon.hypoteser_å_teste && parsed.refleksjon.hypoteser_å_teste.length > 0 && (
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">Hypoteser å teste:</p>
                <ul className="space-y-1">
                  {parsed.refleksjon.hypoteser_å_teste.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-neutral-700">
                      <span className="text-brand-cyan mt-0.5">?</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parsed.refleksjon.neste_læring && (
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-1">Neste læring:</p>
                <p className="text-neutral-700">{parsed.refleksjon.neste_læring}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meta-informasjon */}
      <div className="pt-4 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Dekningsgrad-indikator */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-neutral-500 shrink-0">Dekningsgrad:</span>
              <div className="flex items-center gap-2 flex-1 max-w-48">
                <span className="text-xs text-neutral-400">Tynn</span>
                <div className="relative flex-1 h-1 bg-neutral-200 rounded-full">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-brand-navy rounded-full border-2 border-white shadow-sm"
                    style={{
                      left: parsed.meta.dekningsgrad === 'tynn' ? '0%' :
                            parsed.meta.dekningsgrad === 'delvis' ? '50%' : '100%',
                      transform: `translate(-50%, -50%)`,
                    }}
                  />
                </div>
                <span className="text-xs text-neutral-400">Fyldig</span>
              </div>
            </div>
            <p className="text-xs text-neutral-400 italic">
              Hvor mye kontekst konseptet gir speilet å arbeide med.
            </p>
          </div>

          {/* Usikkerheter */}
          {parsed.meta.usikkerheter && parsed.meta.usikkerheter.length > 0 && (
            <details className="text-xs shrink-0">
              <summary className="text-neutral-500 cursor-pointer hover:text-neutral-700">
                {parsed.meta.usikkerheter.length} usikkerhet{parsed.meta.usikkerheter.length > 1 ? 'er' : ''}
              </summary>
              <ul className="mt-2 text-neutral-600 space-y-1">
                {parsed.meta.usikkerheter.map((u, i) => (
                  <li key={i}>- {u}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
