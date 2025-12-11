/**
 * Theme Toggle Script
 * Handles dark/light mode switching with system preference detection
 */

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/**
 * Get the initial theme from localStorage or system preference
 */
function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme to the document
 */
function setTheme(theme: Theme): void {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Get current theme from DOM state
 */
function getCurrentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme(): void {
  const currentTheme = getCurrentTheme();
  const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

/**
 * Initialize the theme toggle functionality
 * @param toggleButtonId - The ID of the toggle button element
 */
export function initThemeToggle(toggleButtonId: string): void {
  const themeToggle = document.getElementById(toggleButtonId);

  // Initialize theme
  const initialTheme = getInitialTheme();
  setTheme(initialTheme);

  // Toggle theme on button click
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Listen for system theme changes (only if user hasn't set preference)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

// Auto-initialize for direct script loading
if (typeof document !== 'undefined') {
  initThemeToggle('theme-toggle');
}
