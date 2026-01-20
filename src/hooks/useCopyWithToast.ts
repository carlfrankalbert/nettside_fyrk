import { useState, useCallback } from 'react';
import { useCopyToClipboard } from './useCopyToClipboard';

interface UseCopyWithToastOptions {
  /** How long to show the toast in milliseconds (default: 2000) */
  toastDuration?: number;
  /** Default success message (default: 'Kopiert!') */
  successMessage?: string;
  /** Default error message (default: 'Kunne ikke kopiere') */
  errorMessage?: string;
}

interface UseCopyWithToastReturn {
  /** Toast message to display */
  toastMessage: string;
  /** Whether the toast is currently visible */
  showToast: boolean;
  /** Copy text to clipboard with toast feedback */
  copyWithToast: (text: string, feedbackMessage?: string) => Promise<boolean>;
}

/**
 * Hook that combines clipboard copying with toast feedback.
 * Handles the toast state management and timing automatically.
 */
export function useCopyWithToast(
  options: UseCopyWithToastOptions = {}
): UseCopyWithToastReturn {
  const {
    toastDuration = 2000,
    successMessage = 'Kopiert!',
    errorMessage = 'Kunne ikke kopiere',
  } = options;

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const { copyToClipboard } = useCopyToClipboard();

  const copyWithToast = useCallback(
    async (text: string, feedbackMessage?: string): Promise<boolean> => {
      const success = await copyToClipboard(text);
      setToastMessage(success ? (feedbackMessage ?? successMessage) : errorMessage);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, toastDuration);

      return success;
    },
    [copyToClipboard, successMessage, errorMessage, toastDuration]
  );

  return {
    toastMessage,
    showToast,
    copyWithToast,
  };
}
