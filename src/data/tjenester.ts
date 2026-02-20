/**
 * Service page content
 * Single source of truth for all tjenester pages
 */

import { EXTERNAL_LINKS, CONTACT_LABEL } from '../utils/links';

/**
 * Shared CTA block — used by interim and kvalitet pages
 */
export const serviceContactCTA = {
  heading: 'Klar for en samtale?',
  body: 'En kort avklaringssamtale gir raskt svar på om dette er riktig match.',
  buttonHref: EXTERNAL_LINKS.email,
  buttonLabel: CONTACT_LABEL,
  disclaimer: 'Informasjon delt i samtalen behandles konfidensielt.',
  privacyLink: { href: '/personvern', label: 'Les mer om personvern' },
} as const;

/**
 * Tjenester index page
 */
export const tjenesterIndexContent = {
  seo: {
    title: 'Tjenester | FYRK',
    description: 'FYRK tilbyr beslutningsgjennomgang, interim produktledelse og kvalitet- og leveranseledelse. Rådgivning og operativ kapasitet for komplekse miljøer.',
  },
  title: 'Tjenester',
  subtitle: 'Rådgivning før viktige beslutninger — eller operativt ansvar når dere trenger forsterkning.',
  contactBridge: {
    heading: 'Usikker på hva du trenger?',
    body: 'En kort samtale er ofte nok til å avklare. 30 minutter, ingen forpliktelse.',
  },
} as const;

/**
 * Beslutningsgjennomgang service page
 */
export const beslutningsgjennomgangContent = {
  seo: {
    title: 'Beslutningsgjennomgang | FYRK',
    description: 'En strukturert gjennomgang av én konkret beslutning – gir deg et bedre grunnlag for å vurdere veien videre.',
  },
  header: {
    title: 'Beslutningsgjennomgang',
    subtitle: 'Når beslutningen er for viktig til å tas på magefølelse',
  },
  ingress: 'Beslutningsgjennomgang er en strukturert gjennomgang av én konkret beslutning – som gir deg bedre beslutningsgrunnlag før større investeringer eller strategiske forpliktelser.',
  whatYouGet: {
    heading: 'Hva får du?',
    items: [
      'En ekstern gjennomgang av beslutningsgrunnlaget',
      'Kartlegging av antagelser, blindsoner og risiko',
      'Konkrete spørsmål som bør besvares før forpliktelse',
      'Skriftlig oppsummering med funn og anbefalinger',
    ],
  },
  whenRelevant: {
    heading: 'Når er dette relevant?',
    items: [
      'Før større investeringer eller strategiske forpliktelser',
      'Når teamet er enige, men ingen har spurt "hva om vi tar feil?"',
      'Ved beslutningsgjennomgang før strategiske og irreversible valg',
      'Når det er behov for et blikk utenfra',
    ],
  },
  typicalDecisions: {
    heading: 'Typiske beslutninger dette brukes for',
    items: [
      'Skal vi forplikte oss til en ny strategisk retning, teknologi eller satsing?',
      'Skal vi bygge videre på dette initiativet – eller stoppe og endre kurs?',
      'Skal vi låse en organisasjons- eller leveransemodell som blir vanskelig å reversere?',
    ],
    footnote: 'Hvis beslutningen deres ligner på én av disse, er beslutningsgjennomgangen sannsynligvis relevant.',
  },
  howItWorks: {
    heading: 'Hvordan fungerer det?',
    steps: [
      { title: 'Innledende samtale', description: 'Jeg setter meg inn i beslutningen, konteksten og hva som står på spill.' },
      { title: 'Gjennomgang', description: 'Jeg analyserer beslutningsgrunnlaget med etablerte teknikker: pre-mortem (hva kan gå galt?), antakelseskartlegging (hva vet vi egentlig?) og beslutningslogg (hva baserer vi dette på?).' },
      { title: 'Oppsummering', description: 'Du får en skriftlig rapport med funn, risiko og anbefalte neste steg.' },
    ],
    footnoteHtml: 'Du kan prøve noen av disse teknikkene selv – gratis – i <a href="/verktoy" class="text-brand-navy underline hover:text-brand-cyan-darker">verktøy-seksjonen</a>.',
  },
  whatIsOneDecision: {
    heading: 'Hva betyr "én beslutning"?',
    paragraphs: [
      'Én beslutning betyr ett avgrenset valg: "Skal vi kjøpe eller bygge?", "Skal vi satse på dette markedet?", "Skal vi forplikte oss til denne teknologien?"',
      'Det er ikke "Hva bør strategien vår være de neste tre årene?" – det er et komplekst beslutningslandskap. Ved slike tilfeller avtaler vi omfang og pris på forhånd.',
    ],
  },
  pricing: {
    heading: 'Pris',
    body: 'Fast pris avtales etter innledende samtale, basert på beslutningens kompleksitet og omfang.',
    clarification: 'Dette er beslutningsstøtte for ledere når konsekvensene er store. Hvis beslutningen ikke er på riktig nivå, avklarer vi det raskt – uten kostnad.',
    disclaimerHtml: 'Informasjon delt i samtalen behandles konfidensielt og slettes normalt innen 30 dager etter avsluttet oppdrag. Tjenestene er beslutningsstøtte for virksomheter (B2B). Endelige beslutninger tas av kunden. <a href="/personvern" class="underline hover:text-brand-navy">Les mer om personvern</a>.',
  },
} as const;

/**
 * Interim produktleder service page
 */
export const interimContent = {
  seo: {
    title: 'Interim produktleder | FYRK',
    description: 'Senior interim produktleder – operativ fra uke 1. Prioritering, beslutningsstøtte og fremdrift i komplekse miljøer.',
  },
  header: {
    title: 'Interim produktleder',
    subtitle: 'Senior produktledelse når dere trenger det – med verdiskaping fra dag én.',
  },
  whenRelevant: {
    heading: 'Når dette er aktuelt',
    items: [
      'Dere mangler produktleder, eller kapasiteten er sprengt.',
      'Retning og prioritering må strammes inn raskt.',
      'Teamet leverer mye, men effekten er uklar.',
    ],
    footnote: 'Jeg fungerer som interim produktleder på kort varsel for team i endring – enten det handler om omorganisering, vekst eller midlertidig kapasitetsbehov.',
  },
  responsibilities: {
    heading: 'Hva jeg tar ansvar for',
    items: [
      'Prioritering og beslutningsstøtte i hverdagen',
      'Mål, scope og forventningsstyring',
      'Samspill mellom tech, business og stakeholders',
      'Fremdrift uten støy',
    ],
  },
  onboarding: {
    heading: 'Oppstart',
    steps: [
      { title: 'Kort avklaringssamtale', description: 'Vi går gjennom situasjonen og avklarer om det er grunnlag for samarbeid.' },
      { title: 'Rask kartlegging', description: 'Jeg setter meg inn i situasjon, mål og utfordringer.' },
      { title: 'Plan for første 2 uker', description: 'Konkret plan for oppstart og de første leveransene.' },
    ],
  },
  faq: {
    heading: 'Vanlige spørsmål',
    items: [
      { question: 'Hvor raskt kan du starte?', answer: 'Ofte innen 1–2 uker, avhengig av kapasitet. Verdiskapingen begynner umiddelbart – også mens vi venter på tilganger bruker jeg tiden på intervjuer, kartlegging og å forstå konteksten.' },
      { question: 'Jobber du best i team eller alene?', answer: 'Begge deler. Jeg tilpasser meg teamets behov – enten som del av et eksisterende team eller som selvstendig funksjon mot ledelse og stakeholders.' },
      { question: 'Hva er typisk varighet på et interimoppdrag?', answer: 'Vanligvis 3–6 måneder, men det varierer. Jeg har lang erfaring med interim produktledelse i komplekse og regulerte miljøer, der noen oppdrag er kortere og avgrenset, andre strekker seg lengre ved behov.', isLast: true },
    ],
  },
  internalLinkHtml: 'Vurder også <a href="/tjenester/beslutningsgjennomgang" class="text-brand-navy underline hover:text-brand-cyan-darker">Beslutningsgjennomgang</a> hvis dere står foran en viktig beslutning.',
} as const;

/**
 * Kvalitet og leveranseledelse service page
 */
export const kvalitetContent = {
  seo: {
    title: 'Kvalitet og leveranseledelse | FYRK',
    description: 'Kvalitet og leveranseledelse i komplekse miljøer. Mer forutsigbar flyt, færre overraskelser og tydeligere ansvar.',
  },
  header: {
    title: 'Kvalitet og leveranseledelse',
    subtitle: 'Kvalitet og leveranseledelse i komplekse IT-miljøer – med fokus på forutsigbarhet og kontroll.',
  },
  whenRelevant: {
    heading: 'Når dette er aktuelt',
    items: [
      'Feil er dyre, og risiko må håndteres før release.',
      'Leveranser stopper opp i avhengigheter og friksjon.',
      'Kvalitet og flyt er uforutsigbar.',
    ],
  },
  responsibilities: {
    heading: 'Hva jeg tar ansvar for',
    items: [
      'Tydeliggjøre flyt og ansvar i leveranseløpet',
      'Redusere overraskelser med enkel, effektiv kvalitetssikring',
      'Forbedre prioritering, triage og beslutningsflyt',
      'Skape forutsigbarhet uten å senke tempo',
    ],
    footnote: 'Målet er forbedring av leveranseflyt og kvalitet uten å senke tempo – slik at teamet kan levere tryggere og raskere.',
  },
  onboarding: {
    heading: 'Oppstart',
    steps: [
      { title: 'Kort avklaringssamtale', description: 'Vi går gjennom situasjonen og avklarer om det er grunnlag for samarbeid.' },
      { title: 'Rask gjennomgang', description: 'Jeg kartlegger leveranseløp og risikopunkter.' },
      { title: 'Plan for første forbedringer', description: 'Konkret plan med prioriterte tiltak. Første synlige effekt er vanligvis økt transparens – dere ser hvor det stopper opp. Varige forbedringer tar lengre tid.' },
    ],
  },
  whatThisIsNot: {
    heading: 'Hva dette ikke er',
    items: [
      'Ikke en revisjon eller sertifisering (ISO, CMMI, etc.)',
      'Ikke en rapport som legges i en skuff – jeg jobber operativt',
      'Ikke "mer prosess" – målet er å fjerne friksjon, ikke legge til',
    ],
  },
  faq: {
    heading: 'Vanlige spørsmål',
    items: [
      { question: 'Er dette testledelse?', answer: 'Delvis, men bredere. Det handler om hele leveranseløpet – fra prioritering til release – ikke bare test. Målet er forutsigbarhet og kvalitet i hele flyten.' },
      { question: 'Hvordan måler vi effekt?', answer: 'Først kommer transparens – dere ser hvor det stopper opp og hvorfor. Deretter definerer vi enkle, konkrete mål sammen: redusert ledetid, færre blokkerte saker, eller tydeligere ansvarsfordeling. Varige forbedringer krever tid og oppfølging.' },
      { question: 'Passer dette i regulerte miljøer?', answer: 'Ja. Jeg har erfaring fra bank, finans og offentlig sektor, og jobber aktivt med mer forutsigbare leveranser i regulerte og risikoutsatte miljøer der compliance er en del av hverdagen.', isLast: true },
    ],
  },
  internalLinkHtml: 'Hvis dere står foran en vanskelig beslutning, start med <a href="/tjenester/beslutningsgjennomgang" class="text-brand-navy underline hover:text-brand-cyan-darker">Beslutningsgjennomgang</a>.',
} as const;
