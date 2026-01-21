import { useState } from 'react';
import { CheckIcon, CopyIcon, SpinnerIcon } from './ui/Icon';
import { cn } from '../utils/classes';
import { trackClick } from '../utils/tracking';

interface PreMortemResultDisplayProps {
  result: string;
  isStreaming: boolean;
}

/**
 * Copy button component with success feedback
 */
function CopyButton({
  text,
  label,
  variant = 'default',
  className,
}: {
  text: string;
  label: string;
  variant?: 'default' | 'outline';
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;

    trackClick('premortem_copy');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const baseStyles =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2';

  const variantStyles =
    variant === 'outline'
      ? 'text-brand-navy bg-white hover:bg-neutral-100 border border-neutral-300'
      : 'text-brand-navy bg-neutral-100 hover:bg-neutral-200';

  return (
    <button
      onClick={handleCopy}
      className={cn(baseStyles, variantStyles, className)}
      aria-label={copied ? 'Kopiert!' : label}
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4" />
          Kopiert!
        </>
      ) : (
        <>
          <CopyIcon className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  );
}

/**
 * Parse markdown content into sections for better rendering
 */
function parsePreMortemSections(content: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];

  // Split by section headers (numbered with **)
  const sectionRegex = /\*\*(\d+)\.\s+([^*]+)\*\*/g;
  let match;

  const matches: { index: number; fullMatch: string; number: string; title: string }[] = [];

  while ((match = sectionRegex.exec(content)) !== null) {
    matches.push({
      index: match.index,
      fullMatch: match[0],
      number: match[1],
      title: match[2].trim(),
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const startIndex = current.index + current.fullMatch.length;
    const endIndex = next ? next.index : content.length;

    const sectionContent = content.slice(startIndex, endIndex).trim();

    sections.push({
      title: `${current.number}. ${current.title}`,
      content: sectionContent,
    });
  }

  return sections;
}

/**
 * Render markdown content with basic formatting
 */
function MarkdownContent({ content }: { content: string }) {
  // Process the content for basic markdown rendering
  const lines = content.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) {
          return <div key={index} className="h-2" />;
        }

        // Bullet points
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
          return (
            <div key={index} className="flex items-start gap-2 text-neutral-700">
              <span className="text-brand-cyan-darker mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-cyan-darker flex-shrink-0" />
              <span className="flex-1">{trimmedLine.slice(2)}</span>
            </div>
          );
        }

        // Sub-headers (bold text on its own line)
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          return (
            <p key={index} className="font-semibold text-neutral-800 mt-3">
              {trimmedLine.slice(2, -2)}
            </p>
          );
        }

        // Regular text with inline bold handling
        const processedText = trimmedLine.replace(
          /\*\*([^*]+)\*\*/g,
          '<strong class="font-semibold text-neutral-800">$1</strong>'
        );

        return (
          <p
            key={index}
            className="text-neutral-700"
            dangerouslySetInnerHTML={{ __html: processedText }}
          />
        );
      })}
    </div>
  );
}

/**
 * Section card component
 */
function SectionCard({
  title,
  content,
  isHighlight = false,
}: {
  title: string;
  content: string;
  isHighlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        isHighlight
          ? 'bg-feedback-warning/5 border-feedback-warning/20'
          : 'bg-white border-neutral-200'
      )}
    >
      <h4 className="font-semibold text-brand-navy mb-3">{title}</h4>
      <MarkdownContent content={content} />
    </div>
  );
}

/**
 * Main Pre-Mortem Result Display component
 */
export default function PreMortemResultDisplay({
  result,
  isStreaming,
}: PreMortemResultDisplayProps) {
  const sections = parsePreMortemSections(result);

  // Show loading state if streaming and no content yet
  if (isStreaming && !result) {
    return (
      <div className="p-6 bg-white border-2 border-neutral-200 rounded-lg">
        <div className="flex items-center gap-3 text-neutral-500">
          <SpinnerIcon className="animate-spin h-5 w-5" />
          <span>Genererer Pre-Mortem Brief...</span>
        </div>
      </div>
    );
  }

  // Show streaming raw content if sections aren't parsed yet
  if (isStreaming && sections.length === 0 && result) {
    return (
      <div className="p-6 bg-white border-2 border-neutral-200 rounded-lg">
        <div className="prose prose-neutral max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700">
            {result}
            <span className="inline-block w-2 h-4 ml-1 bg-brand-cyan animate-pulse" aria-hidden="true" />
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with copy buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-brand-navy flex items-center gap-2">
          {!isStreaming && <CheckIcon className="w-5 h-5 text-feedback-success" />}
          {isStreaming ? 'Genererer brief...' : 'Pre-Mortem Brief'}
        </h3>
        {!isStreaming && (
          <div className="flex gap-2">
            <CopyButton text={result} label="Kopier" variant="default" />
            <CopyButton
              text={result}
              label="Kopier som Markdown"
              variant="outline"
            />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      {!isStreaming && sections.length > 0 && (
        <div className="px-3 py-2 bg-neutral-100 border-l-2 border-neutral-400 text-sm text-neutral-600 italic">
          Dette er ikke en vurdering av om beslutningen er riktig – kun hvordan den kan feile.
        </div>
      )}

      {/* Rendered sections */}
      <div className="space-y-4">
        {sections.map((section, index) => {
          // Highlight the PRE-MORTEM section
          const isPreMortem = section.title.toLowerCase().includes('pre-mortem');
          const isStoppKriterier = section.title.toLowerCase().includes('stopp');

          return (
            <SectionCard
              key={index}
              title={section.title}
              content={section.content}
              isHighlight={isPreMortem || isStoppKriterier}
            />
          );
        })}
      </div>

      {/* Streaming indicator at the end */}
      {isStreaming && sections.length > 0 && (
        <div className="flex items-center gap-2 text-neutral-500 text-sm">
          <SpinnerIcon className="animate-spin h-4 w-4" />
          <span>Genererer mer innhold...</span>
        </div>
      )}
    </div>
  );
}
