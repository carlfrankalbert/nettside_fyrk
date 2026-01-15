/**
 * Error display for streaming results area
 * Shows a centered error message with retry button
 */

interface StreamingErrorProps {
  /** Error message to display */
  message: string;
  /** Callback when retry button is clicked */
  onRetry: () => void;
  /** Button text (default: "Prøv igjen") */
  retryText?: string;
}

export function StreamingError({ message, onRetry, retryText = 'Prøv igjen' }: StreamingErrorProps) {
  return (
    <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-xl">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <p className="text-[15px] text-neutral-700 leading-[1.5] mb-4">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-brand-navy bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
          >
            {retryText}
          </button>
        </div>
      </div>
    </div>
  );
}
