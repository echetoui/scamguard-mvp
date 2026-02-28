import React, { useState } from 'react';
import guidesData from '../../data/blockingGuides.json';
import GuideCard from './GuideCard';

const BlockingGuidesSection = () => {
  const guides = guidesData.guides;

  // Group guides by platform
  const androidGuides = guides.filter(g => g.platform === 'android');
  const iosGuides = guides.filter(g => g.platform === 'ios');

  return (
    <div className="blocking-guides-section">
      <div className="section-intro">
        <h2>Guides de Blocage Étape par Étape</h2>
        <p>Apprenez à bloquer les numéros suspects sur votre appareil</p>
      </div>

      {/* Android Section */}
      <div className="platform-group">
        <h3 className="platform-title">🤖 Android</h3>
        <div className="guides-grid">
          {androidGuides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </div>

      {/* iOS Section */}
      <div className="platform-group">
        <h3 className="platform-title">🍎 iPhone (iOS)</h3>
        <div className="guides-grid">
          {iosGuides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlockingGuidesSection;
