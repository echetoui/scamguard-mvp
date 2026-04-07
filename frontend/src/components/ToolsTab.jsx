/**
 * ToolsTab Component - Refactored Phase 5D.4
 * Now delegating to EmailBreachChecker and AdvisorVerifier components
 *
 * Features:
 * ✅ Sub-tab navigation (Email / Advisor)
 * ✅ Isolated state management per tool
 * ✅ WCAG AAA accessibility
 */

import React, { useState, useCallback } from 'react';
import EmailBreachChecker from './EmailBreachChecker';
import AdvisorVerifier from './AdvisorVerifier';
import EmergencyPanel from './EmergencyPanel';
import './ToolsTab.css';

export default function ToolsTab() {
  const [activeSubTab, setActiveSubTab] = useState('email');

  // Handle keyboard navigation for tabs (arrow keys)
  const handleTabKeyDown = useCallback((e) => {
    const tabs = ['email', 'advisor', 'emergency'];
    const currentIndex = tabs.indexOf(activeSubTab);

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      let newIndex;
      if (e.key === 'ArrowLeft') {
        newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
      }
      setActiveSubTab(tabs[newIndex]);
      // Focus the newly activated tab button
      setTimeout(() => {
        const buttons = document.querySelectorAll('[role="tab"]');
        if (buttons[newIndex]) buttons[newIndex].focus();
      }, 0);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveSubTab(tabs[0]);
      setTimeout(() => {
        const buttons = document.querySelectorAll('[role="tab"]');
        if (buttons[0]) buttons[0].focus();
      }, 0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveSubTab(tabs[tabs.length - 1]);
      setTimeout(() => {
        const buttons = document.querySelectorAll('[role="tab"]');
        if (buttons[buttons.length - 1]) buttons[buttons.length - 1].focus();
      }, 0);
    }
  }, [activeSubTab]);

  // Memoized tab click handlers
  const handleEmailTabClick = useCallback(() => setActiveSubTab('email'), []);
  const handleAdvisorTabClick = useCallback(() => setActiveSubTab('advisor'), []);
  const handleEmergencyTabClick = useCallback(() => setActiveSubTab('emergency'), []);

  return (
    <div className="tools-tab">
      {/* Header */}
      <div className="tools-header">
        <h1 className="tools-title">🔧 Outils de Vérification</h1>
        <p className="tools-subtitle">Protégez-vous en vérifiant vos risques en ligne</p>
      </div>

      {/* Sub-tab navigation */}
      <div className="sub-tabs-nav" role="tablist">
        <button
          id="email-tab"
          className={`sub-tab-btn ${activeSubTab === 'email' ? 'active' : ''}`}
          onClick={handleEmailTabClick}
          onKeyDown={handleTabKeyDown}
          role="tab"
          aria-selected={activeSubTab === 'email'}
          aria-controls="email-panel"
          tabIndex={activeSubTab === 'email' ? 0 : -1}
        >
          📧 Courriel compromis
        </button>
        <button
          id="advisor-tab"
          className={`sub-tab-btn ${activeSubTab === 'advisor' ? 'active' : ''}`}
          onClick={handleAdvisorTabClick}
          onKeyDown={handleTabKeyDown}
          role="tab"
          aria-selected={activeSubTab === 'advisor'}
          aria-controls="advisor-panel"
          tabIndex={activeSubTab === 'advisor' ? 0 : -1}
        >
          💼 Conseiller autorisé
        </button>
        <button
          id="emergency-tab"
          className={`sub-tab-btn ${activeSubTab === 'emergency' ? 'active' : ''}`}
          onClick={handleEmergencyTabClick}
          onKeyDown={handleTabKeyDown}
          role="tab"
          aria-selected={activeSubTab === 'emergency'}
          aria-controls="emergency-panel"
          tabIndex={activeSubTab === 'emergency' ? 0 : -1}
        >
          🚨 Urgence
        </button>
      </div>

      {/* Email Breach Section */}
      <div
        id="email-panel"
        role="tabpanel"
        aria-labelledby="email-tab"
        hidden={activeSubTab !== 'email'}
        className="sub-tab-panel"
        tabIndex={0}
      >
        <EmailBreachChecker />
      </div>

      {/* Advisor Check Section */}
      <div
        id="advisor-panel"
        role="tabpanel"
        aria-labelledby="advisor-tab"
        hidden={activeSubTab !== 'advisor'}
        className="sub-tab-panel"
        tabIndex={0}
      >
        <AdvisorVerifier />
      </div>

      {/* Emergency Contacts Section */}
      <div
        id="emergency-panel"
        role="tabpanel"
        aria-labelledby="emergency-tab"
        hidden={activeSubTab !== 'emergency'}
        className="sub-tab-panel"
        tabIndex={0}
      >
        <EmergencyPanel onClose={() => setActiveSubTab('email')} />
      </div>
    </div>
  );
}
