import { CheckIcon, LightbulbIcon, CopyIcon, RefreshIcon } from '../ui/Icon';
import { cn } from '../../utils/classes';
import { trackClick } from '../../utils/tracking';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { okrTool } from '../../data/tools';

const { result: resultStrings } = okrTool.ui;

/**
 * Suggestion box with copy-to-clipboard functionality
 */
export function SuggestionBox({ suggestion, isStreaming, onReEvaluate }: { suggestion: string; isStreaming: boolean; onReEvaluate?: (suggestion: string) => void }) {
  const { copied, copyToClipboard } = useCopyToClipboard();

  const handleCopy = async () => {
    if (!suggestion) return;
    trackClick('okr_copy_suggestion');
    await copyToClipboard(suggestion);
  };

  if (!suggestion && !isStreaming) {
    return null;
  }

  return (
    <div className="mt-6">
      <h4 className="font-medium text-neutral-700 flex items-center gap-2 mb-3">
        <LightbulbIcon className="w-5 h-5 text-brand-cyan-darker" />
        {resultStrings.suggestionTitle}
      </h4>
      <div className="p-4 bg-brand-cyan-lightest/50 border-2 border-brand-cyan-light rounded-lg">
        {suggestion ? (
          <>
            <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">
              {suggestion}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-brand-cyan animate-pulse" aria-hidden="true" />
              )}
            </pre>
            {!isStreaming && (
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-brand-cyan-light/50">
                {onReEvaluate && (
                  <button
                    onClick={() => {
                      trackClick('okr_re_evaluate');
                      onReEvaluate(suggestion);
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5',
                      'text-sm font-medium text-brand-navy',
                      'bg-white hover:bg-brand-cyan-lighter',
                      'rounded-lg border border-brand-cyan-light',
                      'transition-colors focus:outline-none',
                      'focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2'
                    )}
                  >
                    <RefreshIcon className="w-4 h-4" />
                    {resultStrings.reEvaluateButton}
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5',
                    'text-sm font-medium text-brand-navy',
                    'bg-white hover:bg-brand-cyan-lighter',
                    'rounded-lg border border-brand-cyan-light',
                    'transition-colors focus:outline-none',
                    'focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2'
                  )}
                  aria-label={copied ? resultStrings.copiedButton : 'Kopier til utklippstavle'}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      {resultStrings.copiedButton}
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      {resultStrings.copyButton}
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="h-3 w-full bg-brand-cyan-lighter/50 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-brand-cyan-lighter/50 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-brand-cyan-lighter/50 rounded animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
