/**
 * Mobile menu toggle functionality
 * Handles opening/closing mobile navigation menu with proper accessibility
 */

export function initMobileMenu(): void {
  const menuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (!menuButton || !mobileMenu) return;
  
  menuButton.addEventListener('click', () => {
    const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
    const newExpandedState = !isExpanded;
    
    menuButton.setAttribute('aria-expanded', String(newExpandedState));
    mobileMenu.classList.toggle('hidden');
    
    // Update icon and aria-label
    const icon = menuButton.querySelector('svg');
    if (icon) {
      if (newExpandedState) {
        // Show close icon
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />';
        menuButton.setAttribute('aria-label', 'Lukk meny');
      } else {
        // Show hamburger icon
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />';
        menuButton.setAttribute('aria-label', 'Åpne meny');
      }
    }
    
    // Focus management: when opening menu, focus first link
    if (newExpandedState) {
      const firstLink = mobileMenu.querySelector('a');
      if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
      }
    }
  });
}

