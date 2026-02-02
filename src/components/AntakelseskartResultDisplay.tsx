import { useState } from 'react';
import { parseAntakelseskartResult, hasContent, getAllAssumptions } from '../utils/antakelseskart-parser';
import type { AssumptionCategory } from '../types/antakelseskart';
import {
  CATEGORY_LABELS,
  CERTAINTY_LABELS,
  CONSEQUENCE_LABELS,
  ASSUMPTION_STATUS_LABELS,
} from '../types/antakelseskart';
import { SpinnerIcon } from './ui/Icon';
import { Toast } from './ui/Toast';
import { NarrativeLoader, ANTAKELSESKART_LOADER_MESSAGES } from './ui/NarrativeLoader';
import { cn } from '../utils/classes';
import { trackClick } from '../utils/tracking';
import { useCopyWithToast } from '../hooks/useCopyWithToast';

import type { AssumptionAssignments } from './antakelseskart/AssumptionCard';
import { CategorySection } from './antakelseskart/CategorySection';
import { CriticalSummary } from './antakelseskart/CriticalSummary';

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

  const parsed = parseAntakelseskartResult(result);
  const { toastMessage, showToast, copyWithToast: copyToClipboard } = useCopyWithToast();

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

  // During streaming, show narrative loader
  if (isStreaming && !hasContent(parsed)) {
    return <NarrativeLoader messages={ANTAKELSESKART_LOADER_MESSAGES} />;
  }

  // Show parse error
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

  // Show warning if incomplete
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

      {showAssignments && <CriticalSummary grouped={parsed.antakelser} assignments={assignments} />}

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

      {isStreaming && (
        <div className="flex items-center gap-2 text-neutral-500 text-sm">
          <SpinnerIcon className="animate-spin h-4 w-4" />
          <span>Identifiserer antakelser...</span>
        </div>
      )}
    </div>
  );
}
