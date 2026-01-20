import { cn } from '../../utils/classes';

interface FormTextareaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
  error?: boolean;
}

/**
 * Reusable textarea component with consistent styling and character count
 */
export function FormTextarea({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
  disabled = false,
  error = false,
}: FormTextareaProps) {
  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-sm text-neutral-700 bg-white border-2 rounded-lg',
          'resize-none placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          error ? 'border-feedback-error' : 'border-neutral-300'
        )}
      />
      {maxLength && (
        <div className="mt-1 text-xs text-neutral-500 text-right">
          <span className={cn(value.length > maxLength * 0.9 && 'text-feedback-warning')}>
            {value.length}
          </span>
          {' / '}
          {maxLength} tegn
        </div>
      )}
    </div>
  );
}
