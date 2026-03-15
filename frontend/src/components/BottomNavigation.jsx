import React, { useState } from 'react';
import './BottomNavigation.css';

/**
 * Bottom Navigation - Phase 3.1.2
 *
 * Senior-First sticky bottom navigation with 4 main tabs:
 * 1. Vérifier (🔍) - SMS/message analysis
 * 2. Sécurité (❤️) - Security score and status
 * 3. Académie (🎓) - Learning modules and quizzes
 * 4. Paramètres (⚙️) - Settings and profile
 *
 * Features:
 * - Sticky at bottom of screen
 * - Each tab full-screen (no dual pane)
 * - Icon + label both visible
 * - Active tab highlighted with underline
 * - Swipeable left-right on mobile
 * - Touch targets 60px minimum
 * - WCAG AAA accessibility
 * - Senior-friendly design
 *
 * @component
 * @param {string} activeTab - Currently active tab
 * @param {function} onTabChange - Callback when tab changes
 * @returns {JSX.Element} Bottom navigation bar
 */
const BottomNavigation = ({ activeTab = 'securite', onTabChange, hasFamily = false }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const tabs = [
    {
      id: 'verifier',
      label: 'Vérifier',
      icon: '🔍',
      description: 'Analyser un message ou une photo',
      route: '/verify'
    },
    {
      id: 'securite',
      label: 'Sécurité',
      icon: '❤️',
      description: 'Votre score de sécurité',
      route: '/security'
    },
    {
      id: 'academie',
      label: 'Académie',
      icon: '🎓',
      description: 'Apprenez et gagnez des récompenses',
      route: '/academy'
    },
    {
      id: 'ressources',
      label: 'Ressources',
      icon: '📚',
      description: 'Guides de blocage et conseils de sécurité',
      route: '/resources'
    },
    {
      id: 'outils',
      label: 'Outils',
      icon: '🔧',
      description: 'Vérifier courriel ou conseiller',
      route: '/tools'
    },
    {
      id: 'menaces',
      label: 'Menaces',
      icon: '🚨',
      description: 'Menaces actuelles et alertes',
      route: '/threats'
    },
    ...(hasFamily ? [{
      id: 'famille',
      label: 'Famille',
      icon: '👨‍👩‍👧‍👦',
      description: 'Votre groupe familial',
      route: '/family'
    }] : []),
    {
      id: 'parametres',
      label: 'Paramètres',
      icon: '⚙️',
      description: 'Vos paramètres et profil',
      route: '/settings'
    }
  ];

  // Handle swipe navigation on mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
      let newIndex = currentIndex;

      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        newIndex = currentIndex + 1;
      } else if (isRightSwipe && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }

      if (newIndex !== currentIndex) {
        onTabChange(tabs[newIndex].id);
      }
    }
  };

  const handleKeyDown = (e, tabId) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);

    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      e.preventDefault();
      onTabChange(tabs[currentIndex - 1].id);
    } else if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
      e.preventDefault();
      onTabChange(tabs[currentIndex + 1].id);
    }
  };

  return (
    <nav
      className="bottom-navigation"
      role="tablist"
      aria-label="Navigation principale"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {tabs.map((tab) => (
        <button
          id={`tab-${tab.id}`}
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          title={tab.description}
          aria-label={`${tab.label}. ${tab.description}`}
        >
          {/* Icon */}
          <span className="nav-icon" aria-hidden="true">
            {tab.icon}
          </span>

          {/* Label */}
          <span className="nav-label">{tab.label}</span>

          {/* Active indicator */}
          {activeTab === tab.id && (
            <span className="active-indicator" aria-hidden="true"></span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default BottomNavigation;

/**
 * TabPanel Component
 * Renders the content for each tab
 *
 * @component
 * @param {string} tabId - Tab identifier
 * @param {string} activeTab - Currently active tab
 * @param {JSX.Element} children - Tab content
 * @returns {JSX.Element} Tab panel
 */
export const TabPanel = ({ tabId, activeTab, children }) => {
  return (
    <div
      id={`${tabId}-panel`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      hidden={activeTab !== tabId}
      className={`tab-panel ${activeTab === tabId ? 'active' : ''}`}
    >
      {children}
    </div>
  );
};

/**
 * NavigationLayout Component
 * Main layout wrapper that manages bottom navigation
 *
 * @component
 * @param {JSX.Element} children - Page content
 * @returns {JSX.Element} Full layout with navigation
 */
export const NavigationLayout = ({ children }) => {
  const [activeTab, setActiveTab] = React.useState('securite');

  return (
    <div className="navigation-layout">
      <main className="navigation-content">{children}</main>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
