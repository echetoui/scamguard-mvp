/**
 * New Design System - ThemeToggle Component
 *
 * A simple switch component to toggle between light and dark themes.
 */
import React, { useState, useEffect } from 'react';
import { toggleTheme, getPersistedTheme } from '../utils/themeManager';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize state based on persisted theme
    setIsDark(getPersistedTheme() === 'dark');
  }, []);

  const handleChange = () => {
    const newTheme = toggleTheme();
    setIsDark(newTheme === 'dark');
  };

  return (
    <label className="ds-theme-toggle" htmlFor="theme-toggle-switch">
      <span className="ds-theme-toggle-label">Dark Mode</span>
      <input
        id="theme-toggle-switch"
        type="checkbox"
        className="ds-theme-toggle-input"
        checked={isDark}
        onChange={handleChange}
      />
      <span className="ds-theme-toggle-slider"></span>
    </label>
  );
};

export default ThemeToggle;
