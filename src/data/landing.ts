/**
 * Landing page content configuration
 * Centralizes all text content for the landing page
 */

import { EXTERNAL_LINKS } from '../utils/links';
import { PAGE_ROUTES } from '../utils/constants';

/**
 * Navigation links for the landing page
 */
export const navLinks = [
  { href: '#om', label: 'Om' },
  { href: '#erfaring', label: 'Erfaring' },
  { href: '#verktoy', label: 'Verktøy' },
  { href: '#kontakt', label: 'Kontakt' },
] as const;

/**
 * Hero section content
 */
export const heroContent = {
  tagline: 'Når hverdagen er kompleks og kravene mange',
  headline: 'Produktledelse som gjør strategi til handling',
  description: 'FYRK hjelper team som vil levere, ikke bare planlegge. Med struktur som tåler endringer uten å miste fart.',
  ctaText: 'Ta en uforpliktende prat',
  ctaHref: '#kontakt',
} as const;

/**
 * Situations where FYRK can help
 */
export const situationsContent = {
  title: 'FYRK hjelper når',
  situations: [
    'Teamet har mange parallelle initiativer og mangler retning',
    'Strategi ligger i dokumenter, men ikke i hverdagen',
    'Smidige metoder følges som seremonier uten effekt',
    'Kvalitet lider fordi QA kommer for sent i prosessen',
  ],
} as const;

/**
 * Core competencies section content
 */
export const competenciesContent = {
  title: 'Kjernekompetanse',
  competencies: [
    {
      title: 'Produktledelse',
      description: 'Prioritering, strategi og roadmap som gir teamet retning – slik at dere slipper å diskutere hva som er viktigst hver uke.',
      iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      title: 'Prosessledelse',
      description: 'Arbeidsformer som fjerner flaskehalser og skaper forutsigbarhet. Ikke flere seremonier, men bedre flyt.',
      iconPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
    {
      title: 'Kvalitetsledelse',
      description: 'Kvalitet bygget inn fra start, ikke testet inn til slutt. Færre overraskelser, tryggere leveranser.',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ],
} as const;

/**
 * Experience section content
 */
export const experienceContent = {
  title: 'Erfaring',
  summary: '15+ års erfaring fra produktledelse, prosessledelse og kvalitetsledelse i bank, fintech og regulerte bransjer. Tidligere roller inkluderer SpareBank 1, Vipps, Varner og Domstolsadministrasjonen.',
  expandButtonText: 'Les mer',
  collapseButtonText: 'Vis mindre',
  experiences: [
    {
      company: 'SpareBank 1 – Mobilbank Bedrift',
      description: 'Tok over som produktleder januar 2024. Innførte tydeligere OKR-er, skjermet teamet fra forstyrrelser, og prioriterte ned parallelle initiativer. Teamet leverte biometrisk signering av betalinger – en nøkkelfunksjon som bidro til nær dobling av aktive brukere på halvannet år.',
    },
    {
      company: 'Varner',
      description: 'Bygget opp testpraksis på tvers av fire team uten dedikerte testressurser. Etablerte felles rammeverk og filosofi, men lot hvert team tilpasse til sin kontekst. Resultatet var parallell testing uten flaskehalser.',
    },
    {
      company: 'Vipps',
      description: 'Strømlinjeformet testprosessen for mobilplattformene. Flyttet testing fra overlevering til kontinuerlig samarbeid mellom utviklere og testere på samme PR – kortere feedback-loop og bedre flyt.',
    },
    {
      company: 'Domstolsadministrasjonen',
      description: 'Testleder for akseptansetesting av saksbehandlingssystem. Rådga om teststrategi for kontinuerlig deployment i offentlig sektor.',
    },
  ],
} as const;

/**
 * About section content (Carl Johnson)
 */
export const aboutContent = {
  title: 'Om Carl Johnson',
  paragraphs: [
    'Jeg hjelper team med å gå fra friksjon til flyt. Det betyr færre overleveringer, mindre rapportering, og mer synlighet – slik at folk kan bruke tiden på det som skaper verdi.',
    'Med 15+ års erfaring fra bank, fintech og regulerte bransjer har jeg sett hva som bremser team: uklare prioriteringer, tunge prosesser, og informasjon som sitter fast hos enkeltpersoner. Jeg jobber for det motsatte – transparens, korte feedback-loops, og fokus på det som faktisk betyr noe.',
  ],
  aiNote: 'AI brukes aktivt som verktøy for research, idétesting og raskere problemløsning.',
} as const;

/**
 * Testimonials section content
 */
export const testimonialsContent = {
  title: 'Hva tidligere kollegaer sier',
  testimonials: [
    {
      quote: 'Han er tydelig, konkret, robust og god til å kommunisere med utviklingsteamet og interessenter rundt teamet.',
      role: 'Utviklingsleder',
      company: 'SpareBank 1',
    },
    {
      quote: 'Han har god forretningsforståelse og teft, i tillegg til sterk intuisjon og forståelse av smidige prosesser.',
      role: 'Teamleder',
      company: 'SpareBank 1',
    },
  ],
} as const;

/**
 * Tools section content
 */
export const toolsContent = {
  title: 'Verktøy',
  description: 'Praktiske verktøy for bedre arbeid med strategi og mål.',
  tools: [
    {
      title: 'OKR-sjekken',
      description: 'Få et raskt, strukturert blikk på kvaliteten i OKR-ene deres. Uten workshop, styringsgrupper eller lange dokumenter.',
      href: PAGE_ROUTES.OKR_REVIEWER,
      buttonText: 'Prøv OKR-sjekken',
    },
  ],
  comingSoonText: 'Flere verktøy er på vei. Følg med.',
} as const;

/**
 * Contact section content
 */
export const contactContent = {
  title: 'Ta kontakt',
  description: 'Usikker på hvor du skal starte? En kort samtale avklarer raskt om det er grunnlag for samarbeid. Helt uforpliktende. Ingen salg, bare avklaring.',
  subtitle: '',
  emailHref: EXTERNAL_LINKS.email,
  emailLabel: 'hei@fyrk.no',
  linkedinHref: EXTERNAL_LINKS.linkedin,
  linkedinLabel: 'LinkedIn',
} as const;

/**
 * Footer content
 */
export const footerContent = {
  address: 'c/o MSM, Møllergata 6, 0179 Oslo',
  orgNumber: '930 630 898',
  emailHref: EXTERNAL_LINKS.email,
  emailLabel: 'Kontakt',
  linkedinHref: EXTERNAL_LINKS.linkedin,
  linkedinLabel: 'LinkedIn',
} as const;
