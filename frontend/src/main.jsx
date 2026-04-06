import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeTheme } from './utils/themeManager';

// Apply the theme before rendering the app
initializeTheme();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
