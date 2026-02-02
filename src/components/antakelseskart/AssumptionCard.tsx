import type { Assumption, CertaintyLevel, ConsequenceLevel, AssumptionStatus } from '../../types/antakelseskart';
import { cn } from '../../utils/classes';

export interface AssumptionAssignments {
  [assumptionId: string]: {
    certainty?: CertaintyLevel;
    consequence?: ConsequenceLevel;
    status?: AssumptionStatus;
  };
}

interface AssumptionCardProps {
  assumption: Assumption;
  assignments: AssumptionAssignments;
  onAssign: (id: string, field: 'certainty' | 'consequence' | 'status', value: string) => void;
  showAssignments: boolean;
}

export function AssumptionCard({ assumption, assignments, onAssign, showAssignments }: AssumptionCardProps) {
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
