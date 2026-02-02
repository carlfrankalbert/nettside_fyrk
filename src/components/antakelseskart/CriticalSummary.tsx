import type { GroupedAssumptions } from '../../types/antakelseskart';
import { getAllAssumptions } from '../../utils/antakelseskart-parser';
import type { AssumptionAssignments } from './AssumptionCard';

interface CriticalSummaryProps {
  grouped: GroupedAssumptions;
  assignments: AssumptionAssignments;
}

export function CriticalSummary({ grouped, assignments }: CriticalSummaryProps) {
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
