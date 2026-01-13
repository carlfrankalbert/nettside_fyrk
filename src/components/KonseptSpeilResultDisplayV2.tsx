import { useState, useEffect } from 'react';
import { parseKonseptSpeilResultV2, hasContentV2 } from '../utils/konseptspeil-parser-v2';
import type { DimensionKey, DimensionStatus, DimensionData, ParsedKonseptSpeilResultV2 } from '../types/konseptspeil-v2';
import { DIMENSION_LABELS, STATUS_ICONS, STATUS_LABELS } from '../types/konseptspeil-v2';
import { SpinnerIcon, ChevronRightIcon } from './ui/Icon';
import { cn } from '../utils/classes';
import { trackClick } from '../utils/tracking';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

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
// Constants
// ============================================================================

const LOADER_MESSAGES = [
  'Leser gjennom teksten …',
  'Kartlegger dimensjonene …',
  'Identifiserer antagelser …',
  'Formulerer speilbilde …',
];

const LOADER_INTERVAL_MS = 2000;
const SLOW_THRESHOLD_MS = 8000;

// ============================================================================
// Toast Component
// ============================================================================

function Toast({ message, isVisible }: { message: string; isVisible: boolean }) {
  return (
    <div
      className={cn(
        'fixed z-50 px-4 py-2 bg-neutral-800 text-white text-sm rounded-lg shadow-lg transition-all duration-300',
        'md:top-4 md:right-4 bottom-20 md:bottom-auto left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      )}
      role="status"
      aria-live="assertive"
    >
      {message}
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

function StatusIndicator({ status }: { status: DimensionStatus }) {
  return (
    <span className="text-lg" aria-hidden="true">
      {STATUS_ICONS[status]}
    </span>
  );
}

// ============================================================================
// Dimension Card Component
// ============================================================================

function DimensionCard({
  dimensionKey,
  data,
  onCopy
}: {
  dimensionKey: DimensionKey;
  data: DimensionData;
  onCopy: (text: string) => void;
}) {
  const labels = DIMENSION_LABELS[dimensionKey];

  const copyText = `## ${labels.name}
${STATUS_LABELS[data.status]}

${data.observasjon || labels.question}`;

  return (
    <div className="relative p-4 bg-white border border-neutral-200 rounded-lg group">
      <CopyButton
        onCopy={() => onCopy(copyText)}
        ariaLabel={`Kopier ${labels.name}`}
        className="absolute top-2 right-2 opacity-50 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
      />
      <div className="flex items-start gap-2 mb-2 pr-8">
        <StatusIndicator status={data.status} />
        <h4 className="font-semibold text-neutral-900">{labels.name}</h4>
      </div>
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
// Narrative Loader Component
// ============================================================================

function NarrativeLoader() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADER_MESSAGES.length);
    }, LOADER_INTERVAL_MS);

    const slowTimeout = setTimeout(() => {
      setIsSlow(true);
    }, SLOW_THRESHOLD_MS);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(slowTimeout);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 text-neutral-600 py-4">
      <SpinnerIcon className="animate-spin h-5 w-5 text-brand-cyan-darker" />
      <div>
        <p className="text-sm">{LOADER_MESSAGES[messageIndex]}</p>
        {isSlow && (
          <p className="text-xs text-neutral-500 mt-1">Dette tar litt lenger tid enn vanlig …</p>
        )}
      </div>
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

function generateShareText(antagelser: string[]): string {
  const maxItems = 7;
  const displayItems = antagelser.slice(0, maxItems);
  const remaining = antagelser.length - maxItems;

  let text = `Jeg kjørte dette gjennom Konseptspeilet.\n\nAntagelser i teksten:\n`;

  for (const item of displayItems) {
    text += `– ${item}\n`;
  }

  if (remaining > 0) {
    text += `(+${remaining} flere)\n`;
  }

  text += `\nfyrk.no/konseptspeilet`;

  return text;
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
  const [isAntagelserOpen, setIsAntagelserOpen] = useState(true); // Open by default now
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const parsed = parseKonseptSpeilResultV2(result);
  const { copyToClipboard: copy } = useCopyToClipboard();

  // Wrapper to show toast feedback
  const copyToClipboard = async (text: string, feedbackMessage = 'Kopiert!') => {
    const success = await copy(text);
    setToastMessage(success ? feedbackMessage : 'Kunne ikke kopiere');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // During streaming, show narrative loader if we don't have enough content yet
  if (isStreaming && !hasContentV2(parsed)) {
    return <NarrativeLoader />;
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
        <div className="flex items-start gap-3 mb-3">
          <span className="text-xl" aria-hidden="true">🔍</span>
          <p className="text-[15px] text-neutral-800 leading-relaxed">
            {parsed.refleksjonStatus.kommentar || 'Analyserer teksten...'}
          </p>
        </div>

        {parsed.refleksjonStatus.antagelser_funnet > 0 && (
          <p className="text-sm text-neutral-600">
            Se antagelser i teksten nedenfor
          </p>
        )}
      </div>

      {/* Four dimensions with copy buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dimensionKeys.map((key) => (
          <DimensionCard
            key={key}
            dimensionKey={key}
            data={parsed.dimensjoner[key]}
            onCopy={copyToClipboard}
          />
        ))}
      </div>

      {/* Antagelser section - always visible, styled prominently */}
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
              <ul className="space-y-2.5">
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

              {/* Share with colleague button */}
              <button
                type="button"
                onClick={() => {
                  trackClick('konseptspeil_share_colleague');
                  copyToClipboard(generateShareText(parsed.antagelserListe), 'Kopiert til utklippstavle!');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Del funn med kollega
              </button>
            </div>
          )}
        </section>
      )}

      {/* Copy full analysis button */}
      {!isStreaming && parsed.isComplete && (
        <button
          type="button"
          onClick={() => {
            trackClick('konseptspeil_copy_analysis');
            copyToClipboard(generateFullAnalysisMarkdown(parsed), 'Hele analysen kopiert!');
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-neutral-600 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Kopier hele analysen
        </button>
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
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-navy hover:bg-brand-navy/90 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
            >
              Juster tekst
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
            >
              Nullstill
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
