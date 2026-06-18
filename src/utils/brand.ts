/**
 * Brand constants — single source of truth for FYRK identity.
 *
 * Use BRAND.name everywhere the brand name is rendered so a casing
 * change (e.g. FYRK vs Fyrk) lands in one place. URL-prefixed forms
 * (mailto:, full URLs) live in utils/links.ts.
 */

export const BRAND = {
  name: 'FYRK',
  url: 'https://fyrk.no',
  description:
    'FYRK bistår komplekse og regulerte produktmiljøer med prioritering, roadmap, avhengigheter og fremdrift.',
  email: 'hei@fyrk.no',
  phone: '+47 929 11 929',
  orgNumber: '936 630 898',
  address: {
    streetAddress: 'c/o Mesh Youngstorget, Møllergata 6',
    postalCode: '0179',
    addressLocality: 'Oslo',
    addressCountry: 'NO',
  },
  logo: '/fyrk-logo-primary-navy.svg',
  ogImage: '/og-image.png',
  locale: 'nb_NO',
  inLanguage: 'nb-NO',
} as const;
