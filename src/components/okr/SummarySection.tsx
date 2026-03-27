import { useState } from 'react';
import { cn } from '../../utils/classes';
import { trackClick } from '../../utils/tracking';
import { okrTool } from '../../data/tools';

const { result: resultStrings } = okrTool.ui;

/**
 * Collapsible section for detailed summary
 */
export function SummarySection({ summary, isStreaming }: { summary: string; isStreaming: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!summary && !isStreaming) {
    return null;
  }

  const isLong = summary.length > 300;
  const shouldCollapse = isLong && !isExpanded;

  return (
    <div className="mb-6">
      <h4 className="font-medium text-neutral-700 mb-2">{resultStrings.overallAssessment}</h4>
      <div className={cn('text-sm text-neutral-600 leading-relaxed', shouldCollapse && 'line-clamp-3')}>
        {summary || (
          <div className="space-y-2">
            <div className="h-3 w-full bg-neutral-200 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-neutral-200 rounded animate-pulse" />
          </div>
        )}
      </div>
      {isLong && (
        <button
          onClick={() => {
            if (!isExpanded) {
              trackClick('okr_read_more');
            }
            setIsExpanded(!isExpanded);
          }}
          className="mt-2 text-sm text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded"
        >
          {isExpanded ? resultStrings.readLess : resultStrings.readMore}
        </button>
      )}
    </div>
  );
}
