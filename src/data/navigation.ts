export const mainNavigation = [
  { href: '/', label: 'Hjem' },
  { href: '/om', label: 'Om oss' },
  { href: '/blogg', label: 'Blogg' },
  { href: '/kontakt', label: 'Kontakt', isPrimary: true },
] as const;

export type NavItem = typeof mainNavigation[number];

