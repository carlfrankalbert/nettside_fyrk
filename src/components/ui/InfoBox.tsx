import { CheckIcon } from './Icon';

interface InfoBoxProps {
  /** List of info items to display */
  items: string[];
}

/**
 * Reusable info box component with check icons
 * Used to display key features or instructions
 */
export function InfoBox({ items }: InfoBoxProps) {
  return (
    <div className="p-4 bg-neutral-100 rounded-lg">
      <ul className="space-y-1.5 text-sm text-neutral-700" role="list">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckIcon className="w-4 h-4 text-feedback-success flex-shrink-0 mt-0.5" />
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
