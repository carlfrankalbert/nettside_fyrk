import type { NavItem } from '../types';

export const mainNavigation: NavItem[] = [
  { href: '/', label: 'Hjem' },
  { href: '/om', label: 'Om oss' },
  { href: '/blogg', label: 'Blogg' },
  { href: '/kontakt', label: 'Kontakt', isPrimary: true },
];

