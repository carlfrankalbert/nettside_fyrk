import { useRef } from 'react';
import { ChevronRightIcon } from './Icon';
import { cn } from '../../utils/classes';
import { trackClick } from '../../utils/tracking';

/**
 * Privacy accordion for AI tools
 * Uses native <details>/<summary> for progressive enhancement —
 * works without JavaScript, enhanced with tracking when JS is available.
 */

interface PrivacyAccordionProps {
  /** Tool name for tracking (e.g., 'konseptspeil', 'antakelseskart') */
  toolName: string;
  /** Intro text shown before the accordion */
  introText: string;
  /** Description of how the tool works */
  howItWorks: string;
}

export function PrivacyAccordion({ toolName, introText, howItWorks }: PrivacyAccordionProps) {
  const tracked = useRef(false);

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if ((e.currentTarget as HTMLDetailsElement).open && !tracked.current) {
      trackClick(`${toolName}_privacy_toggle`);
      tracked.current = true;
    }
  };

  return (
    <div className="border-t border-neutral-200 pt-6">
      <p className="text-sm text-neutral-500 mb-3">{introText}</p>
      <details onToggle={handleToggle} className="group">
        <summary className="flex items-center gap-2 text-sm text-brand-navy hover:text-brand-cyan-darker cursor-pointer list-none focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded py-2 [&::-webkit-details-marker]:hidden">
          <ChevronRightIcon className={cn('w-4 h-4 transition-transform group-open:rotate-90')} />
          Les mer om AI og personvern
        </summary>
        <div className="mt-3 p-4 bg-neutral-100 rounded-lg text-sm text-neutral-700 space-y-3">
          <p>
            <strong>Hvordan fungerer det?</strong>
            <br />
            {howItWorks}
          </p>
          <p>
            <strong>Hva skjer med dataene?</strong>
            <br />
            Teksten sendes til Claude API for å generere resultatet. Vi lagrer ikke innholdet, og det
            brukes ikke til å trene AI-modeller.
          </p>
          <p>
            <strong>Er det trygt?</strong>
            <br />
            Du trenger ikke logge inn. Ikke del personopplysninger, forretningshemmeligheter eller
            annen sensitiv informasjon i teksten du sender inn.
          </p>
          <p className="pt-2 border-t border-neutral-200">
            <a
              href="https://fyrk.no/personvern"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2"
            >
              Les FYRKs personvernerklæring
            </a>
          </p>
        </div>
      </details>
    </div>
  );
}
