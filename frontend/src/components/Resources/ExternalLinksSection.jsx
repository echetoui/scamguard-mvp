import React, { useState } from 'react';
import linksData from '../../data/externalLinks.json';

const ExternalLinksSection = () => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState('police');

  // Get unique countries from emergency data
  const countries = linksData.emergency.map(e => e.country);

  return (
    <div className="external-links-section">
      <div className="section-intro">
        <h2>Ressources Externes</h2>
        <p>Contactez les autorités et organismes officiels</p>
      </div>

      {/* Emergency Contacts */}
      <div className="emergency-section">
        <h3>🆘 Numéros d'Urgence par Pays</h3>
        <div className="emergency-grid">
          {linksData.emergency.map((emergency) => (
            <div
              key={emergency.country}
              className={`emergency-card ${selectedCountry === emergency.country ? 'active' : ''}`}
              onClick={() => setSelectedCountry(
                selectedCountry === emergency.country ? null : emergency.country
              )}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedCountry(
                    selectedCountry === emergency.country ? null : emergency.country
                  );
                }
              }}
            >
              <div className="country-header">
                <h4>{emergency.country}</h4>
              </div>
              {selectedCountry === emergency.country && (
                <div className="emergency-details">
                  <div className="detail-item">
                    <span className="detail-label">📞 Police:</span>
                    <span className="detail-value">{emergency.police}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">🏦 Banque:</span>
                    <span className="detail-value">{emergency.bank}</span>
                  </div>
                  <a
                    href={`https://${emergency.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-link"
                  >
                    📋 Signaler →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resource Categories */}
      <div className="resources-categories">
        {linksData.categories.map((category) => (
          <div key={category.id} className="resource-category">
            <div
              className="category-header-expandable"
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )
              }
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  );
                }
              }}
            >
              <div className="header-content">
                <span className="category-icon">{category.icon}</span>
                <div>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                </div>
              </div>
              <span className={`expand-arrow ${expandedCategory === category.id ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>

            {expandedCategory === category.id && (
              <div className="links-grid">
                {category.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-card"
                  >
                    <div className="link-header">
                      <span className="link-country">{link.country}</span>
                      <span className="link-icon">🔗</span>
                    </div>
                    <h4>{link.organization}</h4>
                    <p>{link.description}</p>
                    <div className="link-url">{link.url}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Important Note */}
      <div className="info-box">
        <span className="info-icon">ℹ️</span>
        <div>
          <h4>Important</h4>
          <p>
            Ces ressources sont officielles et vérifiées. Signalez toujours les
            arnaques auprès des autorités compétentes pour protéger les autres.
            Si vous avez perdu de l'argent, contactez immédiatement votre banque
            et la police.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExternalLinksSection;
