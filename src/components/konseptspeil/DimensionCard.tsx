import type { DimensionKey, DimensionStatus, DimensionData } from '../../types/konseptspeil-v2';
import { DIMENSION_LABELS, STATUS_LABELS } from '../../types/konseptspeil-v2';
import { cn } from '../../utils/classes';
import { CopyButton } from './CopyButton';
import { StatusIndicator } from './StatusIndicator';

/**
 * Subtle background colors for dimension cards based on coverage
 */
const CARD_BG_COLORS: Record<DimensionStatus, string> = {
  beskrevet: 'bg-brand-cyan-lightest/30 border-brand-cyan/20',
  antatt: 'bg-white border-neutral-200',
  ikke_nevnt: 'bg-neutral-50 border-neutral-200',
};

export function DimensionCard({
  dimensionKey,
  data,
  onCopy,
  isMostUnclear = false
}: {
  dimensionKey: DimensionKey;
  data: DimensionData;
  onCopy: (text: string) => void;
  isMostUnclear?: boolean;
}) {
  const labels = DIMENSION_LABELS[dimensionKey];

  const copyText = `## ${labels.name}
${STATUS_LABELS[data.status]}

${data.observasjon || labels.question}`;

  return (
    <div className={cn('relative p-4 border rounded-lg group', CARD_BG_COLORS[data.status])}>
      {isMostUnclear && (
        <span className="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-medium text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-full">
          Mest uavklart
        </span>
      )}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <StatusIndicator status={data.status} />
          <h4 className="font-semibold text-neutral-900">{labels.name}</h4>
        </div>
        <CopyButton
          onCopy={() => onCopy(copyText)}
          ariaLabel={`Kopier ${labels.name}`}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        />
      </div>
      <p className="text-xs text-neutral-400 mb-2 ml-[18px]">
        {labels.subtitle}
      </p>
      <p className="text-sm text-neutral-600 leading-relaxed">
        {data.observasjon || labels.question}
      </p>
    </div>
  );
}
