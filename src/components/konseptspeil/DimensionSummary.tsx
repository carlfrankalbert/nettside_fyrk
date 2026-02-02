import type { DimensionKey, Dimensjoner } from '../../types/konseptspeil-v2';
import { StatusIndicator } from './StatusIndicator';

const SHORT_LABELS: Record<DimensionKey, string> = {
  verdi: 'Verdi',
  brukbarhet: 'Brukbarhet',
  gjennomforbarhet: 'Gj.førb.',
  levedyktighet: 'Levedykt.',
};

const DIMENSION_KEYS: DimensionKey[] = ['verdi', 'brukbarhet', 'gjennomforbarhet', 'levedyktighet'];

export function DimensionSummary({ dimensjoner }: { dimensjoner: Dimensjoner }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 p-3 bg-neutral-50 border border-neutral-200 rounded-lg"
      role="list"
      aria-label="Oppsummering av dimensjoner"
    >
      {DIMENSION_KEYS.map((key) => (
        <div
          key={key}
          className="flex items-center gap-1.5"
          role="listitem"
        >
          <span className="text-xs font-medium text-neutral-600">{SHORT_LABELS[key]}</span>
          <StatusIndicator status={dimensjoner[key].status} size="small" />
        </div>
      ))}
    </div>
  );
}
