import type React from 'react';
import { useCallback } from 'react';
import { isUrlEncoded, safeDecodeURIComponent } from '../utils/url-utils';

interface UseUrlDecodePasteOptions {
  /** Current input value */
  value: string;
  /** Callback to update the input value */
  onChange: (value: string) => void;
  /** Callback when input changes (for clearing errors) */
  onInputChange?: () => void;
  /** Reference to the textarea element for cursor positioning */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * Custom hook for handling paste events with URL decoding
 * Addresses iOS Safari bug where copied text can be URL-encoded
 *
 * @param options - Configuration options
 * @returns Object containing paste handler and change handler
 */
export function useUrlDecodePaste({
  value,
  onChange,
  onInputChange,
  textareaRef,
}: UseUrlDecodePasteOptions) {
  /**
   * Handle paste events to decode URL-encoded text
   */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData('text/plain');

      if (isUrlEncoded(pastedText)) {
        e.preventDefault();
        const decodedText = safeDecodeURIComponent(pastedText);

        // Get current cursor position
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // Insert decoded text at cursor position
        const newValue = value.substring(0, start) + decodedText + value.substring(end);
        onChange(newValue);
        onInputChange?.();

        // Reset cursor position after state update
        setTimeout(() => {
          if (textareaRef.current) {
            const newPosition = start + decodedText.length;
            textareaRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
    },
    [value, onChange, onInputChange, textareaRef]
  );

  /**
   * Handle change events with URL decoding fallback
   * This handles cases where paste event prevention doesn't work (iOS Safari/Chrome)
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let newValue = e.target.value;

      // Fallback: decode URL-encoded text on change
      if (isUrlEncoded(newValue)) {
        newValue = safeDecodeURIComponent(newValue);
      }

      onChange(newValue);
      onInputChange?.();
    },
    [onChange, onInputChange]
  );

  return { handlePaste, handleChange };
}
