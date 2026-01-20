import { useState } from 'react';
import { parseKonseptSpeilResultV2, hasContentV2 } from '../utils/konseptspeil-parser-v2';
import type { DimensionKey, DimensionStatus, DimensionData, Dimensjoner, ParsedKonseptSpeilResultV2 } from '../types/konseptspeil-v2';
import { DIMENSION_LABELS, STATUS_LABELS } from '../types/konseptspeil-v2';
import { SpinnerIcon, ChevronRightIcon } from './ui/Icon';
import { Toast } from './ui/Toast';
import { NarrativeLoader, KONSEPTSPEIL_LOADER_MESSAGES } from './ui/NarrativeLoader';
import { cn } from '../utils/classes';
import { trackClick } from '../utils/tracking';
import { useCopyWithToast } from '../hooks/useCopyWithToast';

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
// Feedback Buttons Component
// ============================================================================

function FeedbackButtons({ isStreaming }: { isStreaming: boolean }) {
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [qualitativeInput, setQualitativeInput] = useState('');
  const [qualitativeSubmitted, setQualitativeSubmitted] = useState(false);

  if (isStreaming) {
    return null;
  }

  const handleFeedback = (type: 'up' | 'down') => {
    if (feedbackGiven) return;
    setFeedbackGiven(type);
    trackClick(type === 'up' ? 'konseptspeil_feedback_up' : 'konseptspeil_feedback_down');
  };

  const handleQualitativeSubmit = () => {
    if (qualitativeInput.trim()) {
      trackClick('konseptspeil_feedback_qualitative');
      // In a real implementation, this would send the feedback
    }
    setQualitativeSubmitted(true);
  };

  if (feedbackGiven) {
    // Show optional qualitative follow-up for positive feedback
    if (feedbackGiven === 'up' && !qualitativeSubmitted) {
      return (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">
            Takk! Hva var mest nyttig?
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={qualitativeInput}
              onChange={(e) => setQualitativeInput(e.target.value)}
              placeholder="Valgfritt"
              className="flex-1 px-2 py-1.5 text-xs border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker"
            />
            <button
              type="button"
              onClick={handleQualitativeSubmit}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => setQualitativeSubmitted(true)}
              className="px-2 py-1.5 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      );
    }

    return (
      <p className="text-xs text-neutral-500">
        Takk!
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500">Nyttig?</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => handleFeedback('up')}
          className={cn(
            'inline-flex items-center justify-center w-8 h-8',
            'text-neutral-400 hover:text-feedback-success hover:bg-feedback-success/10',
            'rounded transition-colors focus:outline-none',
            'focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-1'
          )}
          aria-label="Ja, dette var nyttig"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleFeedback('down')}
          className={cn(
            'inline-flex items-center justify-center w-8 h-8',
            'text-neutral-400 hover:text-feedback-error hover:bg-feedback-error/10',
            'rounded transition-colors focus:outline-none',
            'focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-1'
          )}
          aria-label="Nei, dette var ikke nyttig"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Copy Button Component
// ============================================================================

function CopyButton({
  onCopy,
  ariaLabel,
  className = ''
}: {
  onCopy: () => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={ariaLabel}
      className={cn(
        'p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-1',
        className
      )}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );
}

// ============================================================================
// Status Indicator Component
// ============================================================================

/**
 * Three-dot progress indicator
 * Shows coverage level in a minimal, intuitive way:
 * - beskrevet: ●●● (3 filled)
 * - antatt: ●●○ (2 filled)
 * - ikke_nevnt: ○○○ (0 filled)
 */
const STATUS_TO_FILLED_DOTS: Record<DimensionStatus, number> = {
  beskrevet: 3,
  antatt: 2,
  ikke_nevnt: 0,
};

function StatusIndicator({ status, size = 'default' }: { status: DimensionStatus; size?: 'small' | 'default' }) {
  const filledCount = STATUS_TO_FILLED_DOTS[status];
  const dotSize = size === 'small' ? 'w-[5px] h-[5px]' : 'w-[6px] h-[6px]';
  const gap = size === 'small' ? 'gap-[2px]' : 'gap-[3px]';

  return (
    <div
      className={cn('flex items-center', gap)}
      role="img"
      aria-label={`${STATUS_LABELS[status]} (${filledCount} av 3)`}
      title={STATUS_LABELS[status]}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            dotSize,
            'rounded-full transition-colors',
            i < filledCount
              ? 'bg-brand-cyan-darker'
              : 'bg-neutral-200'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ============================================================================
// Dimension Summary Component (compact overview)
// ============================================================================

/**
 * Compact horizontal summary showing all 4 dimensions at a glance
 * Displays dimension name + dot indicator in a single scannable row
 */
function DimensionSummary({ dimensjoner }: { dimensjoner: Dimensjoner }) {
  const dimensionKeys: DimensionKey[] = ['verdi', 'brukbarhet', 'gjennomforbarhet', 'levedyktighet'];

  // Short labels for compact display
  const shortLabels: Record<DimensionKey, string> = {
    verdi: 'Verdi',
    brukbarhet: 'Brukbarhet',
    gjennomforbarhet: 'Gj.førb.',
    levedyktighet: 'Levedykt.',
  };

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 p-3 bg-neutral-50 border border-neutral-200 rounded-lg"
      role="list"
      aria-label="Oppsummering av dimensjoner"
    >
      {dimensionKeys.map((key) => (
        <div
          key={key}
          className="flex items-center gap-1.5"
          role="listitem"
        >
          <span className="text-xs font-medium text-neutral-600">{shortLabels[key]}</span>
          <StatusIndicator status={dimensjoner[key].status} size="small" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Dimension Card Component
// ============================================================================

/**
 * Subtle background colors for dimension cards based on coverage
 * Uses very light tints to maintain readability while providing visual differentiation
 */
const CARD_BG_COLORS: Record<DimensionStatus, string> = {
  beskrevet: 'bg-brand-cyan-lightest/30 border-brand-cyan/20',
  antatt: 'bg-white border-neutral-200',
  ikke_nevnt: 'bg-neutral-50 border-neutral-200',
};

/**
 * Suggested next steps based on which dimension is most unclear
 * Formulated as suggestions, not commands
 */
const NEXT_STEP_SUGGESTIONS: Record<DimensionKey, string> = {
  verdi: 'Et mulig neste steg kan være å konkretisere hvem som har problemet og hvordan det påvirker dem i dag.',
  brukbarhet: 'Et mulig neste steg kan være å beskrive en konkret situasjon der noen ville brukt dette.',
  gjennomforbarhet: 'Et mulig neste steg kan være å kartlegge hva som kreves teknisk eller ressursmessig.',
  levedyktighet: 'Et mulig neste steg kan være å vurdere hvordan dette kan bære seg over tid.',
};

/**
 * Identify the 1-2 most unclear dimensions based on status
 * Priority: ikke_nevnt (most unclear) > antatt > beskrevet
 */
function getMostUnclearDimensions(dimensjoner: Dimensjoner): DimensionKey[] {
  const dimensionKeys: DimensionKey[] = ['verdi', 'brukbarhet', 'gjennomforbarhet', 'levedyktighet'];

  // Sort by "unclearness" - ikke_nevnt first, then antatt
  const sorted = dimensionKeys
    .map(key => ({ key, status: dimensjoner[key].status }))
    .sort((a, b) => {
      const priority: Record<DimensionStatus, number> = { ikke_nevnt: 0, antatt: 1, beskrevet: 2 };
      return priority[a.status] - priority[b.status];
    });

  // Return top 1-2 that are actually unclear (not beskrevet)
  const unclear = sorted.filter(d => d.status !== 'beskrevet');

  // If all are beskrevet, return empty
  if (unclear.length === 0) return [];

  // Return max 2, but only if they share the same priority level or are both unclear
  if (unclear.length === 1) return [unclear[0].key];
  if (unclear[0].status === unclear[1].status) {
    return [unclear[0].key, unclear[1].key];
  }
  // If first is ikke_nevnt and second is antatt, only return the ikke_nevnt one
  return [unclear[0].key];
}

function DimensionCard({
  dimensionKey,
  data,
  onCopy,
  isMostUnclear = false
}: {
  dimensionKey: DimensionKey;
  data: DimensionData;
  onCopy: (text: string) => void;
  isMostUnclear?: boolean;
}) {
  const labels = DIMENSION_LABELS[dimensionKey];

  const copyText = `## ${labels.name}
${STATUS_LABELS[data.status]}

${data.observasjon || labels.question}`;

  return (
    <div className={cn('relative p-4 border rounded-lg group', CARD_BG_COLORS[data.status])}>
      {/* "Most unclear" label - subtle, non-judgmental */}
      {isMostUnclear && (
        <span className="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-medium text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-full">
          Mest uavklart
        </span>
      )}
      {/* Header: Status icon + Title left, Copy right */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <StatusIndicator status={data.status} />
          <h4 className="font-semibold text-neutral-900">{labels.name}</h4>
        </div>
        <CopyButton
          onCopy={() => onCopy(copyText)}
          ariaLabel={`Kopier ${labels.name}`}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        />
      </div>
      {/* Micro-explanation - low visual weight */}
      <p className="text-xs text-neutral-400 mb-2 ml-[18px]">
        {labels.subtitle}
      </p>
      <p className="text-sm text-neutral-600 leading-relaxed">
        {data.observasjon || labels.question}
      </p>
    </div>
  );
}

// ============================================================================
// Collapsible Input Review Component
// ============================================================================

function InputReview({ input }: { input: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const truncatedInput = input.length > 120 ? input.substring(0, 120) + '…' : input;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-start justify-between gap-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded-lg"
      >
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Din tekst</span>
          {!isOpen && (
            <p className="text-sm text-neutral-600 truncate mt-1">{truncatedInput}</p>
          )}
        </div>
        <ChevronRightIcon
          className={cn(
            'w-4 h-4 text-neutral-400 transition-transform shrink-0 mt-1',
            isOpen && 'rotate-90'
          )}
        />
      </button>
      {isOpen && (
        <div className="mt-2 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
          {input}
        </div>
      )}
    </div>
  );
}


// ============================================================================
// Copy Helpers
// ============================================================================

function generateFullAnalysisMarkdown(parsed: ParsedKonseptSpeilResultV2): string {
  const dimensionKeys: DimensionKey[] = ['verdi', 'brukbarhet', 'gjennomforbarhet', 'levedyktighet'];

  let markdown = `# Konseptspeil-analyse\n\n`;

  // Summary
  if (parsed.refleksjonStatus.kommentar) {
    markdown += `## Oppsummering\n${parsed.refleksjonStatus.kommentar}\n\n`;
  }

  // Focus question
  if (parsed.fokusSporsmal.sporsmal) {
    markdown += `## ${parsed.fokusSporsmal.overskrift}\n${parsed.fokusSporsmal.sporsmal}\n`;
    if (parsed.fokusSporsmal.hvorfor) {
      markdown += `\n_${parsed.fokusSporsmal.hvorfor}_\n`;
    }
    markdown += '\n';
  }

  // Dimensions
  markdown += `## Dimensjoner\n\n`;
  for (const key of dimensionKeys) {
    const labels = DIMENSION_LABELS[key];
    const data: DimensionData = parsed.dimensjoner[key];
    markdown += `### ${labels.name}\n`;
    markdown += `**Status:** ${STATUS_LABELS[data.status]}\n\n`;
    markdown += `${data.observasjon || labels.question}\n\n`;
  }

  // Assumptions
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
  const [isAntagelserOpen, setIsAntagelserOpen] = useState(false); // Collapsed by default to reduce scroll

  const parsed = parseKonseptSpeilResultV2(result);
  const { toastMessage, showToast, copyWithToast: copyToClipboard } = useCopyWithToast();

  // During streaming, show narrative loader if we don't have enough content yet
  if (isStreaming && !hasContentV2(parsed)) {
    return <NarrativeLoader messages={KONSEPTSPEIL_LOADER_MESSAGES} />;
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
      {/* Toast notification */}
      <Toast message={toastMessage} isVisible={showToast} />

      {/* Collapsible input review */}
      {originalInput && <InputReview input={originalInput} />}

      {/* Clarifying text - prominent reminder */}
      <p className="text-xs text-neutral-500 italic text-center px-2">
        Dette speiler antagelser og hull i beskrivelsen – ikke kvaliteten på ideen.
      </p>

      {/* Dimension summary - compact overview at top for quick scanning */}
      <DimensionSummary dimensjoner={parsed.dimensjoner} />

      {/* Focus question - the single most important thing */}
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

      {/* Antagelser section - primary "aha moment", placed prominently after summary */}
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

      {/* Four dimensions - detailed cards */}
      <div>
        {/* Minimal legend */}
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

      {/* Next step suggestion - based on most unclear dimension */}
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
          {/* Primary actions row */}
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

            {/* Inline feedback - subtle, same row on desktop */}
            {parsed.isComplete && (
              <div className="w-full sm:w-auto sm:ml-auto">
                <FeedbackButtons isStreaming={isStreaming} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Human follow-up CTA - compact */}
      {!isStreaming && parsed.isComplete && (
        <section className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between gap-4">
          <p className="text-sm text-neutral-600">
            Vil du snakke med et menneske? 20 min sparring.
          </p>
          <a
            href="mailto:hei@fyrk.no?subject=Oppfølging fra Konseptspeilet"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-navy hover:text-brand-cyan-darker transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Ta kontakt
          </a>
        </section>
      )}

      {/* Navigation back to FYRK */}
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
