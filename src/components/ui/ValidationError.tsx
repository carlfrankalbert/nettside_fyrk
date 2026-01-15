/**
 * Inline validation error display
 * Used for form validation errors near input fields
 */

interface ValidationErrorProps {
  /** Error message to display */
  message: string;
  /** Element ID for aria-describedby linkage */
  id?: string;
}

export function ValidationError({ message, id }: ValidationErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-3"
    >
      <svg
        className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm text-neutral-700">{message}</p>
    </div>
  );
}
