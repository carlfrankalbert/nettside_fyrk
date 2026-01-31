import { toMarkdown } from '../lib/markdown-export';
import type { DayEntry, DecisionLock } from '../lib/supabase';

interface Props {
  entry: DayEntry;
  lock: DecisionLock;
}

export default function ExportButton({ entry, lock }: Props) {
  function handleExport() {
    const shareUrl = lock.share_token
      ? `${window.location.origin}/share/${lock.share_token}`
      : undefined;
    const md = toMarkdown(entry, lock, shareUrl);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-${entry.date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
    >
      Export .md
    </button>
  );
}
