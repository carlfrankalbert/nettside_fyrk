import { useState } from 'react';
import { ChevronRightIcon } from '../ui/Icon';
import { cn } from '../../utils/classes';

export function InputReview({ input }: { input: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const truncatedInput = input.length > 120 ? input.substring(0, 120) + '…' : input;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-start justify-between gap-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded-lg"
      >
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Din tekst</span>
          {!isOpen && (
            <p className="text-sm text-neutral-600 truncate mt-1">{truncatedInput}</p>
          )}
        </div>
        <ChevronRightIcon
          className={cn(
            'w-4 h-4 text-neutral-400 transition-transform shrink-0 mt-1',
            isOpen && 'rotate-90'
          )}
        />
      </button>
      {isOpen && (
        <div className="mt-2 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
          {input}
        </div>
      )}
    </div>
  );
}
