import { useState, useEffect } from 'react';
import { SpinnerIcon } from './Icon';
import { STREAMING_CONSTANTS } from '../../utils/constants';

const { LOADER_MESSAGE_INTERVAL_MS, SLOW_THRESHOLD_MS } = STREAMING_CONSTANTS;

interface NarrativeLoaderProps {
  /** Array of messages to rotate through during loading */
  messages: readonly string[];
  /** Optional slow loading message (defaults to generic message) */
  slowMessage?: string;
}

/**
 * Animated loader with rotating narrative messages.
 * Shows a slow-loading indicator after a threshold is exceeded.
 */
export function NarrativeLoader({
  messages,
  slowMessage = 'Dette tar litt lenger tid enn vanlig …',
}: NarrativeLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, LOADER_MESSAGE_INTERVAL_MS);

    const slowTimeout = setTimeout(() => {
      setIsSlow(true);
    }, SLOW_THRESHOLD_MS);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(slowTimeout);
    };
  }, [messages.length]);

  return (
    <div className="flex items-center gap-3 text-neutral-600 py-4">
      <SpinnerIcon className="animate-spin h-5 w-5 text-brand-cyan-darker" />
      <div>
        <p className="text-sm">{messages[messageIndex]}</p>
        {isSlow && (
          <p className="text-xs text-neutral-500 mt-1">{slowMessage}</p>
        )}
      </div>
    </div>
  );
}

/** Pre-defined loader messages for Konseptspeilet */
export const KONSEPTSPEIL_LOADER_MESSAGES = [
  'Leser gjennom teksten …',
  'Kartlegger dimensjonene …',
  'Identifiserer antagelser …',
  'Formulerer speilbilde …',
] as const;

/** Pre-defined loader messages for Antakelseskartet */
export const ANTAKELSESKART_LOADER_MESSAGES = [
  'Leser gjennom beskrivelsen …',
  'Identifiserer implisitte antakelser …',
  'Grupperer etter kategori …',
  'Ferdigstiller …',
] as const;
