import { useState } from 'react';
import { parseKonseptSpeilResultV2, hasContentV2 } from '../utils/konseptspeil-parser-v2';
import type { Dimension, DimensionStatus, ExplorationLevel } from '../types/konseptspeil-v2';
import { DIMENSION_LABELS, STATUS_ICONS } from '../types/konseptspeil-v2';
import { SpinnerIcon, ChevronRightIcon } from './ui/Icon';
import { cn } from '../utils/classes';

interface KonseptSpeilResultDisplayV2Props {
  result: string;
  isStreaming: boolean;
  onRetry?: () => void;
  onReset?: () => void;
}

/**
 * Exploration level dots visualization
 */
function ExplorationDots({ level }: { level: ExplorationLevel }) {
  return (
    <div className="flex gap-1" aria-label={`Utforskningsnivå ${level} av 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            i <= level ? 'bg-brand-navy' : 'bg-neutral-200'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Status indicator with color
 */
function StatusIndicator({ status }: { status: DimensionStatus }) {
  return (
    <span className="text-lg" aria-hidden="true">
      {STATUS_ICONS[status]}
    </span>
  );
}

/**
 * Single dimension card
 */
function DimensionCard({ dimension }: { dimension: Dimension }) {
  const labels = DIMENSION_LABELS[dimension.type];

  return (
    <div className="p-4 bg-white border border-neutral-200 rounded-lg">
      <div className="flex items-start gap-2 mb-2">
        <StatusIndicator status={dimension.status} />
        <h4 className="font-semibold text-neutral-900">{labels.name}</h4>
      </div>
      <p className="text-sm text-neutral-600 leading-relaxed">
        {dimension.description || labels.question}
      </p>
    </div>
  );
}

/**
 * v2 result display with summary, dimensions, and expandable details
 */
export default function KonseptSpeilResultDisplayV2({
  result,
  isStreaming,
  onRetry,
  onReset,
}: KonseptSpeilResultDisplayV2Props) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const parsed = parseKonseptSpeilResultV2(result);

  // During streaming, show loading state if we don't have enough content yet
  if (isStreaming && !hasContentV2(parsed)) {
    return (
      <div className="flex items-center gap-3 text-neutral-500 py-4">
        <SpinnerIcon className="animate-spin h-5 w-5" />
        <span>Analyserer konseptet ditt...</span>
      </div>
    );
  }

  // Show parse error if any
  if (parsed.parseError && !isStreaming) {
    return (
      <div className="p-4 bg-feedback-error/10 border border-feedback-error/20 rounded-lg">
        <p className="text-feedback-error text-sm">{parsed.parseError}</p>
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

  // Show warning if response is incomplete and not streaming
  if (!isStreaming && !hasContentV2(parsed)) {
    return (
      <div className="p-4 bg-feedback-warning/10 border border-feedback-warning/20 rounded-lg">
        <p className="text-feedback-warning text-sm font-medium mb-2">
          Responsen ser ut til å være ufullstendig
        </p>
        <p className="text-neutral-600 text-sm mb-3">
          AI-en returnerte ikke det forventede formatet. Dette kan skyldes et midlertidig problem.
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

  return (
    <div className="space-y-6">
      {/* Clarifying text - prominent reminder */}
      <p className="text-xs text-neutral-500 italic text-center px-2">
        Dette speiler antagelser og hull i beskrivelsen – ikke kvaliteten på ideen.
      </p>

      {/* Start here synthesis - the single most important thing */}
      {parsed.priorityExploration && (
        <div className="p-4 bg-brand-cyan-lightest/40 border border-brand-cyan/30 rounded-xl">
          <p className="text-xs font-medium text-brand-navy mb-1.5 uppercase tracking-wide">
            Hvis du bare utforsker én ting først
          </p>
          <p className="text-[15px] text-neutral-800 leading-relaxed">
            {parsed.priorityExploration}
          </p>
        </div>
      )}

      {/* Summary box - reframed */}
      <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-xl" aria-hidden="true">🔍</span>
          <p className="text-[15px] text-neutral-800 leading-relaxed">
            <span className="font-semibold">{parsed.summary.assumptionCount} antagelser</span> fanget
            {parsed.summary.unclearCount > 0 && (
              <>, <span className="font-semibold">{parsed.summary.unclearCount} uklarheter</span> identifisert</>
            )}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-600">Eksplisitthet:</span>
            <ExplorationDots level={parsed.summary.explorationLevel} />
            <span className="text-sm font-medium text-neutral-700">
              {parsed.summary.explorationLabel}
            </span>
          </div>

          <p className="text-xs text-neutral-500 italic">
            Hvor mye som er gjort eksplisitt, ikke hvor god ideen er.
          </p>

          {parsed.summary.conditionalStep && (
            <p className="text-sm text-neutral-600 pt-2 border-t border-neutral-200">
              <span className="text-neutral-500">Mulig neste steg:</span>{' '}
              <span className="text-neutral-700">{parsed.summary.conditionalStep}</span>
            </p>
          )}
        </div>
      </div>

      {/* Four dimensions */}
      {parsed.dimensions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {parsed.dimensions.map((dimension) => (
            <DimensionCard key={dimension.type} dimension={dimension} />
          ))}
        </div>
      )}

      {/* Expandable details button */}
      {(parsed.antagelser.length > 0 || parsed.sporsmal.length > 0) && (
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          aria-expanded={isDetailsOpen}
          aria-controls="details-content"
          className="w-full flex items-center justify-between py-3 px-4 text-left bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
        >
          <span className="text-sm font-medium text-neutral-700">
            {isDetailsOpen ? 'Skjul detaljer' : 'Vis antagelser og spørsmål'}
          </span>
          <ChevronRightIcon
            className={cn(
              'w-4 h-4 text-neutral-400 transition-transform',
              isDetailsOpen && 'rotate-90'
            )}
          />
        </button>
      )}

      {/* Expandable details content */}
      {isDetailsOpen && (
        <div id="details-content" className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Assumptions */}
          {parsed.antagelser.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-3">
                Antagelser du gjør
              </h3>
              <ul className="space-y-2.5">
                {parsed.antagelser.map((antagelse, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-neutral-700 leading-relaxed"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-brand-cyan-darker shrink-0 mt-2"
                      aria-hidden="true"
                    />
                    <span>{antagelse}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Questions */}
          {parsed.sporsmal.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-3">
                Spørsmål å utforske
              </h3>
              <ul className="space-y-2.5">
                {parsed.sporsmal.map((sporsmal, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-neutral-700 leading-relaxed"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0 mt-2"
                      aria-hidden="true"
                    />
                    <span>{sporsmal}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* Closing reflection - calm, non-prescriptive */}
      {!isStreaming && parsed.isComplete && (
        <div className="pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-500 italic text-center leading-relaxed">
            Ta deg tid til å sitte med dette. Det er ingen hastverk.
          </p>
        </div>
      )}

      {/* Action buttons */}
      {!isStreaming && (
        <div className="flex flex-wrap gap-3 pt-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
            >
              Start på nytt
            </button>
          )}
        </div>
      )}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2 text-neutral-500 text-sm">
          <SpinnerIcon className="animate-spin h-4 w-4" />
          <span>Analyserer...</span>
        </div>
      )}
    </div>
  );
}
