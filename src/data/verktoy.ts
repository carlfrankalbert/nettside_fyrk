/**
 * Verktøy overview page content
 * Single source of truth for the tools listing page
 */

import { EXTERNAL_LINKS, CONTACT_LABEL } from '../utils/links';

export const verktoyPageContent = {
  seo: {
    title: 'Gratis verktøy for produktledere — OKR, konsept og risikoanalyse',
    description: 'Tre AI-støttede verktøy for produktledere i komplekse miljøer. Sjekk OKR-kvalitet, avdekk blindsoner i konseptet ditt, og tenk gjennom hva som kan gå galt — uten innlogging.',
  },
  title: 'Verktøy',
  subtitle: 'Tenk tydeligere før du forplikter deg.',
  tagline: 'Ingen innlogging. Ingen data lagres.',
  sections: [
    {
      heading: 'Refleksjon og analyse',
      tools: [
        {
          name: 'Konseptspeilet',
          description: 'Avdekker blindsoner, implisitte antakelser og logiske hull i produktideen din — før du investerer tid i den.',
          href: '/konseptspeilet',
          cta: 'Speil konseptet ditt',
        },
        {
          name: 'OKR-sjekken',
          description: 'Lim inn OKR-settet ditt og få konkret tilbakemelding på målbarhet, ambisjonsnivå og kobling til Objective — på under ett minutt.',
          href: '/okr-sjekken',
          cta: 'Sjekk OKR-ene dine',
        },
      ],
    },
    {
      heading: 'Risikoanalyse',
      tools: [
        {
          name: 'Pre-Mortem Brief',
          badge: 'Beta',
          description: 'Beskriv en beslutning du vurderer. Få 5–6 konkrete failure modes, tidlige varselsignaler og stopp-kriterier — før det er for sent å snu.',
          href: '/verktoy/pre-mortem',
          cta: 'Generer Pre-Mortem Brief',
        },
      ],
    },
  ],
  disclaimerHtml: '',
  bridgeCTA: {
    heading: 'Vil du ha et menneskelig blikk i tillegg?',
    body: 'Noen beslutninger krever mer enn et verktøy. Jeg tar oppdrag som interim produktleder og coach i regulerte bransjer — og kan gå dypere inn i det du jobber med.',
    primaryLink: { href: '/tjenester', label: 'Se hva jeg tilbyr' },
    secondaryLink: { href: EXTERNAL_LINKS.email, label: CONTACT_LABEL },
  },
} as const;
