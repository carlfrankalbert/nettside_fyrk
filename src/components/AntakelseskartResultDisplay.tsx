import { useState, useEffect } from 'react';
import { parseAntakelseskartResult, hasContent, getAllAssumptions } from '../utils/antakelseskart-parser';
import type {
  AssumptionCategory,
  Assumption,
  CertaintyLevel,
  ConsequenceLevel,
  AssumptionStatus,
  GroupedAssumptions,
} from '../types/antakelseskart';
import {
  CATEGORY_LABELS,
  CERTAINTY_LABELS,
  CONSEQUENCE_LABELS,
  ASSUMPTION_STATUS_LABELS,
} from '../types/antakelseskart';
import { SpinnerIcon, ChevronRightIcon } from './ui/Icon';
import { cn } from '../utils/classes';
import { trackClick } from '../utils/tracking';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

// ============================================================================
// Types
// ============================================================================

interface AntakelseskartResultDisplayProps {
  result: string;
  isStreaming: boolean;
  originalInput?: string;
  onRetry?: () => void;
  onEdit?: () => void;
  onReset?: () => void;
}

// User assignments stored per assumption ID
interface AssumptionAssignments {
  [assumptionId: string]: {
    certainty?: CertaintyLevel;
    consequence?: ConsequenceLevel;
    status?: AssumptionStatus;
  };
}

// ============================================================================
// Constants
// ============================================================================

const LOADER_MESSAGES = [
  'Leser gjennom beskrivelsen ...',
  'Identifiserer implisitte antakelser ...',
  'Grupperer etter kategori ...',
  'Ferdigstiller ...',
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
          <p className="text-xs text-neutral-500 mt-1">Dette tar litt lenger tid enn vanlig ...</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Assumption Card Component
// ============================================================================

interface AssumptionCardProps {
  assumption: Assumption;
  assignments: AssumptionAssignments;
  onAssign: (id: string, field: 'certainty' | 'consequence' | 'status', value: string) => void;
  showAssignments: boolean;
}

function AssumptionCard({ assumption, assignments, onAssign, showAssignments }: AssumptionCardProps) {
  const assignment = assignments[assumption.id] || {};
  const isCritical = assignment.certainty === 'lav' && assignment.consequence === 'høy';

  return (
    <div
      className={cn(
        'p-4 border rounded-lg transition-all',
        isCritical
          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
          : 'bg-white border-neutral-200'
      )}
    >
      <p className="text-sm text-neutral-700 leading-relaxed mb-3">{assumption.text}</p>

      {showAssignments && (
        <div className="flex flex-wrap gap-2">
          {/* Certainty selector */}
          <select
            value={assignment.certainty || ''}
            onChange={(e) => onAssign(assumption.id, 'certainty', e.target.value)}
            className="text-xs px-2 py-1.5 border border-neutral-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker"
            aria-label="Hvor sikker er du?"
          >
            <option value="">Sikkerhet?</option>
            <option value="lav">Lav sikkerhet</option>
            <option value="middels">Middels sikkerhet</option>
            <option value="høy">Høy sikkerhet</option>
          </select>

          {/* Consequence selector */}
          <select
            value={assignment.consequence || ''}
            onChange={(e) => onAssign(assumption.id, 'consequence', e.target.value)}
            className="text-xs px-2 py-1.5 border border-neutral-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker"
            aria-label="Konsekvens hvis feil"
          >
            <option value="">Konsekvens?</option>
            <option value="lav">Lav konsekvens</option>
            <option value="middels">Middels konsekvens</option>
            <option value="høy">Høy konsekvens</option>
          </select>

          {/* Status selector */}
          <select
            value={assignment.status || ''}
            onChange={(e) => onAssign(assumption.id, 'status', e.target.value)}
            className="text-xs px-2 py-1.5 border border-neutral-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker"
            aria-label="Status"
          >
            <option value="">Status?</option>
            <option value="å_validere">Å validere</option>
            <option value="validert">Validert</option>
            <option value="irrelevant">Irrelevant</option>
          </select>
        </div>
      )}

      {isCritical && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Kritisk antakelse
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Category Section Component
// ============================================================================

interface CategorySectionProps {
  category: AssumptionCategory;
  assumptions: Assumption[];
  assignments: AssumptionAssignments;
  onAssign: (id: string, field: 'certainty' | 'consequence' | 'status', value: string) => void;
  showAssignments: boolean;
}

function CategorySection({ category, assumptions, assignments, onAssign, showAssignments }: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const labels = CATEGORY_LABELS[category];

  if (assumptions.length === 0) return null;

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-4 bg-neutral-50 text-left focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-inset"
      >
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{labels.name}</h3>
          <p className="text-xs text-neutral-500">{labels.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">{assumptions.length}</span>
          <ChevronRightIcon
            className={cn('w-4 h-4 text-neutral-400 transition-transform', isOpen && 'rotate-90')}
          />
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 bg-white">
          {assumptions.map((assumption) => (
            <AssumptionCard
              key={assumption.id}
              assumption={assumption}
              assignments={assignments}
              onAssign={onAssign}
              showAssignments={showAssignments}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Critical Summary Component
// ============================================================================

interface CriticalSummaryProps {
  grouped: GroupedAssumptions;
  assignments: AssumptionAssignments;
}

function CriticalSummary({ grouped, assignments }: CriticalSummaryProps) {
  const allAssumptions = getAllAssumptions(grouped);
  const criticalAssumptions = allAssumptions.filter((a) => {
    const assignment = assignments[a.id];
    return assignment?.certainty === 'lav' && assignment?.consequence === 'høy';
  });

  if (criticalAssumptions.length === 0) return null;

  return (
    <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
      <h3 className="text-base font-semibold text-amber-800 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Kritiske antakelser ({criticalAssumptions.length})
      </h3>
      <p className="text-sm text-amber-700 mb-4">
        Disse antakelsene har lav sikkerhet og høy konsekvens. Vurder å teste dem tidlig.
      </p>
      <ul className="space-y-2">
        {criticalAssumptions.map((a) => (
          <li key={a.id} className="flex items-start gap-2 text-sm text-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" aria-hidden="true" />
            <span>{a.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AntakelseskartResultDisplay({
  result,
  isStreaming,
  originalInput: _originalInput,
  onRetry,
  onEdit,
  onReset,
}: AntakelseskartResultDisplayProps) {
  const [assignments, setAssignments] = useState<AssumptionAssignments>({});
  const [showAssignments, setShowAssignments] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const parsed = parseAntakelseskartResult(result);
  const { copyToClipboard: copy } = useCopyToClipboard();

  const copyToClipboard = async (text: string, feedbackMessage = 'Kopiert!') => {
    const success = await copy(text);
    setToastMessage(success ? feedbackMessage : 'Kunne ikke kopiere');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleAssign = (id: string, field: 'certainty' | 'consequence' | 'status', value: string) => {
    setAssignments((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value || undefined,
      },
    }));
  };

  const handleCopySummary = () => {
    trackClick('antakelseskart_copy_summary');

    // Build summary with user assignments
    const allAssumptions = getAllAssumptions(parsed.antakelser);
    const criticalAssumptions = allAssumptions.filter((a) => {
      const assignment = assignments[a.id];
      return assignment?.certainty === 'lav' && assignment?.consequence === 'høy';
    });

    let summary = `# Antakelseskart\n\n`;
    summary += `**Beslutning:** ${parsed.beslutningOppsummert}\n\n`;
    summary += `**Totalt antall antakelser:** ${parsed.antallTotalt}\n\n`;

    if (criticalAssumptions.length > 0) {
      summary += `## Kritiske antakelser (${criticalAssumptions.length})\n`;
      criticalAssumptions.forEach((a, i) => {
        summary += `${i + 1}. ${a.text}\n`;
      });
      summary += '\n';
    }

    const categories: AssumptionCategory[] = ['målgruppe_behov', 'løsning_produkt', 'marked_konkurranse', 'forretning_skalering'];
    for (const cat of categories) {
      if (parsed.antakelser[cat].length > 0) {
        summary += `## ${CATEGORY_LABELS[cat].name}\n`;
        parsed.antakelser[cat].forEach((a, i) => {
          const assignment = assignments[a.id];
          let meta = '';
          if (assignment?.certainty) meta += ` [${CERTAINTY_LABELS[assignment.certainty]}]`;
          if (assignment?.consequence) meta += ` [Kons: ${CONSEQUENCE_LABELS[assignment.consequence]}]`;
          if (assignment?.status) meta += ` [${ASSUMPTION_STATUS_LABELS[assignment.status]}]`;
          summary += `${i + 1}. ${a.text}${meta}\n`;
        });
        summary += '\n';
      }
    }

    summary += `---\n_Generert med Antakelseskartet – FYRK_`;

    copyToClipboard(summary, 'Oppsummering kopiert!');
  };

  // During streaming, show narrative loader if we don't have enough content yet
  if (isStreaming && !hasContent(parsed)) {
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
  if (!isStreaming && !hasContent(parsed)) {
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

  const categories: AssumptionCategory[] = ['målgruppe_behov', 'løsning_produkt', 'marked_konkurranse', 'forretning_skalering'];

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      <Toast message={toastMessage} isVisible={showToast} />

      {/* Decision summary */}
      {parsed.beslutningOppsummert && (
        <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Din beslutning</p>
          <p className="text-[15px] text-neutral-800 leading-relaxed">{parsed.beslutningOppsummert}</p>
          <p className="text-sm text-neutral-600 mt-3">
            {parsed.antallTotalt} antakelser identifisert
          </p>
        </div>
      )}

      {/* Clarifying text */}
      <p className="text-xs text-neutral-500 italic text-center px-2">
        Dette er antakelser som ligger implisitt i teksten. Marker sikkerhet og konsekvens for å finne de kritiske.
      </p>

      {/* Toggle assignments mode */}
      {!isStreaming && parsed.isComplete && (
        <div className="flex items-center justify-between p-4 bg-brand-cyan-lightest/40 border border-brand-cyan/30 rounded-xl">
          <div>
            <p className="text-sm font-medium text-brand-navy">Vurder antakelsene</p>
            <p className="text-xs text-neutral-600">Marker sikkerhet og konsekvens for hver antakelse</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAssignments(!showAssignments)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2',
              showAssignments
                ? 'bg-brand-navy text-white'
                : 'bg-white text-brand-navy border border-brand-navy hover:bg-brand-navy hover:text-white'
            )}
          >
            {showAssignments ? 'Skjul vurdering' : 'Start vurdering'}
          </button>
        </div>
      )}

      {/* Critical summary - only show when assignments are active and there are critical ones */}
      {showAssignments && <CriticalSummary grouped={parsed.antakelser} assignments={assignments} />}

      {/* Category sections */}
      <div className="space-y-4">
        {categories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            assumptions={parsed.antakelser[category]}
            assignments={assignments}
            onAssign={handleAssign}
            showAssignments={showAssignments}
          />
        ))}
      </div>

      {/* Action buttons */}
      {!isStreaming && (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 pt-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-navy hover:bg-brand-navy/90 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
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
              onClick={handleCopySummary}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Kopier
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded"
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
          <span>Identifiserer antakelser...</span>
        </div>
      )}
    </div>
  );
}
