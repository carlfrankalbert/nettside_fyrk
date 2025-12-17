/**
 * Mobile menu toggle functionality
 * Handles opening/closing mobile navigation menu with proper accessibility
 */

import { ELEMENT_IDS } from '../utils/constants';

/** SVG paths for menu icons */
const ICON_PATHS = {
  hamburger: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />',
  close: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />',
} as const;

/** Labels for accessibility */
const LABELS = {
  open: 'Åpne meny',
  close: 'Lukk meny',
} as const;

interface MobileMenuOptions {
  buttonId?: string;
  menuId?: string;
  updateIcon?: boolean;
  closeOnLinkClick?: boolean;
}

/**
 * Initialize mobile menu with configurable options
 */
export function initMobileMenu(options: MobileMenuOptions = {}): void {
  const {
    buttonId = ELEMENT_IDS.MOBILE_MENU_BUTTON,
    menuId = ELEMENT_IDS.MOBILE_MENU,
    updateIcon = true,
    closeOnLinkClick = true,
  } = options;

  const menuButton = document.getElementById(buttonId);
  const mobileMenu = document.getElementById(menuId);

  if (!menuButton || !mobileMenu) return;

  const toggleMenu = (forceClose = false) => {
    const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
    const newExpandedState = forceClose ? false : !isExpanded;

    menuButton.setAttribute('aria-expanded', String(newExpandedState));
    mobileMenu.classList.toggle('hidden', !newExpandedState);

    // Update icon and aria-label
    if (updateIcon) {
      const icon = menuButton.querySelector('svg');
      if (icon) {
        icon.innerHTML = newExpandedState ? ICON_PATHS.close : ICON_PATHS.hamburger;
      }
    }
    menuButton.setAttribute('aria-label', newExpandedState ? LABELS.close : LABELS.open);

    // Focus management: when opening menu, focus first link
    if (newExpandedState) {
      const firstLink = mobileMenu.querySelector('a');
      if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
      }
    }
  };

  menuButton.addEventListener('click', () => toggleMenu());

  // Close menu when clicking a link
  if (closeOnLinkClick) {
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggleMenu(true));
    });
  }
}

/**
 * Legacy support - initialize with default element IDs
 * @deprecated Use initMobileMenu() with options instead
 */
export function initLegacyMobileMenu(): void {
  initMobileMenu({
    buttonId: 'mobile-menu-button',
    menuId: 'mobile-menu',
  });
}

