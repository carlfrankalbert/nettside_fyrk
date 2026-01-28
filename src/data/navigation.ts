import type { NavItem } from '../types';

export type { NavItem };

export const mainNavigation: NavItem[] = [
  { href: '/', label: 'Hjem' },
  { href: '/#tjenester', label: 'Tjenester' },
  { href: '/#om', label: 'Om' },
  { href: '/#verktoy', label: 'Verktøy' },
  { href: '/#kontakt', label: 'Kontakt', isPrimary: true },
];

