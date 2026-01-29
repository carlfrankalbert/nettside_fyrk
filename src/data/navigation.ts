import type { NavItem } from '../types';
import { navLinks } from './landing';

export type { NavItem };

export const mainNavigation: NavItem[] = navLinks.map((link) => ({
  href: link.href,
  label: link.label,
}));
