import { useState } from 'react';
import type { AssumptionCategory, Assumption } from '../../types/antakelseskart';
import { CATEGORY_LABELS } from '../../types/antakelseskart';
import { ChevronRightIcon } from '../ui/Icon';
import { cn } from '../../utils/classes';
import { AssumptionCard, type AssumptionAssignments } from './AssumptionCard';

interface CategorySectionProps {
  category: AssumptionCategory;
  assumptions: Assumption[];
  assignments: AssumptionAssignments;
  onAssign: (id: string, field: 'certainty' | 'consequence' | 'status', value: string) => void;
  showAssignments: boolean;
}

export function CategorySection({ category, assumptions, assignments, onAssign, showAssignments }: CategorySectionProps) {
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
