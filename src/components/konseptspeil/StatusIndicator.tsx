import type { DimensionStatus } from '../../types/konseptspeil-v2';
import { STATUS_LABELS } from '../../types/konseptspeil-v2';
import { cn } from '../../utils/classes';

/**
 * Three-dot progress indicator
 * Shows coverage level in a minimal, intuitive way:
 * - beskrevet: ●●● (3 filled)
 * - antatt: ●●○ (2 filled)
 * - ikke_nevnt: ○○○ (0 filled)
 */
const STATUS_TO_FILLED_DOTS: Record<DimensionStatus, number> = {
  beskrevet: 3,
  antatt: 2,
  ikke_nevnt: 0,
};

export function StatusIndicator({ status, size = 'default' }: { status: DimensionStatus; size?: 'small' | 'default' }) {
  const filledCount = STATUS_TO_FILLED_DOTS[status];
  const dotSize = size === 'small' ? 'w-[5px] h-[5px]' : 'w-[6px] h-[6px]';
  const gap = size === 'small' ? 'gap-[2px]' : 'gap-[3px]';

  return (
    <div
      className={cn('flex items-center', gap)}
      role="img"
      aria-label={`${STATUS_LABELS[status]} (${filledCount} av 3)`}
      title={STATUS_LABELS[status]}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            dotSize,
            'rounded-full transition-colors',
            i < filledCount
              ? 'bg-brand-cyan-darker'
              : 'bg-neutral-200'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
