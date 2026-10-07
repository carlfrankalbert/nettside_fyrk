/**
 * Landing page content configuration
 * Centralizes all text content for the landing page
 */

import { EXTERNAL_LINKS, CONTACT_LABEL } from '../utils/links';

/**
 * Navigation links for the landing page
 */
export const navLinks = [
  { href: '/konsulenter', label: 'Konsulenter' },
  { href: '/innsikt', label: 'Innsikt' },
  { href: '/verktoy', label: 'Verktøy' },
  { href: '/#kontakt', label: CONTACT_LABEL, isCta: true },
] as const;

/**
 * Hero section content
 */
export const heroContent = {
  headline: 'Produkt- og leveranseledelse for komplekse og regulerte miljøer',
  description: [
    'FYRK hjelper produktområder i komplekse virksomheter når mange team, avhengigheter og krav gjør prioritering og gjennomføring krevende.',
    'Bistår som interim produktleder eller leveranseleder.',
  ],
  ctaText: 'Ta kontakt',
  ctaHref: EXTERNAL_LINKS.email,
} as const;

/**
 * Why FYRK: short section under hero
 */
export const introContent = {
  title: 'Hvorfor FYRK',
  paragraphs: [
    'Erfaring fra produktledelse, leveranse, teamledelse og kvalitet gjør det mulig å se både hva som bør prioriteres og hva som hindrer organisasjonen i å få det gjennomført.',
    'I regulerte miljøer henger dette tett sammen. Krav, risiko og avhengigheter mellom team avgjør hva som faktisk kan leveres, og når.',
    'Som interim produktleder tar FYRK ansvar for retning og prioritering i et produktområde. Som leveranseleder tar FYRK ansvar for at teamene får levert det som er bestemt. Begge rollene er operative.',
  ],
} as const;

/**
 * Contributions section: what FYRK delivers
 */
export const contributionsContent = {
  title: 'Hva FYRK bidrar med',
  intro: 'FYRK tar oppdrag som interim produktleder eller leveranseleder.',
  items: [
    'Produktledelse i komplekse miljøer',
    'Strukturering av roadmap og prioriteringer',
    'Bedre flyt mellom produkt, teknologi og forretning',
    'Leveranseplan, kapasitet og oppfølging på tvers av team',
    'Fremdrift i arbeid med mange avhengigheter',
    'Kvalitet og risiko som del av leveransen',
  ],
} as const;

/**
 * When FYRK fits: situational fit
 */
export const whenFitsContent = {
  title: 'Når FYRK passer',
  statement: 'FYRK passer best når produktmiljøet har mange flinke folk, men for lav fremdrift.',
  lead: 'FYRK er særlig relevant når:',
  items: [
    'flere team og avhengigheter gjør prioritering vanskelig',
    'mye er i gang, men for lite blir ferdig',
    'ansvar og beslutninger er uklare',
    'kvalitet, risiko eller regulatoriske krav gjør leveransene mer krevende',
    'et produktområde trenger en erfaren produktleder eller leveranseleder som raskt kan gå inn operativt',
  ],
} as const;

/**
 * Contact section content
 */
export const contactContent = {
  title: 'Kontakt FYRK',
  description: 'Har dere et produktområde der fremdriften stopper opp mellom prioriteringer, avhengigheter og beslutninger? En kort samtale er ofte nok til å avklare om det er en match.',
  emailHref: EXTERNAL_LINKS.email,
  emailLabel: 'Send e-post',
  linkedinHref: EXTERNAL_LINKS.linkedinPersonal,
  linkedinLabel: 'LinkedIn',
} as const;

/**
 * FAQ section content
 */
export const faqContent = {
  title: 'Vanlige spørsmål',
  items: [
    {
      question: 'Hva hjelper FYRK med?',
      answer: 'FYRK hjelper produktområder med struktur, prioritering og fremdrift når mange team, avhengigheter og beslutninger påvirker arbeidet.',
    },
    {
      question: 'Når passer FYRK best?',
      answer: 'FYRK passer best i komplekse produktmiljøer der flinke folk har lav fremdrift fordi prioriteringer, avhengigheter eller beslutninger er uklare.',
    },
    {
      question: 'Jobber FYRK som interim produktleder?',
      answer: 'Ja. FYRK tar oppdrag som interim produktleder eller leveranseleder.',
    },
    {
      question: 'Hvilke virksomheter passer FYRK for?',
      answer: 'Komplekse og regulerte virksomheter med digitale produkter, flere team og høye krav til kvalitet og gjennomføring, for eksempel innen bank og finans, forsikring og offentlig sektor.',
    },
  ],
} as const;

/**
 * Footer navigation links
 */
export const footerNavLinks = [
  { href: '/konsulenter', label: 'Konsulenter' },
  { href: '/innsikt', label: 'Innsikt' },
  { href: '/verktoy', label: 'Verktøy' },
  { href: EXTERNAL_LINKS.linkedin, label: 'LinkedIn', external: true },
  { href: '/personvern', label: 'Personvern' },
  { href: '/vilkar', label: 'Vilkår' },
] as const;

/**
 * Footer content
 */
export const footerContent = {
  orgNumber: '936 630 898',
  registration: 'Godkjent bemanningsforetak',
} as const;
