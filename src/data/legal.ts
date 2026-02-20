/**
 * Legal page content
 * Single source of truth for personvern and vilkår pages
 */

export const lastUpdated = 'Februar 2026' as const;

export const personvernContent = {
  seo: {
    title: 'Personvern | Fyrk',
    description: 'Informasjon om hvordan Fyrk behandler personopplysninger.',
  },
  title: 'Personvernerklæring',
  subtitle: 'Slik behandler vi dine opplysninger på fyrk.no',
  sections: [
    {
      heading: 'Om denne nettsiden',
      body: 'Fyrk.no er en nettside som tilbyr informasjon om våre tjenester samt AI-baserte verktøy for OKR-evaluering og konseptanalyse.',
    },
    {
      heading: 'AI-verktøyene',
      body: 'Når du bruker OKR-sjekken, Konseptspeilet eller andre AI-verktøy:',
      bullets: [
        'Teksten du skriver inn sendes kryptert til Anthropic (Claude API) for analyse',
        'Ingen data lagres på våre servere – teksten slettes umiddelbart etter at svaret er generert',
        'Teksten brukes ikke til å trene AI-modeller (vi bruker Anthropic API med zero data retention)',
        'Du trenger ikke logge inn for å bruke verktøyene',
      ],
      callout: {
        label: 'Anbefaling:',
        text: 'Ikke del personopplysninger, forretningshemmeligheter eller annen sensitiv informasjon i teksten du sender inn.',
      },
    },
    {
      heading: 'Anonymisert analyse',
      body: 'Vi samler inn anonymisert bruksstatistikk (sidevisninger, knappeklikk) for å forbedre nettsiden. Denne informasjonen kan ikke spores tilbake til enkeltpersoner.',
    },
    {
      heading: 'Kontakt',
      bodyHtml: 'Har du spørsmål om personvern? Ta kontakt på <a href="mailto:hei@fyrk.no" class="text-brand-cyan-darker hover:text-brand-navy underline underline-offset-2 transition-colors">hei@fyrk.no</a>',
    },
  ],
} as const;

export const vilkarContent = {
  seo: {
    title: 'Vilkår for bruk | Fyrk',
    description: 'Vilkår og betingelser for bruk av Fyrk sine tjenester og verktøy.',
  },
  title: 'Vilkår for bruk',
  subtitle: 'Betingelser for bruk av fyrk.no og tilhørende verktøy',
  sections: [
    {
      heading: '1. Aksept av vilkår',
      body: 'Ved å bruke fyrk.no og tilhørende verktøy aksepterer du disse vilkårene. Hvis du ikke aksepterer vilkårene, ber vi deg om ikke å bruke tjenestene.',
    },
    {
      heading: '2. Beskrivelse av tjenesten',
      body: 'Fyrk tilbyr AI-baserte verktøy for refleksjon og analyse, inkludert:',
      bullets: [
        '<strong>OKR-sjekken</strong> - Vurdering av OKR-kvalitet',
        '<strong>Konseptspeilet</strong> - Refleksjon over produktkonsepter',
        '<strong>Antakelseskartet</strong> - Kartlegging av antakelser',
        '<strong>Beslutningsloggen</strong> - Strukturert dokumentasjon av beslutninger',
      ],
    },
    {
      heading: '3. Viktig ansvarsfraskrivelse',
      isWarning: true,
      boldIntro: 'Verktøyene er ment som støtte til refleksjon og analyse, ikke som fasit eller profesjonell rådgivning.',
      bullets: [
        'AI-genererte analyser kan inneholde feil, unøyaktigheter eller ufullstendig informasjon',
        'Resultatene skal ikke erstatte profesjonell forretnings-, juridisk eller teknisk rådgivning',
        'Du er selv ansvarlig for å validere og vurdere informasjonen før bruk',
        'Beslutninger basert på verktøyenes output er ditt eget ansvar',
      ],
    },
    {
      heading: '4. Ansvarsbegrensning',
      body: 'Tjenestene leveres "som de er" uten garantier av noe slag, verken uttrykte eller underforståtte.',
      bodyAfter: 'Fyrk er ikke ansvarlig for:',
      bullets: [
        'Indirekte tap, følgeskader eller tapt fortjeneste',
        'Tap eller skade som følge av beslutninger basert på verktøyenes output',
        'Tjenesteavbrudd, forsinkelser eller utilgjengelighet',
        'Feil, unøyaktigheter eller mangler i AI-generert innhold',
      ],
    },
    {
      heading: '5. Bruk av tjenesten',
      body: 'Ved bruk av tjenestene forplikter du deg til å:',
      bullets: [
        'Ikke misbruke tjenestene eller forsøke å omgå sikkerhetstiltak',
        'Ikke bruke tjenestene til ulovlige formål',
        'Ikke sende inn innhold som krenker andres rettigheter',
        'Respektere eventuelle bruksbegrensninger (rate limits)',
      ],
    },
    {
      heading: '6. Tredjepartstjenester',
      body: 'Verktøyene bruker tjenester fra tredjeparter:',
      richBullets: [
        {
          html: '<strong>Anthropic (Claude)</strong> - AI-analyse av tekst.',
          link: { href: 'https://www.anthropic.com/legal/consumer-terms', label: 'Se deres vilkår' },
        },
        {
          html: '<strong>Cloudflare</strong> - Infrastruktur og hosting.',
          link: { href: 'https://www.cloudflare.com/terms/', label: 'Se deres vilkår' },
        },
      ],
    },
    {
      heading: '7. Immaterielle rettigheter',
      body: 'Du beholder alle rettigheter til innholdet du sender inn til verktøyene. Fyrk beholder rettighetene til verktøyene, designet og underliggende teknologi.',
    },
    {
      heading: '8. Endringer i vilkårene',
      body: 'Fyrk forbeholder seg retten til å endre disse vilkårene. Vesentlige endringer vil bli kommunisert på nettsiden. Fortsatt bruk etter endringer innebærer aksept av nye vilkår.',
    },
    {
      heading: '9. Lovvalg',
      body: 'Disse vilkårene er underlagt norsk lov. Eventuelle tvister skal søkes løst i minnelighet, og om nødvendig avgjøres av norske domstoler med Oslo tingrett som verneting.',
    },
    {
      heading: '10. Kontakt',
      bodyHtml: 'Har du spørsmål om disse vilkårene? Ta kontakt på <a href="mailto:hei@fyrk.no" class="text-brand-cyan-darker hover:text-brand-navy underline underline-offset-2 transition-colors">hei@fyrk.no</a>',
    },
  ],
} as const;
