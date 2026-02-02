import { useState } from 'react';
import { cn } from '../../utils/classes';
import { trackClick } from '../../utils/tracking';

export function FeedbackButtons({ isStreaming }: { isStreaming: boolean }) {
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [qualitativeInput, setQualitativeInput] = useState('');
  const [qualitativeSubmitted, setQualitativeSubmitted] = useState(false);

  if (isStreaming) {
    return null;
  }

  const handleFeedback = (type: 'up' | 'down') => {
    if (feedbackGiven) return;
    setFeedbackGiven(type);
    trackClick(type === 'up' ? 'konseptspeil_feedback_up' : 'konseptspeil_feedback_down');
  };

  const handleQualitativeSubmit = () => {
    if (qualitativeInput.trim()) {
      trackClick('konseptspeil_feedback_qualitative');
    }
    setQualitativeSubmitted(true);
  };

  if (feedbackGiven) {
    if (feedbackGiven === 'up' && !qualitativeSubmitted) {
      return (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">
            Takk! Hva var mest nyttig?
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={qualitativeInput}
              onChange={(e) => setQualitativeInput(e.target.value)}
              placeholder="Valgfritt"
              className="flex-1 px-2 py-1.5 text-xs border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker"
            />
            <button
              type="button"
              onClick={handleQualitativeSubmit}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => setQualitativeSubmitted(true)}
              className="px-2 py-1.5 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      );
    }

    return (
      <p className="text-xs text-neutral-500">
        Takk!
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500">Nyttig?</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => handleFeedback('up')}
          className={cn(
            'inline-flex items-center justify-center w-8 h-8',
            'text-neutral-400 hover:text-feedback-success hover:bg-feedback-success/10',
            'rounded transition-colors focus:outline-none',
            'focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-1'
          )}
          aria-label="Ja, dette var nyttig"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleFeedback('down')}
          className={cn(
            'inline-flex items-center justify-center w-8 h-8',
            'text-neutral-400 hover:text-feedback-error hover:bg-feedback-error/10',
            'rounded transition-colors focus:outline-none',
            'focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-1'
          )}
          aria-label="Nei, dette var ikke nyttig"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
