import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  required?: boolean;
  helpText?: string;
  children: ReactNode;
}

/**
 * Reusable form field wrapper with label, required indicator, and help text
 */
export function FormField({
  label,
  id,
  required = false,
  helpText,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
        {required && <span className="text-feedback-error ml-1">*</span>}
      </label>
      {children}
      {helpText && <p className="mt-1 text-xs text-neutral-500">{helpText}</p>}
    </div>
  );
}
