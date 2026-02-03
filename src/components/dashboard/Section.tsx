import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SectionProps {
  id: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string;
  /** Summary shown when collapsed (e.g., "5 verktøy, 234 klikk") */
  collapsedSummary?: string;
}

export function Section({ id, title, icon, children, defaultExpanded = true, badge, collapsedSummary }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section id={id} className="scroll-mt-20">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 group"
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
      >
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          {title}
          {badge && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
              {badge}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          {!isExpanded && collapsedSummary && (
            <span className="text-sm text-slate-500 hidden sm:block">
              {collapsedSummary}
            </span>
          )}
          <span className={`p-1 rounded-lg transition-colors ${isExpanded ? 'text-slate-400' : 'text-indigo-500 bg-indigo-50'} group-hover:text-slate-600 group-hover:bg-slate-100`}>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </div>
      </button>
      {!isExpanded && collapsedSummary && (
        <p className="text-sm text-slate-500 mb-4 sm:hidden">
          {collapsedSummary} — klikk for å vise
        </p>
      )}
      {isExpanded && (
        <div id={`${id}-content`} className="animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </section>
  );
}
