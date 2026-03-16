/**
 * Theme Manager Utility
 *
 * Provides functions to manage the application's theme (light/dark mode).
 * Persists the user's choice in localStorage.
 */

const THEME_STORAGE_KEY = 'scamguard-theme';

/**
 * Applies the theme by setting the 'data-theme' attribute on the body.
 * @param {'light' | 'dark'} theme - The theme to apply.
 */
const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
  } else {
    document.body.removeAttribute('data-theme');
  }
};

/**
 * Gets the persisted theme from localStorage.
 * Defaults to 'light' if no theme is set.
 * @returns {'light' | 'dark'}
 */
export const getPersistedTheme = () => {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'light';
};

/**
 * Toggles the theme between 'light' and 'dark', applies it,
 * and persists the new theme in localStorage.
 * @returns {'light' | 'dark'} The new theme.
 */
export const toggleTheme = () => {
  const currentTheme = getPersistedTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  applyTheme(newTheme);

  return newTheme;
};

/**
 * Initializes the theme based on the persisted value in localStorage.
 * Should be called once when the application loads.
 */
export const initializeTheme = () => {
  const persistedTheme = getPersistedTheme();
  applyTheme(persistedTheme);
};
