import KonseptSpeil from './KonseptSpeil';

/**
 * Konseptspeil Page Content component
 * Wraps the main KonseptSpeil component and adds contextual sections
 */
export default function KonseptSpeilPageContent() {
  return (
    <>
      {/* Main input and reflection tool */}
      <KonseptSpeil />

      {/* Contact CTA - visible after scrolling */}
      <section className="mt-12 p-6 bg-brand-cyan-lightest/40 border border-brand-cyan/20 rounded-xl">
        <h2 className="text-lg font-bold text-brand-navy mb-2">
          Vil du gå dypere?
        </h2>
        <p className="text-base text-neutral-700 mb-4">
          Konseptspeilet er et første steg. For å utforske videre med en erfaren produktleder:
        </p>
        <a
          href="mailto:hei@fyrk.no"
          className="inline-flex items-center gap-2 px-5 py-3 text-base font-semibold text-white bg-brand-navy hover:bg-brand-navy/90 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
        >
          <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Ta kontakt med FYRK
        </a>
      </section>
    </>
  );
}
