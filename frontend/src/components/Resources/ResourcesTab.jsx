import React, { useState } from 'react';
import './Resources.css';
import BlockingGuidesSection from './BlockingGuidesSection';
import ByTypeSection from './ByTypeSection';
import SecurityTipsSection from './SecurityTipsSection';
import FAQSection from './FAQSection';
import VideosSection from './VideosSection';
import ExternalLinksSection from './ExternalLinksSection';
import EmergencyPanel from '../EmergencyPanel';

const ResourcesTab = () => {
  const [activeCategory, setActiveCategory] = useState('guides');

  const categories = [
    {
      id: 'urgence',
      label: '🚨 Urgence',
      icon: '🚨',
      title: 'Numéros d\'Urgence'
    },
    {
      id: 'guides',
      label: '🛡️ Guides de Blocage',
      icon: '🛡️',
      title: 'Guides de Blocage'
    },
    {
      id: 'by-type',
      label: '📞 Par Type',
      icon: '📞',
      title: 'Blocage par Type'
    },
    {
      id: 'security',
      label: '🎓 Conseils',
      icon: '🎓',
      title: 'Conseils de Sécurité'
    },
    {
      id: 'videos',
      label: '📹 Vidéos',
      icon: '📹',
      title: 'Vidéos Tutoriels'
    },
    {
      id: 'faq',
      label: '❓ FAQ',
      icon: '❓',
      title: 'Questions Fréquentes'
    },
    {
      id: 'links',
      label: '🔗 Ressources',
      icon: '🔗',
      title: 'Ressources Externes'
    }
  ];

  const renderContent = () => {
    switch (activeCategory) {
      case 'urgence':
        return (
          <div style={{ padding: 'var(--spacing-lg)' }}>
            <EmergencyPanel />
          </div>
        );
      case 'guides':
        return <BlockingGuidesSection />;
      case 'by-type':
        return <ByTypeSection />;
      case 'security':
        return <SecurityTipsSection />;
      case 'videos':
        return <VideosSection />;
      case 'faq':
        return <FAQSection />;
      case 'links':
        return <ExternalLinksSection />;
      default:
        return <BlockingGuidesSection />;
    }
  };

  return (
    <div className="resources-tab">
      {/* Header */}
      <div className="resources-header">
        <h1>🛡️ Protégez-vous</h1>
        <p>Guides pratiques pour bloquer les contacts suspects</p>
      </div>

      {/* Category Navigation */}
      <div className="category-nav">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
            aria-pressed={activeCategory === category.id}
            title={category.title}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-label">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="resources-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default ResourcesTab;
