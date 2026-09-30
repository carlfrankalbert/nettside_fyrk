import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface SectionProps {
  id: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string;
  /** Summary shown when collapsed (e.g., "5 verktøy, 234 klikk") */
  collapsedSummary?: string;
  /** Explanation behind an ⓘ next to the title (outside the toggle button) */
  info?: string;
}

export function CollapsibleSection({ id, title, icon, children, defaultExpanded = true, badge, collapsedSummary, info }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const toggle = () => setIsExpanded((expanded) => !expanded);

  return (
    <section id={id} className="scroll-mt-20">
      {/* The ⓘ sits beside the toggle, not inside it: a button can't contain a button */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center min-w-0">
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-2 text-left"
            aria-expanded={isExpanded}
            aria-controls={`${id}-content`}
          >
            {icon && <span className="text-slate-400">{icon}</span>}
            {title}
            {badge && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                {badge}
              </span>
            )}
          </button>
          {info && <Tooltip text={info} />}
        </h2>
        {/* Larger click target for the same toggle; the heading button is the accessible control */}
        <button type="button" onClick={toggle} tabIndex={-1} aria-hidden="true" className="flex items-center gap-3 group">
          {!isExpanded && collapsedSummary && (
            <span className="text-sm text-slate-500 hidden sm:block">
              {collapsedSummary}
            </span>
          )}
          <span className={`p-1 rounded-lg transition-colors ${isExpanded ? 'text-slate-400' : 'text-indigo-500 bg-indigo-50'} group-hover:text-slate-600 group-hover:bg-slate-100`}>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </button>
      </div>
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
