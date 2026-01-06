import {
  parseKonseptSpeilResult,
  type Observasjon,
  FASE_LABELS,
  MODENHET_LABELS,
  OBSERVASJON_LABELS,
  countObservasjoner,
} from '../utils/konseptspeil-parser';
import { SpinnerIcon } from './ui/Icon';

interface KonseptSpeilResultDisplayProps {
  result: string;
  isStreaming: boolean;
  onRetry?: () => void;
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

  return (
    <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/50">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-neutral-700">{label}</h4>
        {observasjon.modenhet !== 'antakelse' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan-darker">
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
 * Check if the parsed result has meaningful content
 */
function hasMinimalContent(parsed: ReturnType<typeof parseKonseptSpeilResult>): boolean {
  return Boolean(
    parsed.kort_vurdering ||
    parsed.fase.begrunnelse ||
    parsed.kjerneantagelse ||
    countObservasjoner(parsed.observasjoner) > 0
  );
}

/**
 * Main result display component - simplified for MVP
 */
export default function KonseptSpeilResultDisplay({
  result,
  isStreaming,
  onRetry,
}: KonseptSpeilResultDisplayProps) {
  const parsed = parseKonseptSpeilResult(result);

  // During streaming, show loading state if we don't have enough content yet
  if (isStreaming && !parsed.isComplete && !parsed.kort_vurdering) {
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

  // Show warning if response is incomplete
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
      </div>
    );
  }

  const obsCount = countObservasjoner(parsed.observasjoner);

  return (
    <div className="space-y-6">
      {/* Kort vurdering - the most important section, always at top */}
      {parsed.kort_vurdering && (
        <section className="p-5 rounded-lg bg-brand-cyan-lightest/30 border border-brand-cyan/20">
          <h3 className="text-sm font-semibold text-brand-navy mb-2 uppercase tracking-wide">
            Kort vurdering
          </h3>
          <p className="text-neutral-800 leading-relaxed">{parsed.kort_vurdering}</p>
          {isStreaming && <SpinnerIcon className="animate-spin h-4 w-4 text-neutral-400 mt-2" />}
        </section>
      )}

      {/* Fase badge - subtle context */}
      {parsed.fase.begrunnelse && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-neutral-100 text-neutral-600">
            {FASE_LABELS[parsed.fase.status]}
          </span>
          <span className="text-sm text-neutral-500">{parsed.fase.begrunnelse}</span>
        </div>
      )}

      {/* Kjerneantagelse - explicit assumption */}
      {parsed.kjerneantagelse && (
        <section className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">Kjerneantagelse</h3>
          <p className="text-neutral-800">{parsed.kjerneantagelse}</p>
        </section>
      )}

      {/* Observasjoner - max 3, no section header */}
      {obsCount > 0 && (
        <section>
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
        </section>
      )}

      {/* Neste steg - action-oriented */}
      {parsed.neste_steg && parsed.neste_steg.length > 0 && (
        <section className="p-5 rounded-lg bg-neutral-50/70 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Neste steg</h3>
          <ul className="space-y-2">
            {parsed.neste_steg.map((steg, i) => (
              <li key={i} className="flex items-start gap-3 text-neutral-700">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-cyan/15 text-brand-cyan-darker text-xs font-medium shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{steg}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
