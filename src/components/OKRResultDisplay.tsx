import { useState } from 'react';
import { parseOKRResult, getScoreColor, type ParsedOKRResult } from '../utils/okr-parser';

interface OKRResultDisplayProps {
  result: string;
  isStreaming: boolean;
}

/**
 * Circular score ring component
 */
function ScoreRing({ score, isStreaming }: { score: number | null; isStreaming: boolean }) {
  if (score === null) {
    if (isStreaming) {
      return (
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-neutral-100 animate-pulse">
          <span className="text-neutral-500 text-sm">...</span>
        </div>
      );
    }
    return null;
  }

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 40; // radius = 40
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-neutral-200"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${colors.ring} transition-all duration-500`}
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${colors.text}`}>
            {score}<span className="text-base font-normal text-neutral-500">/10</span>
          </span>
        </div>
      </div>
      <span className={`text-sm font-medium ${colors.text}`}>{colors.label}</span>
    </div>
  );
}

/**
 * Feedback card for strengths or improvements
 */
function FeedbackCard({
  title,
  items,
  type,
  isStreaming,
}: {
  title: string;
  items: string[];
  type: 'strength' | 'improvement';
  isStreaming: boolean;
}) {
  const isStrength = type === 'strength';
  const bgColor = isStrength ? 'bg-feedback-success/5' : 'bg-feedback-warning/5';
  const borderColor = isStrength ? 'border-feedback-success/20' : 'border-feedback-warning/20';
  const iconColor = isStrength ? 'text-feedback-success' : 'text-feedback-warning';

  const Icon = isStrength ? CheckIcon : WarningIcon;

  if (items.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg border ${bgColor} ${borderColor}`}>
      <h4 className="font-medium text-neutral-700 mb-3 flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-neutral-600">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isStrength ? 'bg-feedback-success' : 'bg-feedback-warning'}`} />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div className="h-12 flex items-center">
          <div className="h-3 w-3/4 bg-neutral-200 rounded animate-pulse" />
        </div>
      )}
    </div>
  );
}

/**
 * Suggestion box with copy-to-clipboard functionality
 */
function SuggestionBox({ suggestion, isStreaming }: { suggestion: string; isStreaming: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!suggestion) return;

    try {
      await navigator.clipboard.writeText(suggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!suggestion && !isStreaming) {
    return null;
  }

  return (
    <div className="mt-6">
      <h4 className="font-medium text-neutral-700 flex items-center gap-2 mb-3">
        <LightbulbIcon className="w-5 h-5 text-brand-cyan-darker" />
        Forslag til forbedret OKR-sett
      </h4>
      <div className="p-4 bg-brand-cyan-lightest/50 border-2 border-brand-cyan-light rounded-lg">
        {suggestion ? (
          <>
            <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">
              {suggestion}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-brand-cyan animate-pulse" aria-hidden="true" />
              )}
            </pre>
            {!isStreaming && (
              <div className="flex justify-end mt-4 pt-3 border-t border-brand-cyan-light/50">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-navy bg-white hover:bg-brand-cyan-lighter rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 border border-brand-cyan-light"
                  aria-label={copied ? 'Kopiert!' : 'Kopier til utklippstavle'}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      Kopier
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="h-3 w-full bg-brand-cyan-lighter/50 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-brand-cyan-lighter/50 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-brand-cyan-lighter/50 rounded animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Collapsible section for detailed summary
 */
function SummarySection({ summary, isStreaming }: { summary: string; isStreaming: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!summary && !isStreaming) {
    return null;
  }

  // Show collapsed by default if summary is long
  const isLong = summary.length > 300;
  const shouldCollapse = isLong && !isExpanded;

  return (
    <div className="mb-6">
      <h4 className="font-medium text-neutral-700 mb-2">Samlet vurdering</h4>
      <div className={`text-sm text-neutral-600 leading-relaxed ${shouldCollapse ? 'line-clamp-3' : ''}`}>
        {summary || (
          <div className="space-y-2">
            <div className="h-3 w-full bg-neutral-200 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-neutral-200 rounded animate-pulse" />
          </div>
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-brand-navy hover:text-brand-cyan-darker underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2 rounded"
        >
          {isExpanded ? 'Vis mindre' : 'Les mer'}
        </button>
      )}
    </div>
  );
}

// Icon components
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

/**
 * Main OKR Result Display component
 * Parses and displays the AI-generated OKR review in a structured format
 */
export default function OKRResultDisplay({ result, isStreaming }: OKRResultDisplayProps) {
  const parsed = parseOKRResult(result);

  return (
    <div className="space-y-6">
      {/* Header with score */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 pb-6 border-b border-neutral-200">
        <ScoreRing score={parsed.score} isStreaming={isStreaming} />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-brand-navy mb-2 flex items-center gap-2">
            {!isStreaming && parsed.isComplete && (
              <CheckIcon className="w-5 h-5 text-feedback-success" />
            )}
            {isStreaming ? 'Vurdering pågår...' : 'Vurdering fullført'}
          </h3>
          <SummarySection summary={parsed.summary} isStreaming={isStreaming} />
        </div>
      </div>

      {/* Feedback cards grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <FeedbackCard
          title="Hva fungerer bra"
          items={parsed.strengths}
          type="strength"
          isStreaming={isStreaming}
        />
        <FeedbackCard
          title="Hva kan forbedres"
          items={parsed.improvements}
          type="improvement"
          isStreaming={isStreaming}
        />
      </div>

      {/* Suggestion box */}
      <SuggestionBox suggestion={parsed.suggestion} isStreaming={isStreaming} />

      {/* Streaming raw fallback when parsing fails */}
      {isStreaming && !parsed.score && !parsed.strengths.length && !parsed.improvements.length && result && (
        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">
            {result}
            <span className="inline-block w-2 h-4 ml-1 bg-brand-cyan animate-pulse" aria-hidden="true" />
          </p>
        </div>
      )}
    </div>
  );
}
