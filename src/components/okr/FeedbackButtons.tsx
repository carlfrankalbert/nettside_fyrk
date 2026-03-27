import { useState } from 'react';
import { ThumbsUpIcon, ThumbsDownIcon } from '../ui/Icon';
import { cn } from '../../utils/classes';
import { trackClick } from '../../utils/tracking';
import { okrTool } from '../../data/tools';

const { result: resultStrings } = okrTool.ui;

/**
 * Feedback buttons for user satisfaction tracking
 */
export function FeedbackButtons({ isStreaming }: { isStreaming: boolean }) {
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  if (isStreaming) {
    return null;
  }

  const handleFeedback = (type: 'up' | 'down') => {
    if (feedbackGiven) return;
    setFeedbackGiven(type);
    trackClick(type === 'up' ? 'feedback_up' : 'feedback_down');
  };

  if (feedbackGiven) {
    return (
      <div className="mt-6 pt-4 border-t border-neutral-200">
        <p className="text-sm text-neutral-500 text-center">
          {resultStrings.feedbackThanks}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-neutral-200">
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm text-neutral-600">{resultStrings.feedbackQuestion}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleFeedback('up')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5',
              'text-sm font-medium text-neutral-600',
              'bg-neutral-100 hover:bg-feedback-success/10 hover:text-feedback-success',
              'rounded-lg border border-neutral-200 hover:border-feedback-success/30',
              'transition-colors focus:outline-none',
              'focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2'
            )}
            aria-label="Ja, dette var nyttig"
          >
            <ThumbsUpIcon className="w-4 h-4" />
            {resultStrings.feedbackYes}
          </button>
          <button
            type="button"
            onClick={() => handleFeedback('down')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5',
              'text-sm font-medium text-neutral-600',
              'bg-neutral-100 hover:bg-feedback-error/10 hover:text-feedback-error',
              'rounded-lg border border-neutral-200 hover:border-feedback-error/30',
              'transition-colors focus:outline-none',
              'focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2'
            )}
            aria-label="Nei, dette var ikke nyttig"
          >
            <ThumbsDownIcon className="w-4 h-4" />
            {resultStrings.feedbackNo}
          </button>
        </div>
      </div>
    </div>
  );
}
