/**
 * Verktøy overview page content
 * Single source of truth for the tools listing page
 */

import { EXTERNAL_LINKS, CONTACT_LABEL } from '../utils/links';

export const verktoyPageContent = {
  seo: {
    title: 'Verktøy | FYRK',
    description: 'Arbeidsverktøy for reelle beslutninger i komplekse miljøer. Refleksjon, antakelsesanalyse, beslutningslogg og pre-mortem – gratis og uten innlogging.',
  },
  title: 'Verktøy',
  subtitle: 'Arbeidsverktøy som hjelper deg se tydeligere — raskere — før du forplikter deg.',
  tagline: 'Gratis. Ingen innlogging. Ingen data lagres.',
  sections: [
    {
      heading: 'Refleksjon og analyse',
      tools: [
        { name: 'Konseptspeilet', description: 'Et rolig refleksjonsverktøy for produktkonsepter.', href: '/konseptspeilet', cta: 'Prøv konseptspeilet' },
        { name: 'Antakelseskart', badge: 'Beta', description: 'Avdekker implisitte antakelser i produkt- og strategibeslutninger.', href: '/antakelseskart', cta: 'Prøv antakelseskartet' },
        { name: 'OKR-sjekken', description: 'Få et raskt, strukturert blikk på kvaliteten i OKR-ene deres.', href: '/okr-sjekken', cta: 'Prøv OKR-sjekken' },
      ],
    },
    {
      heading: 'Dokumentasjon og risiko',
      tools: [
        { name: 'Beslutningslogg', badge: 'Beta', description: 'Dokumenter beslutninger med klarhet. Eksporter som Markdown.', href: '/beslutningslogg', cta: 'Lag beslutningslogg' },
        { name: 'Pre-Mortem Brief', badge: 'Beta', description: 'Tenk gjennom hva som kan gå galt før du tar irreversible beslutninger.', href: '/verktoy/pre-mortem', cta: 'Lag Pre-Mortem Brief' },
      ],
    },
  ],
  disclaimerHtml: 'Verktøyene erstatter ikke ansvar, kontekst eller erfaring. De er laget for å gi deg bedre beslutningsgrunnlag — ikke «fasiten». <a href="/personvern" class="underline hover:text-brand-navy">Personvern</a>.',
  bridgeCTA: {
    heading: 'Trenger du dette brukt i praksis?',
    body: 'Hvis beslutningen er viktig, kan jeg også bidra operativt — fra beslutningsgjennomgang til interim produktledelse.',
    primaryLink: { href: '/tjenester', label: 'Se tjenester' },
    secondaryLink: { href: EXTERNAL_LINKS.email, label: CONTACT_LABEL },
  },
} as const;
