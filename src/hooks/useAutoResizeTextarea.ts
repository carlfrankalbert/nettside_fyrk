import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for auto-resizing textarea elements
 * Automatically adjusts textarea height to fit content
 *
 * @param value - The current value of the textarea (triggers resize on change)
 * @returns Object containing textarea ref and manual resize trigger function
 */
export function useAutoResizeTextarea(value: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get accurate scrollHeight measurement
    textarea.style.height = 'auto';
    // Set height to scrollHeight to fit all content
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  // Auto-resize when value changes
  useEffect(() => {
    resize();
  }, [value, resize]);

  return { textareaRef, resize };
}
