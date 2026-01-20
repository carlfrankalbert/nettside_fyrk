import { cn } from '../../utils/classes';

interface FormSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  disabled?: boolean;
  error?: boolean;
}

/**
 * Reusable select component with consistent styling
 */
export function FormSelect({
  id,
  value,
  onChange,
  options,
  disabled = false,
  error = false,
}: FormSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 text-sm text-neutral-700 bg-white border-2 rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        error ? 'border-feedback-error' : 'border-neutral-300'
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
