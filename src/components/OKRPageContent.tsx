import { useState } from 'react';
import OKRReviewer from './OKRReviewer';

/**
 * OKR Page Content component
 * Manages the visibility of the example section based on result state
 */
export default function OKRPageContent() {
  const [hasResult, setHasResult] = useState(false);

  return (
    <>
      {/* Input + CTA */}
      <section className="mb-10">
        <OKRReviewer onResultGenerated={setHasResult} />
      </section>

      {/* Eksempel på vurdering - hidden when result is generated */}
      {!hasResult && (
        <section className="mb-12" aria-labelledby="example-heading">
          <h2 id="example-heading" className="text-lg font-semibold text-brand-navy mb-3">
            Eksempel på vurdering
          </h2>
          <p className="text-neutral-600 mb-4 text-sm">Utdrag fra en typisk OKR-vurdering:</p>
          <div className="p-5 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-700 text-sm space-y-2">
            <p>– Objective er retningsgivende, men mangler målbart utfall.</p>
            <p>– KR1 og KR2 er aktiviteter, ikke resultater.</p>
            <p>– KR3 er målbart, men "5 poeng" kan være for lite ambisiøst.</p>
            <p className="font-medium">
              – Forslag: Reformuler til "Øke andelen brukere som fullfører onboarding fra 45 % til 70 %."
            </p>
          </div>
        </section>
      )}

      {/* Når er dette nyttig */}
      <section className="mb-12" aria-labelledby="when-useful-heading">
        <h2 id="when-useful-heading" className="text-lg font-semibold text-brand-navy mb-3">
          Når er OKR-sjekken nyttig?
        </h2>
        <ul className="text-neutral-600 space-y-2 text-sm" role="list">
          <li className="flex items-start gap-2">
            <span className="text-neutral-400" aria-hidden="true">•</span>
            <span>Dere står foran en ny OKR-periode og vil ha en rask kvalitetskontroll</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neutral-400" aria-hidden="true">•</span>
            <span>OKR-ene har begynt å ligne mer på en oppgaveliste enn et målbilde</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neutral-400" aria-hidden="true">•</span>
            <span>Teamet er uenig om hva som egentlig er målet</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neutral-400" aria-hidden="true">•</span>
            <span>Du trenger et nøytralt utgangspunkt for en bedre diskusjon</span>
          </li>
        </ul>
      </section>

      {/* Menneskelig oppfølging */}
      <section className="pt-8 border-t border-neutral-200" aria-labelledby="human-review-heading">
        <h2 id="human-review-heading" className="text-lg font-semibold text-brand-navy mb-3">
          Ønsker du et menneskelig blikk i tillegg?
        </h2>
        <p className="text-neutral-600 text-sm mb-4">
          OKR-sjekken er ment som et første steg. Hvis du vil diskutere OKR-ene dine videre,
          eller jobbe mer systematisk med prioritering og produktledelse, er du velkommen til å ta kontakt.
        </p>
        <a
          href="mailto:hei@fyrk.no"
          className="inline-flex items-center gap-2 px-4 py-2 text-brand-navy hover:text-white hover:bg-brand-navy border-2 border-brand-navy rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan-darker focus:ring-offset-2"
          aria-label="Send e-post til FYRK for personlig rådgivning"
        >
          <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Ta kontakt med FYRK
        </a>
        <p className="text-xs text-neutral-400 mt-4">
          OKR-sjekken er et lite verktøy laget av FYRK som et eksperiment og supplement til rådgivning og sparring.
        </p>
      </section>
    </>
  );
}
