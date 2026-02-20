import { useState } from 'react';
import { parseKonseptSpeilResultV2, hasContentV2 } from '../utils/konseptspeil-parser-v2';
import type { DimensionKey, DimensionStatus, DimensionData, Dimensjoner, ParsedKonseptSpeilResultV2 } from '../types/konseptspeil-v2';
import { DIMENSION_LABELS, STATUS_LABELS } from '../types/konseptspeil-v2';
import { SpinnerIcon, ChevronRightIcon } from './ui/Icon';
import { Toast } from './ui/Toast';
import { NarrativeLoader } from './ui/NarrativeLoader';
import { konseptspeilTool } from '../data/tools';

const { loaderMessages } = konseptspeilTool.ui;
import { cn } from '../utils/classes';
import { trackClick } from '../utils/tracking';
import { useCopyWithToast } from '../hooks/useCopyWithToast';
import { CONTACT_LABEL } from '../utils/links';

import { FeedbackButtons } from './konseptspeil/FeedbackButtons';
import { StatusIndicator } from './konseptspeil/StatusIndicator';
import { DimensionSummary } from './konseptspeil/DimensionSummary';
import { DimensionCard } from './konseptspeil/DimensionCard';
import { InputReview } from './konseptspeil/InputReview';

// ============================================================================
// Types
// ============================================================================

interface KonseptSpeilResultDisplayV2Props {
  result: string;
  isStreaming: boolean;
  originalInput?: string;
  onRetry?: () => void;
  onEdit?: () => void;
  onReset?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Suggested next steps based on which dimension is most unclear
 */
const NEXT_STEP_SUGGESTIONS: Record<DimensionKey, string> = {
  verdi: 'Et mulig neste steg kan være å konkretisere hvem som har problemet og hvordan det påvirker dem i dag.',
  brukbarhet: 'Et mulig neste steg kan være å beskrive en konkret situasjon der noen ville brukt dette.',
  gjennomforbarhet: 'Et mulig neste steg kan være å kartlegge hva som kreves teknisk eller ressursmessig.',
  levedyktighet: 'Et mulig neste steg kan være å vurdere hvordan dette kan bære seg over tid.',
};

/**
 * Identify the 1-2 most unclear dimensions based on status
 */
function getMostUnclearDimensions(dimensjoner: Dimensjoner): DimensionKey[] {
  const dimensionKeys: DimensionKey[] = ['verdi', 'brukbarhet', 'gjennomforbarhet', 'levedyktighet'];

  const sorted = dimensionKeys
    .map(key => ({ key, status: dimensjoner[key].status }))
    .sort((a, b) => {
      const priority: Record<DimensionStatus, number> = { ikke_nevnt: 0, antatt: 1, beskrevet: 2 };
      return priority[a.status] - priority[b.status];
    });

  const unclear = sorted.filter(d => d.status !== 'beskrevet');
  if (unclear.length === 0) return [];
  if (unclear.length === 1) return [unclear[0].key];
  if (unclear[0].status === unclear[1].status) {
    return [unclear[0].key, unclear[1].key];
  }
  return [unclear[0].key];
}

function generateFullAnalysisMarkdown(parsed: ParsedKonseptSpeilResultV2): string {
  const dimensionKeys: DimensionKey[] = ['verdi', 'brukbarhet', 'gjennomforbarhet', 'levedyktighet'];

  let markdown = `# Konseptspeil-analyse\n\n`;

  if (parsed.refleksjonStatus.kommentar) {
    markdown += `## Oppsummering\n${parsed.refleksjonStatus.kommentar}\n\n`;
  }

  if (parsed.fokusSporsmal.sporsmal) {
    markdown += `## ${parsed.fokusSporsmal.overskrift}\n${parsed.fokusSporsmal.sporsmal}\n`;
    if (parsed.fokusSporsmal.hvorfor) {
      markdown += `\n_${parsed.fokusSporsmal.hvorfor}_\n`;
    }
    markdown += '\n';
  }

  markdown += `## Dimensjoner\n\n`;
  for (const key of dimensionKeys) {
    const labels = DIMENSION_LABELS[key];
    const data: DimensionData = parsed.dimensjoner[key];
    markdown += `### ${labels.name}\n`;
    markdown += `**Status:** ${STATUS_LABELS[data.status]}\n\n`;
    markdown += `${data.observasjon || labels.question}\n\n`;
  }

  if (parsed.antagelserListe.length > 0) {
    markdown += `## Antagelser i teksten\n`;
    for (const antagelse of parsed.antagelserListe) {
      markdown += `- ${antagelse}\n`;
    }
    markdown += '\n';
  }

  markdown += `---\n_Generert med Konseptspeilet – FYRK_`;
  return markdown;
}

// ============================================================================
// Main Component
// ============================================================================

export default function KonseptSpeilResultDisplayV2({
  result,
  isStreaming,
  originalInput,
  onRetry,
  onEdit,
  onReset,
}: KonseptSpeilResultDisplayV2Props) {
  const [isAntagelserOpen, setIsAntagelserOpen] = useState(false);

  const parsed = parseKonseptSpeilResultV2(result);
  const { toastMessage, showToast, copyWithToast: copyToClipboard } = useCopyWithToast();

  // During streaming, show narrative loader if we don't have enough content yet
  if (isStreaming && !hasContentV2(parsed)) {
    return <NarrativeLoader messages={loaderMessages} />;
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

  const dimensionKeys: DimensionKey[] = ['verdi', 'brukbarhet', 'gjennomforbarhet', 'levedyktighet'];
  const mostUnclearDimensions = getMostUnclearDimensions(parsed.dimensjoner);

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} isVisible={showToast} />

      {originalInput && <InputReview input={originalInput} />}

      <p className="text-xs text-neutral-500 italic text-center px-2">
        Dette speiler antagelser og hull i beskrivelsen – ikke kvaliteten på ideen.
      </p>

      <DimensionSummary dimensjoner={parsed.dimensjoner} />

      {/* Focus question */}
      {parsed.fokusSporsmal.sporsmal && (
        <div className="p-4 bg-brand-cyan-lightest/40 border border-brand-cyan/30 rounded-xl">
          <p className="text-xs font-medium text-brand-navy mb-1.5 uppercase tracking-wide">
            {parsed.fokusSporsmal.overskrift}
          </p>
          <p className="text-[15px] text-neutral-800 leading-relaxed mb-2">
            {parsed.fokusSporsmal.sporsmal}
          </p>
          {parsed.fokusSporsmal.hvorfor && (
            <p className="text-xs text-neutral-600 italic">
              {parsed.fokusSporsmal.hvorfor}
            </p>
          )}
        </div>
      )}

      {/* Summary box */}
      <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl" aria-hidden="true">🔍</span>
          <p className="text-[15px] text-neutral-800 leading-relaxed">
            {parsed.refleksjonStatus.kommentar || 'Analyserer teksten...'}
          </p>
        </div>
      </div>

      {/* Antagelser section */}
      {parsed.antagelserListe.length > 0 && (
        <section className="p-5 bg-amber-50/50 border border-amber-200/60 rounded-xl">
          <button
            type="button"
            onClick={() => setIsAntagelserOpen(!isAntagelserOpen)}
            aria-expanded={isAntagelserOpen}
            aria-controls="antagelser-content"
            className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded"
          >
            <h3 className="text-base font-semibold text-neutral-900">
              Antagelser i teksten
            </h3>
            <ChevronRightIcon
              className={cn(
                'w-4 h-4 text-neutral-400 transition-transform',
                isAntagelserOpen && 'rotate-90'
              )}
            />
          </button>

          {isAntagelserOpen && (
            <div id="antagelser-content" className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-neutral-600 italic">
                Dette tar teksten din for gitt:
              </p>
              <ul className="space-y-3">
                {parsed.antagelserListe.map((antagelse, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-neutral-700 leading-relaxed"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2"
                      aria-hidden="true"
                    />
                    <span>{antagelse}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Four dimensions */}
      <div>
        <div className="flex items-center justify-center gap-4 mb-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <StatusIndicator status="beskrevet" size="small" />
            <span>Beskrevet</span>
          </span>
          <span className="flex items-center gap-1">
            <StatusIndicator status="antatt" size="small" />
            <span>Antatt</span>
          </span>
          <span className="flex items-center gap-1">
            <StatusIndicator status="ikke_nevnt" size="small" />
            <span>Ikke nevnt</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {dimensionKeys.map((key) => (
            <DimensionCard
              key={key}
              dimensionKey={key}
              data={parsed.dimensjoner[key]}
              onCopy={copyToClipboard}
              isMostUnclear={mostUnclearDimensions.includes(key)}
            />
          ))}
        </div>
      </div>

      {/* Next step suggestion */}
      {!isStreaming && parsed.isComplete && mostUnclearDimensions.length > 0 && (
        <section className="p-4 bg-white border border-neutral-200 rounded-lg">
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">
            Et mulig neste steg
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {NEXT_STEP_SUGGESTIONS[mostUnclearDimensions[0]]}
          </p>
        </section>
      )}

      {/* Action buttons + inline feedback */}
      {!isStreaming && (
        <div className="flex flex-col gap-4 pt-4 border-t border-neutral-200">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Start på nytt
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Rediger
              </button>
            )}
            {parsed.isComplete && (
              <button
                type="button"
                onClick={() => {
                  trackClick('konseptspeil_copy_analysis');
                  copyToClipboard(generateFullAnalysisMarkdown(parsed), 'Kopiert!');
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Kopier
              </button>
            )}

            {parsed.isComplete && (
              <div className="w-full sm:w-auto sm:ml-auto">
                <FeedbackButtons isStreaming={isStreaming} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Human follow-up CTA */}
      {!isStreaming && parsed.isComplete && (
        <section className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between gap-4">
          <p className="text-sm text-neutral-600">
            Vil du snakke med et menneske? 20 min sparring.
          </p>
          <a
            href="mailto:hei@fyrk.no?subject=Oppfølging fra Konseptspeilet"
            className="shrink-0 inline-flex items-center px-4 py-2 text-sm font-medium text-brand-navy hover:text-brand-cyan-darker transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded"
          >
            {CONTACT_LABEL}
          </a>
        </section>
      )}

      {/* Navigation back */}
      {!isStreaming && parsed.isComplete && (
        <div className="text-center pt-2">
          <a
            href="/"
            className="text-sm text-neutral-500 hover:text-brand-navy transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded"
          >
            ← Tilbake til FYRK
          </a>
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
