import React, { useState, memo } from 'react';

const VideosSection = memo(() => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  const videos = [
    {
      id: 'android-blocking',
      title: '🤖 Bloquer sur Android',
      description: 'Guide complet pour bloquer les appels et SMS sur Android',
      duration: '2:15',
      thumbnail: '🤖',
      category: 'Blocage',
      icon: '📺'
    },
    {
      id: 'ios-blocking',
      title: '🍎 Bloquer sur iPhone',
      description: 'Méthodes de blocage sur iOS avec CallKit',
      duration: '2:30',
      thumbnail: '🍎',
      category: 'Blocage',
      icon: '📺'
    },
    {
      id: 'reporting-scam',
      title: '🚨 Signaler un Scam',
      description: 'Comment signaler les arnaques à la police et ScamGuard',
      duration: '3:45',
      thumbnail: '🚨',
      category: 'Signalement',
      icon: '📺'
    },
    {
      id: 'fraud-recovery',
      title: '💳 Récupération après Fraude',
      description: 'Étapes à suivre si vous avez perdu de l\'argent',
      duration: '4:00',
      thumbnail: '💳',
      category: 'Récupération',
      icon: '📺'
    },
    {
      id: 'whatsapp-blocking',
      title: '💚 Bloquer sur WhatsApp',
      description: 'Bloquez les contacts suspects sur WhatsApp',
      duration: '1:45',
      thumbnail: '💚',
      category: 'Apps',
      icon: '📺'
    },
    {
      id: 'common-scams',
      title: '🎯 Arnaques les Plus Courantes',
      description: 'Reconnaître les types d\'arnaques les plus communs',
      duration: '5:30',
      thumbnail: '🎯',
      category: 'Éducation',
      icon: '📺'
    }
  ];

  const categories = ['Tous', ...new Set(videos.map(v => v.category))];

  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const filteredVideos = selectedCategory === 'Tous'
    ? videos
    : videos.filter(v => v.category === selectedCategory);

  return (
    <div className="videos-section">
      <div className="section-intro">
        <h2>📹 Vidéos Tutoriels</h2>
        <p>Apprenez visuellement comment vous protéger</p>
      </div>

      {/* Category Filter */}
      <div className="video-filters">
        {categories.map((category) => (
          <button
            key={category}
            className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="videos-grid">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="video-card"
            onClick={() => setSelectedVideo(video.id)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedVideo(video.id);
              }
            }}
          >
            <div className="video-thumbnail">
              <span className="video-icon">{video.thumbnail}</span>
              <div className="play-button">▶️</div>
              <div className="duration">{video.duration}</div>
            </div>

            <div className="video-content">
              <h4>{video.title}</h4>
              <p>{video.description}</p>
              <span className="video-category">{video.category}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="video-modal" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setSelectedVideo(null)}
              aria-label="Fermer la vidéo"
            >
              ✕
            </button>

            <div className="modal-video">
              <div className="video-placeholder">
                {videos.find(v => v.id === selectedVideo)?.thumbnail}
              </div>
              <p className="placeholder-text">
                🎬 Lecteur vidéo intégré<br/>
                <span className="text-xs text-muted">
                  (Les vidéos seront hébergées sur YouTube ou Vimeo)
                </span>
              </p>
            </div>

            <div className="modal-info">
              <h3>{videos.find(v => v.id === selectedVideo)?.title}</h3>
              <p>{videos.find(v => v.id === selectedVideo)?.description}</p>
              <div className="video-meta">
                <span className="duration-badge">
                  ⏱️ {videos.find(v => v.id === selectedVideo)?.duration}
                </span>
                <span className="category-badge">
                  {videos.find(v => v.id === selectedVideo)?.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="info-box mt-3xl">
        <span className="info-icon">ℹ️</span>
        <div>
          <h4>À Propos des Vidéos</h4>
          <p>
            Ces vidéos tutoriels sont en cours de production. Elles seront
            disponibles en français, anglais et espagnol. Vous pouvez déjà
            consulter nos guides textes dans les autres sections.
          </p>
        </div>
      </div>
    </div>
  );
});

export default VideosSection;
