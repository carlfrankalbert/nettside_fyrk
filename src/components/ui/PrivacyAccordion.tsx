import { ChevronRightIcon } from './Icon';
import { cn } from '../../utils/classes';

export interface PrivacyContent {
  /** How the tool works */
  howItWorks: string;
  /** What happens to user data */
  dataHandling: string;
  /** Safety information */
  safety: string;
  /** Additional info (optional, for tool-specific content) */
  additionalInfo?: {
    title: string;
    content: string;
  };
}

interface PrivacyAccordionProps {
  /** Whether the accordion is expanded */
  isOpen: boolean;
  /** Toggle function for accordion state */
  onToggle: () => void;
  /** Short description shown above the accordion */
  description: string;
  /** The privacy content to display */
  content: PrivacyContent;
}

/**
 * Reusable privacy accordion component for AI tool pages
 * Displays information about how data is handled and processed
 */
export function PrivacyAccordion({
  isOpen,
  onToggle,
  description,
  content,
}: PrivacyAccordionProps) {
  return (
    <div className="border-t border-neutral-200 pt-6">
      <p className="text-sm text-neutral-500 mb-3">{description}</p>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="privacy-content"
        className="flex items-center gap-2 text-sm text-brand-navy hover:text-brand-cyan-darker focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded py-2"
      >
        <ChevronRightIcon className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-90')} />
        Les mer om AI og personvern
      </button>
      {isOpen && (
        <div
          id="privacy-content"
          className="mt-3 p-4 bg-neutral-100 rounded-lg text-sm text-neutral-700 space-y-3"
        >
          <p>
            <strong>Hvordan fungerer det?</strong>
            <br />
            {content.howItWorks}
          </p>
          <p>
            <strong>Hva skjer med dataene?</strong>
            <br />
            {content.dataHandling}
          </p>
          <p>
            <strong>Er det trygt?</strong>
            <br />
            {content.safety}
          </p>
          {content.additionalInfo && (
            <p>
              <strong>{content.additionalInfo.title}</strong>
              <br />
              {content.additionalInfo.content}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
