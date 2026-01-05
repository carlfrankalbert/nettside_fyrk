import KonseptSpeil from './KonseptSpeil';

/**
 * Konseptspeil Page Content component
 */
export default function KonseptSpeilPageContent() {
  return (
    <>
      {/* Input + CTA */}
      <section className="mb-10">
        <KonseptSpeil />
      </section>

      {/* Når er dette nyttig + Kontakt */}
      <section className="pt-6 border-t border-neutral-200" aria-labelledby="more-info-heading">
        <h2 id="more-info-heading" className="text-lg font-semibold text-brand-navy mb-3">
          Når er dette nyttig?
        </h2>
        <ul className="text-neutral-600 space-y-1.5 text-sm mb-6" role="list">
          <li className="flex items-start gap-2">
            <span className="text-neutral-500" aria-hidden="true">•</span>
            <span>Før du presenterer en idé, for å forstå hvilke kritiske spørsmål som kan komme</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neutral-500" aria-hidden="true">•</span>
            <span>Når du vil tenke høyt i en tidlig fase uten å forplikte deg</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neutral-500" aria-hidden="true">•</span>
            <span>Når du vil skille tydeligere mellom det du faktisk vet og det du tror</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neutral-500" aria-hidden="true">•</span>
            <span>Som forberedelse til samtaler med kolleger, ledere eller interessenter</span>
          </li>
        </ul>

        <div className="mt-6 p-4 bg-brand-cyan-lightest/30 border border-brand-cyan/20 rounded-lg">
          <p className="text-sm font-medium text-brand-navy mb-3">
            Vil du ha hjelp til å ta konseptet videre?
          </p>
          <a
            href="mailto:hei@fyrk.no"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-navy hover:bg-brand-navy/90 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
          >
            <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Ta kontakt med FYRK
          </a>
        </div>
        <p className="text-xs text-neutral-500 mt-4">
          Konseptspeilet er laget av FYRK som et supplement til rådgivning.
        </p>
      </section>
    </>
  );
}
