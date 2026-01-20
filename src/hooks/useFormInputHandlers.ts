import { useCallback, useEffect, useMemo, useRef } from 'react';
import { debounce } from '../utils/debounce';
import { isUrlEncoded, safeDecodeURIComponent } from '../utils/url-decoding';
import { trackClick } from '../utils/tracking';

interface UseFormInputHandlersOptions {
  /** Tool name for tracking and events (e.g., 'konseptspeil', 'antakelseskart') */
  toolName: string;
  /** Current input value */
  input: string;
  /** Function to update input value */
  setInput: (value: string) => void;
  /** Current error state */
  error: string | null;
  /** Function to clear error */
  clearError: () => void;
  /** Whether the submit button is enabled */
  isButtonEnabled: boolean;
  /** Function to handle form submission */
  handleSubmit: () => void;
  /** Ref to the textarea element */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Current loading state */
  loading: boolean;
  /** Current result */
  result: string | null;
  /** Trimmed input length */
  trimmedLength: number;
}

interface UseFormInputHandlersReturn {
  /** Handle paste event with URL decoding */
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  /** Handle keyboard shortcuts (Cmd+Enter to submit) */
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Handle input change with URL decoding and tracking */
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Auto-resize the textarea (debounced) */
  autoResizeTextarea: () => void;
  /** Ref tracking whether input start has been tracked */
  hasTrackedInputStartRef: React.RefObject<boolean>;
}

/**
 * Hook that provides common form input handlers for streaming AI tool forms.
 * Handles URL decoding, keyboard shortcuts, input tracking, and mobile events.
 */
export function useFormInputHandlers({
  toolName,
  input,
  setInput,
  error,
  clearError,
  isButtonEnabled,
  handleSubmit,
  textareaRef,
  loading,
  result,
  trimmedLength,
}: UseFormInputHandlersOptions): UseFormInputHandlersReturn {
  const hasTrackedInputStartRef = useRef(false);

  // Auto-resize textarea (debounced)
  const autoResizeTextarea = useMemo(
    () =>
      debounce(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }, 16),
    [textareaRef]
  );

  // Dispatch events for mobile CTA sync
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(`${toolName}:inputChange`, {
        detail: {
          length: trimmedLength,
          isLoading: loading,
          hasResult: !!result,
        },
      })
    );
  }, [toolName, trimmedLength, loading, result]);

  // Listen for mobile submit trigger
  useEffect(() => {
    const handleMobileSubmit = () => {
      handleSubmit();
    };
    window.addEventListener(`${toolName}:submit`, handleMobileSubmit);
    return () => window.removeEventListener(`${toolName}:submit`, handleMobileSubmit);
  }, [toolName, handleSubmit]);

  // Auto-resize textarea when input changes
  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  // Handle paste with URL decoding
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData('text/plain');

      if (isUrlEncoded(pastedText)) {
        e.preventDefault();
        const decodedText = safeDecodeURIComponent(pastedText);

        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const newValue = input.substring(0, start) + decodedText + input.substring(end);
        setInput(newValue);
        if (error) clearError();

        setTimeout(() => {
          if (textareaRef.current) {
            const newPosition = start + decodedText.length;
            textareaRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
    },
    [input, setInput, error, clearError, textareaRef]
  );

  // Handle Cmd+Enter to submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isButtonEnabled) {
          handleSubmit();
        }
      }
    },
    [isButtonEnabled, handleSubmit]
  );

  // Handle input change with URL decoding and tracking
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let newValue = e.target.value;
      if (isUrlEncoded(newValue)) {
        newValue = safeDecodeURIComponent(newValue);
      }

      // Track first input (funnel start) - only fire once per session
      if (!hasTrackedInputStartRef.current && newValue.length > 0 && input.length === 0) {
        hasTrackedInputStartRef.current = true;
        trackClick(`${toolName}_input_started`);
      }

      setInput(newValue);
      if (error) clearError();
    },
    [toolName, input, setInput, error, clearError]
  );

  return {
    handlePaste,
    handleKeyDown,
    handleInputChange,
    autoResizeTextarea,
    hasTrackedInputStartRef,
  };
}
