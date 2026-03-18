/**
 * Shared error/incomplete states for AI result display components
 *
 * Used by KonseptSpeilResultDisplayV2 and AntakelseskartResultDisplay.
 * OKRResultDisplay uses a simpler inline pattern (no parse error / incomplete states).
 */

interface ResultErrorStateProps {
  /** Error message to display */
  message: string;
  /** Optional retry handler */
  onRetry?: () => void;
  /** Visual variant */
  variant: 'error' | 'warning';
  /** Optional secondary description (for warnings) */
  description?: string;
}

export function ResultErrorState({ message, onRetry, variant, description }: ResultErrorStateProps) {
  const colors = variant === 'error'
    ? { bg: 'bg-feedback-error/10', border: 'border-feedback-error/20', text: 'text-feedback-error' }
    : { bg: 'bg-feedback-warning/10', border: 'border-feedback-warning/20', text: 'text-feedback-warning' };

  return (
    <div className={`p-4 ${colors.bg} border ${colors.border} rounded-lg`}>
      <p className={`${colors.text} text-sm ${variant === 'warning' ? 'font-medium mb-2' : ''}`}>
        {message}
      </p>
      {description && (
        <p className="text-neutral-600 text-sm mb-3">{description}</p>
      )}
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
