import { cn } from '../../utils/classes';

interface FormInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'date';
  disabled?: boolean;
  error?: boolean;
}

/**
 * Reusable text input component with consistent styling
 */
export function FormInput({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error = false,
}: FormInputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 text-sm text-neutral-700 bg-white border-2 rounded-lg',
        'placeholder:text-neutral-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:border-brand-cyan-darker',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        error ? 'border-feedback-error' : 'border-neutral-300'
      )}
    />
  );
}
