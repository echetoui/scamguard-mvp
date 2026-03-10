import React, { memo } from 'react';
import guidesData from '../../data/blockingGuides.json';

const ByTypeSection = memo(() => {
  // Group guides by type
  const types = {
    'appel': { icon: '☎️', label: 'Appels Téléphoniques' },
    'sms': { icon: '💬', label: 'SMS et Messages' },
    'app': { icon: '📱', label: 'Autres Applications' }
  };

  const getGuidesByType = (type) => {
    return guidesData.guides.filter(g => g.type === type);
  };

  return (
    <div className="by-type-section">
      <div className="section-intro">
        <h2>Blocage par Type de Contact</h2>
        <p>Choisissez votre type de communication pour un guide spécifique</p>
      </div>

      <div className="types-container">
        {Object.entries(types).map(([typeKey, typeInfo]) => {
          const guides = getGuidesByType(typeKey);
          if (guides.length === 0) return null;

          return (
            <div key={typeKey} className="type-group">
              <h3 className="type-header">
                <span className="type-icon">{typeInfo.icon}</span>
                {typeInfo.label}
              </h3>
              <div className="type-guides">
                {guides.map((guide) => (
                  <div key={guide.id} className="type-guide-card">
                    <div className="guide-platform">
                      <span className="platform-icon">{guide.icon}</span>
                      <h4>{guide.title}</h4>
                    </div>
                    <p className="guide-summary">{guide.description}</p>
                    <a href={`#guide-${guide.id}`} className="guide-link">
                      Voir le guide →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popular Apps */}
      <div className="popular-apps">
        <h3>Applications Populaires</h3>
        <div className="apps-grid">
          <div className="app-quick-link">
            <div className="app-icon">💚</div>
            <h4>WhatsApp</h4>
            <p>Bloquer sur WhatsApp</p>
          </div>
          <div className="app-quick-link">
            <div className="app-icon">✈️</div>
            <h4>Telegram</h4>
            <p>Bloquer sur Telegram</p>
          </div>
          <div className="app-quick-link">
            <div className="app-icon">👥</div>
            <h4>Messenger</h4>
            <p>Bloquer sur Messenger</p>
          </div>
          <div className="app-quick-link">
            <div className="app-icon">📧</div>
            <h4>Gmail</h4>
            <p>Bloquer emails</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ByTypeSection;
