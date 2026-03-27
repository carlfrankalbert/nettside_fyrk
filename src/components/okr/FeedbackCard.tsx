import { CheckIcon, WarningIcon } from '../ui/Icon';
import { cn } from '../../utils/classes';

/**
 * Feedback card for strengths or improvements
 */
export function FeedbackCard({
  title,
  items,
  type,
  isStreaming,
}: {
  title: string;
  items: string[];
  type: 'strength' | 'improvement';
  isStreaming: boolean;
}) {
  const isStrength = type === 'strength';
  const bgColor = isStrength ? 'bg-feedback-success/5' : 'bg-feedback-warning/5';
  const borderColor = isStrength ? 'border-feedback-success/20' : 'border-feedback-warning/20';
  const iconColor = isStrength ? 'text-feedback-success' : 'text-feedback-warning';

  const Icon = isStrength ? CheckIcon : WarningIcon;

  if (items.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <div className={cn('p-4 rounded-lg border', bgColor, borderColor)}>
      <h4 className="font-medium text-neutral-700 mb-3 flex items-center gap-2">
        <Icon className={cn('w-5 h-5', iconColor)} />
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-neutral-600">
              <span className={cn(
                'mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0',
                isStrength ? 'bg-feedback-success' : 'bg-feedback-warning'
              )} />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div className="h-12 flex items-center">
          <div className="h-3 w-3/4 bg-neutral-200 rounded animate-pulse" />
        </div>
      )}
    </div>
  );
}
