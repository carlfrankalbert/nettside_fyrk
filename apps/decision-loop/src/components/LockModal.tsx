import { useState, useEffect, useRef } from 'react';
import type { DayEntry, DecisionLock } from '../lib/supabase';

interface Props {
  entryId: string;
  onClose: () => void;
  onLocked: (entry: DayEntry, lock: DecisionLock) => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function LockModal({ entryId, onClose, onLocked }: Props) {
  const [decisionText, setDecisionText] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [practicalChange, setPracticalChange] = useState('');
  const [shareWithFyrk, setShareWithFyrk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!decisionText.trim()) return;

    setLoading(true);
    setError('');

    const res = await fetch('/api/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_entry_id: entryId,
        decision_text: decisionText.trim(),
        assumptions: assumptions.trim() || null,
        practical_change: practicalChange.trim() || null,
        shared_with_fyrk: shareWithFyrk,
      }),
    });

    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error || 'Failed to lock');
      setLoading(false);
      return;
    }

    const { entry, lock } = await res.json() as { entry: DayEntry; lock: DecisionLock };
    onLocked(entry, lock);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-modal-title"
    >
      <div ref={modalRef} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 id="lock-modal-title" className="text-lg font-semibold">Lock today's decision</h2>
        <p className="mt-1 text-sm text-neutral-600">
          This cannot be undone. The entry will become read-only.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Decision <span className="text-red-500">*</span>
            </label>
            <textarea
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              required
              rows={3}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              placeholder="What did you decide?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Assumptions</label>
            <textarea
              value={assumptions}
              onChange={(e) => setAssumptions(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              placeholder="What assumptions are you making?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Practical change</label>
            <textarea
              value={practicalChange}
              onChange={(e) => setPracticalChange(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              placeholder="What changes concretely as a result?"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shareWithFyrk}
              onChange={(e) => setShareWithFyrk(e.target.checked)}
            />
            Share with Fyrk for review
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !decisionText.trim()}
              className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? 'Locking...' : 'Lock decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
