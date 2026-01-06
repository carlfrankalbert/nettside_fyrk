import { parseKonseptSpeilResult, hasContent } from '../utils/konseptspeil-parser';
import { SpinnerIcon } from './ui/Icon';

interface KonseptSpeilResultDisplayProps {
  result: string;
  isStreaming: boolean;
  onRetry?: () => void;
}

/**
 * MVP result display - shows only assumptions and open questions
 */
export default function KonseptSpeilResultDisplay({
  result,
  isStreaming,
  onRetry,
}: KonseptSpeilResultDisplayProps) {
  const parsed = parseKonseptSpeilResult(result);

  // During streaming, show loading state if we don't have enough content yet
  if (isStreaming && !hasContent(parsed)) {
    return (
      <div className="flex items-center gap-3 text-neutral-500 py-4">
        <SpinnerIcon className="animate-spin h-5 w-5" />
        <span>Speiler konseptet ditt...</span>
      </div>
    );
  }

  // Show parse error if any
  if (parsed.parseError && !isStreaming) {
    return (
      <div className="p-4 bg-feedback-error/10 border border-feedback-error/20 rounded-lg">
        <p className="text-feedback-error text-sm">{parsed.parseError}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-sm text-brand-navy hover:text-brand-cyan-darker underline"
          >
            Prøv igjen
          </button>
        )}
      </div>
    );
  }

  // Show warning if response is incomplete and not streaming
  if (!isStreaming && !hasContent(parsed)) {
    return (
      <div className="p-4 bg-feedback-warning/10 border border-feedback-warning/20 rounded-lg">
        <p className="text-feedback-warning text-sm font-medium mb-2">
          Responsen ser ut til å være ufullstendig
        </p>
        <p className="text-neutral-600 text-sm mb-3">
          AI-en returnerte ikke det forventede formatet. Dette kan skyldes et midlertidig problem.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm text-brand-navy hover:text-brand-cyan-darker underline"
          >
            Prøv igjen
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="konseptspeil-result">
      {/* Antagelser i teksten */}
      {parsed.antagelser.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 tracking-tight">
            Antagelser i teksten
          </h3>
          <ul className="konseptspeil-result-list">
            {parsed.antagelser.map((antagelse, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[15px] text-neutral-700 leading-[1.85]"
              >
                <span
                  className="konseptspeil-bullet rounded-full bg-brand-cyan-darker shrink-0"
                  aria-hidden="true"
                />
                <span>{antagelse}</span>
              </li>
            ))}
          </ul>
          {isStreaming && parsed.sporsmal.length === 0 && (
            <SpinnerIcon className="animate-spin h-4 w-4 text-neutral-400 mt-4" />
          )}
        </section>
      )}

      {/* Åpne spørsmål teksten reiser */}
      {parsed.sporsmal.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 tracking-tight">
            Åpne spørsmål teksten reiser
          </h3>
          <ul className="konseptspeil-result-list">
            {parsed.sporsmal.map((sporsmal, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[15px] text-neutral-700 leading-[1.85]"
              >
                <span
                  className="konseptspeil-bullet rounded-full bg-neutral-400 shrink-0"
                  aria-hidden="true"
                />
                <span>{sporsmal}</span>
              </li>
            ))}
          </ul>
          {isStreaming && (
            <SpinnerIcon className="animate-spin h-4 w-4 text-neutral-400 mt-4" />
          )}
        </section>
      )}
    </div>
  );
}
