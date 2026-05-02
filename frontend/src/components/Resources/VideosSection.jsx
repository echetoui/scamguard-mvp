import React, { useEffect, useRef, useState, memo } from 'react';

const VideosSection = memo(() => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const closeButtonRef = useRef(null);
  const modalContentRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

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

  const openVideo = (videoId) => {
    previouslyFocusedRef.current = document.activeElement;
    setSelectedVideo(videoId);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    previouslyFocusedRef.current?.focus?.();
  };

  useEffect(() => {
    if (!selectedVideo) return undefined;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeVideo();
        return;
      }

      if (event.key === 'Tab' && modalContentRef.current) {
        const focusable = modalContentRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first || !last) return;

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedVideo]);

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
          <button
            type="button"
            key={video.id}
            className="video-card"
            role="button"
            tabIndex={0}
            onClick={() => openVideo(video.id)}
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
          </button>
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="video-modal" onClick={closeVideo}>
          <div
            ref={modalContentRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-modal-title"
          >
            <button
              ref={closeButtonRef}
              className="close-btn"
              onClick={closeVideo}
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
              <h3 id="video-modal-title">{videos.find(v => v.id === selectedVideo)?.title}</h3>
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
