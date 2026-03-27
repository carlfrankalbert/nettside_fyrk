import { getScoreColor } from '../../utils/okr-parser';
import { cn } from '../../utils/classes';

/**
 * Circular score ring component for OKR review score display
 */
export function ScoreRing({ score, isStreaming }: { score: number | null; isStreaming: boolean }) {
  if (score === null) {
    if (isStreaming) {
      return (
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-neutral-100 animate-pulse">
          <span className="text-neutral-500 text-sm">...</span>
        </div>
      );
    }
    return null;
  }

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 40; // radius = 40
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-neutral-200"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(colors.ring, 'transition-all duration-500')}
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-2xl font-bold', colors.text)}>
            {score}<span className="text-base font-normal text-neutral-500">/10</span>
          </span>
        </div>
      </div>
      <span className={cn('text-sm font-medium', colors.text)}>{colors.label}</span>
    </div>
  );
}
