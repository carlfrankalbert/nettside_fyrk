import OKRReviewer from './OKRReviewer';
import { EXTERNAL_LINKS, CONTACT_LABEL } from '../utils/links';
import { okrTool } from '../data/tools';

const { whenUseful } = okrTool.ui;

/**
 * OKR Page Content component
 */
export default function OKRPageContent() {
  return (
    <>
      {/* Input + CTA */}
      <section className="mb-10">
        <OKRReviewer />
      </section>

      {/* Når er dette nyttig + Kontakt - samlet i én seksjon */}
      <section className="pt-6 border-t border-neutral-200" aria-labelledby="more-info-heading">
        <h2 id="more-info-heading" className="text-lg font-semibold text-brand-navy mb-3">
          {whenUseful.heading}
        </h2>
        <ul className="text-neutral-600 space-y-1.5 text-sm mb-6" role="list">
          {whenUseful.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-neutral-500" aria-hidden="true">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-neutral-100">
          <span className="text-sm text-neutral-600">{whenUseful.humanCTA}</span>
          <a
            href={EXTERNAL_LINKS.email}
            className="inline-flex items-center px-4 py-2 text-sm text-brand-navy hover:text-white hover:bg-brand-navy border-2 border-brand-navy rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
          >
            {CONTACT_LABEL}
          </a>
        </div>
        <p className="text-xs text-neutral-500 mt-4">
          {whenUseful.footnote}
        </p>
      </section>
    </>
  );
}
