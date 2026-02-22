import { useState, useEffect, useMemo } from 'react';
import type { DayEntry, DecisionLock } from '../lib/supabase';
import ExportButton from './ExportButton';

interface DecisionItem {
  entry: DayEntry;
  lock: DecisionLock;
}

const WEEKDAYS = ['ma', 'ti', 'on', 'to', 'fr', 'lø', 'sø'];

const MONTH_NAMES = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'desember',
];

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface MonthCalendarProps {
  decisionDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

function MonthCalendar({ decisionDates, selectedDate, onSelectDate }: MonthCalendarProps) {
  const today = new Date();
  const todayStr = toDateString(today);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { days, startOffset } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // getDay() returns 0=Sun. Convert to Mon=0 offset.
    const firstDow = new Date(year, month, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const daysArr: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      daysArr.push(ds);
    }
    return { days: daysArr, startOffset: offset };
  }, [year, month]);

  function prev() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  }

  function next() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  }

  return (
    <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prev}
          className="rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Forrige måned"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-neutral-700">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={next}
          className="rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Neste måned"
        >
          →
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-neutral-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 text-center text-sm">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((dateStr) => {
          const dayNum = parseInt(dateStr.slice(8), 10);
          const hasDecision = decisionDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={[
                'relative mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors',
                isSelected
                  ? 'bg-neutral-800 font-semibold text-white'
                  : isToday
                    ? 'font-semibold text-neutral-900 ring-1 ring-neutral-300'
                    : 'text-neutral-600 hover:bg-neutral-100',
              ].join(' ')}
            >
              {dayNum}
              {hasDecision && (
                <span
                  className={[
                    'absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
                    isSelected ? 'bg-white' : 'bg-neutral-800',
                  ].join(' ')}
                />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button
          onClick={() => onSelectDate(null)}
          className="mt-2 text-xs text-neutral-400 hover:text-neutral-600"
        >
          Vis alle
        </button>
      )}
    </div>
  );
}

export default function DecisionLog() {
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/decisions')
      .then((r) => r.json())
      .then((data) => {
        const typed = data as { decisions?: DecisionItem[] };
        setDecisions(typed.decisions ?? []);
        setLoading(false);
      });
  }, []);

  const decisionDates = useMemo(
    () => new Set(decisions.map((d) => d.entry.date)),
    [decisions],
  );

  const filtered = selectedDate
    ? decisions.filter((d) => d.entry.date === selectedDate)
    : decisions;

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

      <div className="mt-4">
        <MonthCalendar
          decisionDates={decisionDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {selectedDate && filtered.length === 0 && (
        <p className="text-sm text-neutral-400">Ingen beslutninger denne dagen.</p>
      )}

      <ul className="space-y-3">
        {filtered.map(({ entry, lock }) => (
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
