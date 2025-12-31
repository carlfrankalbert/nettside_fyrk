import type { ReactNode } from 'react';

interface UsefulItem {
  text: string;
}

interface ToolPageContentProps {
  /** The main tool component to render */
  children: ReactNode;
  /** Title for the "When is this useful?" section */
  usefulTitle?: string;
  /** List of use cases */
  usefulItems: UsefulItem[];
  /** Contact CTA question text */
  contactQuestion: string;
  /** Footer attribution text */
  footerText: string;
}

/**
 * Generic page content wrapper for AI tool pages
 * Provides consistent layout with tool, use cases, and contact sections
 */
export function ToolPageContent({
  children,
  usefulTitle = 'Når er dette nyttig?',
  usefulItems,
  contactQuestion,
  footerText,
}: ToolPageContentProps) {
  return (
    <>
      {/* Tool component */}
      <section className="mb-10">{children}</section>

      {/* When is this useful + Contact */}
      <section className="pt-6 border-t border-neutral-200" aria-labelledby="more-info-heading">
        <h2 id="more-info-heading" className="text-lg font-semibold text-brand-navy mb-3">
          {usefulTitle}
        </h2>
        <ul className="text-neutral-600 space-y-1.5 text-sm mb-6" role="list">
          {usefulItems.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-neutral-500" aria-hidden="true">
                •
              </span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-neutral-100">
          <span className="text-sm text-neutral-600">{contactQuestion}</span>
          <a
            href="mailto:hei@fyrk.no"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-brand-navy hover:text-white hover:bg-brand-navy border-2 border-brand-navy rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
          >
            <svg
              className="w-4 h-4"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Ta kontakt
          </a>
        </div>
        <p className="text-xs text-neutral-500 mt-4">{footerText}</p>
      </section>
    </>
  );
}
