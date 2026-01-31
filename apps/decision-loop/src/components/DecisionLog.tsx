import { useState, useEffect } from 'react';
import type { DayEntry, DecisionLock } from '../lib/supabase';
import ExportButton from './ExportButton';

interface DecisionItem {
  entry: DayEntry;
  lock: DecisionLock;
}

export default function DecisionLog() {
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/decisions')
      .then((r) => r.json())
      .then((data) => {
        const typed = data as { decisions?: DecisionItem[] };
        setDecisions(typed.decisions ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-neutral-400">Loading...</p>;

  if (decisions.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Decision Log</h1>
        <p className="mt-2 text-neutral-500">No locked decisions yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Decision Log</h1>
      <ul className="mt-6 space-y-3">
        {decisions.map(({ entry, lock }) => (
          <li key={entry.id}>
            <button
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
              className="w-full rounded border border-neutral-200 bg-white px-4 py-3 text-left hover:border-neutral-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400">{entry.date}</span>
                  <p className="font-medium text-neutral-800">{entry.one_thing}</p>
                </div>
                <span className="text-neutral-400">{expanded === entry.id ? '−' : '+'}</span>
              </div>
            </button>
            {expanded === entry.id && (
              <div className="mt-1 rounded border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm">
                <h3 className="font-semibold text-neutral-700">Decision</h3>
                <p className="mt-1">{lock.decision_text}</p>
                {lock.assumptions && (
                  <>
                    <h4 className="mt-3 font-medium text-neutral-500">Assumptions</h4>
                    <p className="mt-1">{lock.assumptions}</p>
                  </>
                )}
                {lock.practical_change && (
                  <>
                    <h4 className="mt-3 font-medium text-neutral-500">Practical change</h4>
                    <p className="mt-1">{lock.practical_change}</p>
                  </>
                )}
                {entry.problem_what && (
                  <>
                    <h4 className="mt-3 font-medium text-neutral-500">Problem</h4>
                    <p className="mt-1">{entry.problem_what}</p>
                  </>
                )}
                <div className="mt-3">
                  <ExportButton entry={entry} lock={lock} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
