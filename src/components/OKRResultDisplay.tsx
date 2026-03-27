import { parseOKRResult } from '../utils/okr-parser';
import { CheckIcon } from './ui/Icon';
import { okrTool } from '../data/tools';
import { ScoreRing } from './okr/ScoreRing';
import { FeedbackCard } from './okr/FeedbackCard';
import { SuggestionBox } from './okr/SuggestionBox';
import { FeedbackButtons } from './okr/FeedbackButtons';
import { SummarySection } from './okr/SummarySection';

const { result: resultStrings } = okrTool.ui;

interface OKRResultDisplayProps {
  result: string;
  isStreaming: boolean;
  onReEvaluate?: (suggestion: string) => void;
}

/**
 * Main OKR Result Display component
 * Parses and displays the AI-generated OKR review in a structured format
 */
export default function OKRResultDisplay({ result, isStreaming, onReEvaluate }: OKRResultDisplayProps) {
  const parsed = parseOKRResult(result);

  return (
    <div className="space-y-6">
      {/* Header with score */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 pb-6 border-b border-neutral-200">
        <ScoreRing score={parsed.score} isStreaming={isStreaming} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-brand-navy mb-2 flex items-center gap-2">
            {!isStreaming && parsed.isComplete && (
              <CheckIcon className="w-5 h-5 text-feedback-success" />
            )}
            {isStreaming ? resultStrings.assessmentInProgress : resultStrings.assessmentComplete}
          </h3>
          <SummarySection summary={parsed.summary} isStreaming={isStreaming} />
        </div>
      </div>

      {/* Feedback cards grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <FeedbackCard
          title={resultStrings.strengthsTitle}
          items={parsed.strengths}
          type="strength"
          isStreaming={isStreaming}
        />
        <FeedbackCard
          title={resultStrings.improvementsTitle}
          items={parsed.improvements}
          type="improvement"
          isStreaming={isStreaming}
        />
      </div>

      {/* Suggestion box */}
      <SuggestionBox suggestion={parsed.suggestion} isStreaming={isStreaming} onReEvaluate={onReEvaluate} />

      {/* Feedback buttons */}
      <FeedbackButtons isStreaming={isStreaming} />

      {/* Streaming raw fallback when parsing fails */}
      {isStreaming && !parsed.score && !parsed.strengths.length && !parsed.improvements.length && result && (
        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">
            {result}
            <span className="inline-block w-2 h-4 ml-1 bg-brand-cyan animate-pulse" aria-hidden="true" />
          </p>
        </div>
      )}
    </div>
  );
}
