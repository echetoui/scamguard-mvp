import React, { useState, memo } from 'react';
import faqData from '../../data/faqData.json';
import FAQItem from './FAQItem';

const FAQSection = memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Filter FAQs based on search query
  const filteredFAQs = faqData.questions.filter((q) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      q.question.toLowerCase().includes(searchLower) ||
      q.answer.toLowerCase().includes(searchLower) ||
      q.category.toLowerCase().includes(searchLower)
    );
  });

  // Group by category
  const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {});

  const categoryLabels = {
    blocage: '🛡️ Blocage',
    signalement: '🚨 Signalement',
    arnaque: '💳 Arnaque Financière',
    'arnaques-communes': '🎯 Arnaques Communes',
    famille: '👨‍👩‍👧‍👦 Famille',
    prévention: '🛡️ Prévention',
    scamguard: '🤖 ScamGuard',
    confidentialité: '🔒 Confidentialité'
  };

  return (
    <div className="faq-section">
      <div className="section-intro">
        <h2>Questions Fréquemment Posées</h2>
        <p>Trouvez les réponses à vos questions sur le blocage et la sécurité</p>
      </div>

      {/* Search Bar */}
      <div className="faq-search">
        <input
          type="text"
          placeholder="Rechercher dans la FAQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          aria-label="Rechercher dans la FAQ"
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* FAQ Items */}
      <div className="faq-container">
        {Object.entries(groupedFAQs).map(([category, items]) => (
          <div key={category} className="faq-category">
            <div
              className="category-header-toggle"
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === category ? null : category
                )
              }
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setExpandedCategory(
                    expandedCategory === category ? null : category
                  );
                }
              }}
            >
              <h3 className="category-title">
                {categoryLabels[category] || category}
              </h3>
              <span className={`category-toggle ${expandedCategory === category ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>
            {expandedCategory === category && (
              <div className="category-items">
                {items.map((faq) => (
                  <FAQItem
                    key={faq.id}
                    faq={faq}
                    isExpanded={expandedId === faq.id}
                    onToggle={() =>
                      setExpandedId(expandedId === faq.id ? null : faq.id)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredFAQs.length === 0 && (
          <div className="no-results">
            <p>Aucune question ne correspond à votre recherche.</p>
            <p>Essayez avec d'autres mots-clés.</p>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="faq-tips">
        <h3>💡 Conseils Rapides</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">📞</div>
            <h4>Blocage Rapide</h4>
            <p>Vous pouvez bloquer n'importe quel numéro en quelques secondes</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🚨</div>
            <h4>Signalement</h4>
            <p>Signalez toujours à la police pour aider les autres</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🔓</div>
            <h4>Déblocage</h4>
            <p>Vous pouvez débloquer un contact à tout moment</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">💳</div>
            <h4>Fraude</h4>
            <p>Si arnaque, contactez votre banque immédiatement</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FAQSection;
