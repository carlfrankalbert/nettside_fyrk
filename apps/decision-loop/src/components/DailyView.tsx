import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from '../lib/debounce';
import type { DayEntry, DecisionLock } from '../lib/supabase';
import LockModal from './LockModal';
import ExportButton from './ExportButton';

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface EntryData {
  entry: DayEntry | null;
  lock: DecisionLock | null;
}

export default function DailyView() {
  const [date, setDate] = useState(() => toDateString(new Date()));
  const [entry, setEntry] = useState<DayEntry | null>(null);
  const [lock, setLock] = useState<DecisionLock | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  const isLocked = entry?.is_locked ?? false;
  const isToday = date === toDateString(new Date());

  async function fetchEntry(d: string) {
    setLoading(true);
    const res = await fetch(`/api/day-entry?date=${d}`);
    if (res.ok) {
      const data: EntryData = await res.json();
      setEntry(data.entry);
      setLock(data.lock);
    } else {
      setEntry(null);
      setLock(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEntry(date);
  }, [date]);

  const saveEntry = useCallback(
    async (fields: Partial<DayEntry>) => {
      setSaving(true);
      const res = await fetch('/api/day-entry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, ...fields }),
      });
      if (res.ok) {
        const data: EntryData = await res.json();
        setEntry(data.entry);
      }
      setSaving(false);
    },
    [date]
  );

  const debouncedSave = useMemo(() => debounce(saveEntry, 800), [saveEntry]);

  function handleChange(field: string, value: string) {
    if (isLocked) return;
    setEntry((prev) => (prev ? { ...prev, [field]: value } : null));
    debouncedSave({ [field]: value });
  }

  function navigateDate(delta: number) {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const next = toDateString(d);
    if (next <= toDateString(new Date())) {
      setDate(next);
    }
  }

  function handleLocked(newEntry: DayEntry, newLock: DecisionLock) {
    setEntry(newEntry);
    setLock(newLock);
    setShowLockModal(false);
  }

  if (loading) {
    return <p className="text-neutral-400">Loading...</p>;
  }

  const hasOneThing = Boolean(entry?.one_thing?.trim());

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigateDate(-1)}
          className="rounded px-3 py-1 text-sm hover:bg-neutral-100"
        >
          &larr; Previous
        </button>
        <div className="text-center">
          <p className="text-sm font-medium">{formatDisplayDate(date)}</p>
          {isLocked && (
            <span className="mt-1 inline-block rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
              Locked
            </span>
          )}
        </div>
        <button
          onClick={() => navigateDate(1)}
          disabled={isToday}
          className="rounded px-3 py-1 text-sm hover:bg-neutral-100 disabled:opacity-30"
        >
          Next &rarr;
        </button>
      </div>

      {saving && (
        <p className="mb-4 text-xs text-neutral-400">Saving...</p>
      )}

      {/* One Thing */}
      <Section title="One Thing" description="What is the single most important thing to decide today?">
        <textarea
          value={entry?.one_thing ?? ''}
          onChange={(e) => handleChange('one_thing', e.target.value)}
          disabled={isLocked}
          rows={2}
          className="field"
          placeholder="The one decision that matters most today..."
        />
      </Section>

      {/* Problem Clarity — only visible if one_thing is set */}
      {hasOneThing && (
        <>
          <Section title="Problem Clarity">
            <Field
              label="What is the problem?"
              value={entry?.problem_what ?? ''}
              onChange={(v) => handleChange('problem_what', v)}
              disabled={isLocked}
            />
            <Field
              label="Why does it matter?"
              value={entry?.problem_why ?? ''}
              onChange={(v) => handleChange('problem_why', v)}
              disabled={isLocked}
            />
            <Field
              label="Who is affected?"
              value={entry?.problem_who ?? ''}
              onChange={(v) => handleChange('problem_who', v)}
              disabled={isLocked}
            />
            <Field
              label="Constraints"
              value={entry?.problem_constraints ?? ''}
              onChange={(v) => handleChange('problem_constraints', v)}
              disabled={isLocked}
            />
          </Section>

          <Section title="Production" description="What will you ship or do today based on this decision?">
            <textarea
              value={entry?.production ?? ''}
              onChange={(e) => handleChange('production', e.target.value)}
              disabled={isLocked}
              rows={3}
              className="field"
              placeholder="Concrete action or output..."
            />
          </Section>
        </>
      )}

      {/* Lock or Decision Summary */}
      {isLocked && lock ? (
        <div className="mt-8 rounded border border-neutral-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-neutral-700">Decision</h3>
          <p className="mt-2 text-neutral-800">{lock.decision_text}</p>
          {lock.assumptions && (
            <>
              <h4 className="mt-4 text-sm font-medium text-neutral-500">Assumptions</h4>
              <p className="mt-1 text-neutral-700">{lock.assumptions}</p>
            </>
          )}
          {lock.practical_change && (
            <>
              <h4 className="mt-4 text-sm font-medium text-neutral-500">Practical change</h4>
              <p className="mt-1 text-neutral-700">{lock.practical_change}</p>
            </>
          )}
          <div className="mt-4">
            <ExportButton entry={entry!} lock={lock} />
          </div>
        </div>
      ) : (
        hasOneThing && (
          <div className="mt-8">
            <button
              onClick={() => setShowLockModal(true)}
              className="rounded bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Lock decision for today
            </button>
          </div>
        )
      )}

      {showLockModal && entry && (
        <LockModal
          entryId={entry.id}
          onClose={() => setShowLockModal(false)}
          onLocked={handleLocked}
        />
      )}

      <style>{`
        .field {
          width: 100%;
          border: 1px solid #e5e5e5;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          resize: vertical;
        }
        .field:focus {
          outline: none;
          border-color: #a3a3a3;
        }
        .field:disabled {
          background: #fafafa;
          color: #737373;
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-neutral-600">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={2}
        className="field mt-1"
      />
    </div>
  );
}
