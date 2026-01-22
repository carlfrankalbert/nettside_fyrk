import { useState, useCallback } from 'react';

interface UseCopyToClipboardReturn {
  copied: boolean;
  copyToClipboard: (text: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Shared hook for copy-to-clipboard functionality with fallback
 * Provides consistent behavior across all components
 */
export function useCopyToClipboard(resetDelay = 2000): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setCopied(false);
  }, []);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    // Try modern clipboard API first
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetDelay);
        return true;
      } catch (clipboardError) {
        // Fall through to fallback - clipboard API may be blocked by permissions
        if (import.meta.env?.DEV) {
          console.warn('[clipboard] Clipboard API failed, trying fallback:', clipboardError);
        }
      }
    }

    // Fallback: create a temporary textarea
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), resetDelay);
        return true;
      }
    } catch {
      // Fallback failed
    }

    return false;
  }, [resetDelay]);

  return { copied, copyToClipboard, reset };
}
