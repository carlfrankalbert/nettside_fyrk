export interface NavItem {
  href: string;
  label: string;
  isPrimary?: boolean;
}

export const mainNavigation: NavItem[] = [
  { href: '/', label: 'Hjem' },
  { href: '/om', label: 'Om oss' },
  { href: '/blogg', label: 'Blogg' },
  { href: '/kontakt', label: 'Kontakt', isPrimary: true },
];

