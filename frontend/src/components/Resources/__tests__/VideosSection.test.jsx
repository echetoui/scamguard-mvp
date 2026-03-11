/**
 * VideosSection Component Tests
 * Tests for video tutorials with category filtering and modal playback
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VideosSection from '../VideosSection';

describe('VideosSection Component', () => {
  describe('Rendering', () => {
    it('should render main section container', () => {
      const { container } = render(<VideosSection />);
      expect(container.querySelector('.videos-section')).toBeTruthy();
    });

    it('should display section title', () => {
      render(<VideosSection />);
      expect(screen.getByText('📹 Vidéos Tutoriels')).toBeTruthy();
    });

    it('should display section subtitle', () => {
      render(<VideosSection />);
      expect(screen.getByText('Apprenez visuellement comment vous protéger')).toBeTruthy();
    });

    it('should have section intro', () => {
      const { container } = render(<VideosSection />);
      expect(container.querySelector('.section-intro')).toBeTruthy();
    });

    it('should render h2 for section title', () => {
      const { container } = render(<VideosSection />);
      const h2 = container.querySelector('.section-intro h2');
      expect(h2).toBeTruthy();
      expect(h2.textContent).toContain('Vidéos Tutoriels');
    });
  });

  describe('Video Filters', () => {
    it('should render filter buttons container', () => {
      const { container } = render(<VideosSection />);
      expect(container.querySelector('.video-filters')).toBeTruthy();
    });

    it('should display "Tous" filter button', () => {
      const { container } = render(<VideosSection />);
      const buttons = container.querySelectorAll('.filter-btn');
      const tousButton = Array.from(buttons).find(btn => btn.textContent === 'Tous');
      expect(tousButton).toBeTruthy();
    });

    it('should display category filter buttons', () => {
      const { container } = render(<VideosSection />);
      const buttons = container.querySelectorAll('.video-filters .filter-btn');
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent);
      expect(buttonTexts).toContain('Blocage');
      expect(buttonTexts).toContain('Signalement');
      expect(buttonTexts).toContain('Récupération');
    });

    it('should have "Tous" button active by default', () => {
      const { container } = render(<VideosSection />);
      const tousButton = Array.from(container.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent === 'Tous');
      expect(tousButton.className).toContain('active');
    });

    it('should mark category button as active when clicked', () => {
      const { container } = render(<VideosSection />);
      const blocageButton = Array.from(container.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent === 'Blocage');

      fireEvent.click(blocageButton);
      expect(blocageButton.className).toContain('active');
    });
  });

  describe('Videos Grid', () => {
    it('should render videos grid container', () => {
      const { container } = render(<VideosSection />);
      expect(container.querySelector('.videos-grid')).toBeTruthy();
    });

    it('should display all videos initially', () => {
      const { container } = render(<VideosSection />);
      const videoCards = container.querySelectorAll('.video-card');
      expect(videoCards.length).toBe(6);
    });

    it('should display video titles', () => {
      render(<VideosSection />);
      expect(screen.getByText(/Bloquer sur Android/)).toBeTruthy();
      expect(screen.getByText(/Bloquer sur iPhone/)).toBeTruthy();
      expect(screen.getByText(/Signaler un Scam/)).toBeTruthy();
    });

    it('should display video descriptions', () => {
      render(<VideosSection />);
      expect(screen.getByText(/Guide complet pour bloquer/)).toBeTruthy();
      expect(screen.getByText(/Méthodes de blocage sur iOS/)).toBeTruthy();
    });

    it('should display video durations', () => {
      render(<VideosSection />);
      expect(screen.getByText('2:15')).toBeTruthy();
      expect(screen.getByText('2:30')).toBeTruthy();
      expect(screen.getByText('3:45')).toBeTruthy();
    });

    it('should display video categories on cards', () => {
      const { container } = render(<VideosSection />);
      const categorySpans = container.querySelectorAll('.video-category');
      expect(categorySpans.length).toBeGreaterThan(0);
    });
  });

  describe('Video Cards Structure', () => {
    it('should have proper video card structure', () => {
      const { container } = render(<VideosSection />);
      const videoCard = container.querySelector('.video-card');
      expect(videoCard.querySelector('.video-thumbnail')).toBeTruthy();
      expect(videoCard.querySelector('.video-content')).toBeTruthy();
    });

    it('should display video thumbnails', () => {
      const { container } = render(<VideosSection />);
      const thumbnails = container.querySelectorAll('.video-icon');
      expect(thumbnails.length).toBeGreaterThan(0);
      expect(thumbnails[0].textContent).toBe('🤖');
    });

    it('should display play button on video cards', () => {
      const { container } = render(<VideosSection />);
      const playButtons = container.querySelectorAll('.play-button');
      expect(playButtons.length).toBeGreaterThan(0);
      expect(playButtons[0].textContent).toBe('▶️');
    });

    it('should display duration badge on video cards', () => {
      const { container } = render(<VideosSection />);
      const durations = container.querySelectorAll('.duration');
      expect(durations.length).toBeGreaterThan(0);
    });

    it('should have h4 for video titles', () => {
      const { container } = render(<VideosSection />);
      const titles = container.querySelectorAll('.video-content h4');
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  describe('Category Filtering', () => {
    it('should filter videos by Blocage category', () => {
      const { container } = render(<VideosSection />);
      const blocageButton = Array.from(container.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent === 'Blocage');

      fireEvent.click(blocageButton);
      const videoCards = container.querySelectorAll('.video-card');
      expect(videoCards.length).toBe(2);
    });

    it('should filter videos by Signalement category', () => {
      const { container } = render(<VideosSection />);
      const signalementButton = Array.from(container.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent === 'Signalement');

      fireEvent.click(signalementButton);
      const videoCards = container.querySelectorAll('.video-card');
      expect(videoCards.length).toBe(1);
    });

    it('should show all videos when clicking Tous', () => {
      const { container } = render(<VideosSection />);
      const blocageButton = Array.from(container.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent === 'Blocage');

      fireEvent.click(blocageButton);
      const tousButton = Array.from(container.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent === 'Tous');

      fireEvent.click(tousButton);
      const videoCards = container.querySelectorAll('.video-card');
      expect(videoCards.length).toBe(6);
    });

    it('should display correct videos for each category', () => {
      render(<VideosSection />);
      const appsButton = Array.from(screen.getAllByRole('button'))
        .find(btn => btn.textContent === 'Apps');

      fireEvent.click(appsButton);
      expect(screen.getByText(/Bloquer sur WhatsApp/)).toBeTruthy();
    });
  });

  describe('Video Modal', () => {
    it('should not show modal initially', () => {
      const { container } = render(<VideosSection />);
      expect(container.querySelector('.video-modal')).toBeFalsy();
    });

    it('should show modal when video card is clicked', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      expect(container.querySelector('.video-modal')).toBeTruthy();
    });

    it('should display modal content when opened', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      const modalContent = container.querySelector('.modal-content');
      expect(modalContent).toBeTruthy();
    });

    it('should display video placeholder in modal', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      expect(container.querySelector('.video-placeholder')).toBeTruthy();
    });

    it('should display placeholder text', () => {
      render(<VideosSection />);
      const firstCard = document.querySelector('.video-card');

      fireEvent.click(firstCard);
      expect(screen.getByText(/Lecteur vidéo intégré/)).toBeTruthy();
    });

    it('should display modal title', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      const modal = container.querySelector('.video-modal');
      expect(modal.textContent).toContain('Bloquer sur Android');
    });

    it('should display modal description', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      const modal = container.querySelector('.video-modal');
      expect(modal.textContent).toContain('Guide complet pour bloquer');
    });

    it('should display duration badge in modal', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      expect(container.querySelector('.duration-badge')).toBeTruthy();
    });

    it('should display category badge in modal', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      expect(container.querySelector('.category-badge')).toBeTruthy();
    });
  });

  describe('Modal Close Button', () => {
    it('should have close button in modal', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      const closeBtn = container.querySelector('.close-btn');
      expect(closeBtn).toBeTruthy();
      expect(closeBtn.textContent).toBe('✕');
    });

    it('should close modal when close button is clicked', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      expect(container.querySelector('.video-modal')).toBeTruthy();

      const closeBtn = container.querySelector('.close-btn');
      fireEvent.click(closeBtn);
      expect(container.querySelector('.video-modal')).toBeFalsy();
    });

    it('should close modal when clicking outside content', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      const modal = container.querySelector('.video-modal');
      fireEvent.click(modal);
      expect(container.querySelector('.video-modal')).toBeFalsy();
    });

    it('should not close modal when clicking content area', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      const modalContent = container.querySelector('.modal-content');
      fireEvent.click(modalContent);
      expect(container.querySelector('.video-modal')).toBeTruthy();
    });

    it('should have aria-label on close button', () => {
      const { container } = render(<VideosSection />);
      const firstCard = container.querySelector('.video-card');

      fireEvent.click(firstCard);
      const closeBtn = container.querySelector('.close-btn');
      expect(closeBtn.getAttribute('aria-label')).toBe('Fermer la vidéo');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have button role on video cards', () => {
      const { container } = render(<VideosSection />);
      const videoCards = container.querySelectorAll('.video-card');
      videoCards.forEach(card => {
        expect(card.getAttribute('role')).toBe('button');
      });
    });

    it('should have tabIndex on video cards', () => {
      const { container } = render(<VideosSection />);
      const videoCards = container.querySelectorAll('.video-card');
      videoCards.forEach(card => {
        expect(card.getAttribute('tabIndex')).toBe('0');
      });
    });

    it('should be keyboard accessible for videos', () => {
      const { container } = render(<VideosSection />);
      const videoCards = container.querySelectorAll('.video-card');
      videoCards.forEach(card => {
        expect(card.getAttribute('role')).toBe('button');
        expect(card.getAttribute('tabIndex')).toBe('0');
      });
    });
  });

  describe('Info Box', () => {
    it('should display info box at bottom', () => {
      const { container } = render(<VideosSection />);
      expect(container.querySelector('.info-box')).toBeTruthy();
    });

    it('should display info icon', () => {
      render(<VideosSection />);
      expect(screen.getByText('ℹ️')).toBeTruthy();
    });

    it('should display info box title', () => {
      render(<VideosSection />);
      expect(screen.getByText('À Propos des Vidéos')).toBeTruthy();
    });

    it('should display info box content', () => {
      render(<VideosSection />);
      expect(screen.getByText(/Ces vidéos tutoriels sont en cours de production/)).toBeTruthy();
    });

    it('should mention multi-language support', () => {
      render(<VideosSection />);
      expect(screen.getByText(/français, anglais et espagnol/)).toBeTruthy();
    });

    it('should mention text guides alternative', () => {
      render(<VideosSection />);
      expect(screen.getByText(/guides textes dans les autres sections/)).toBeTruthy();
    });
  });

  describe('CSS Classes', () => {
    it('should have proper section structure', () => {
      const { container } = render(<VideosSection />);
      expect(container.querySelector('.videos-section')).toBeTruthy();
      expect(container.querySelector('.section-intro')).toBeTruthy();
      expect(container.querySelector('.video-filters')).toBeTruthy();
      expect(container.querySelector('.videos-grid')).toBeTruthy();
    });

    it('should have proper filter button classes', () => {
      const { container } = render(<VideosSection />);
      const buttons = container.querySelectorAll('.filter-btn');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(btn => {
        expect(btn.className).toContain('filter-btn');
      });
    });

    it('should have proper video card structure', () => {
      const { container } = render(<VideosSection />);
      const card = container.querySelector('.video-card');
      expect(card.querySelector('.video-thumbnail')).toBeTruthy();
      expect(card.querySelector('.video-content')).toBeTruthy();
    });
  });

  describe('Multiple Videos Selection', () => {
    it('should open different videos in modal', () => {
      const { container } = render(<VideosSection />);
      const videoCards = container.querySelectorAll('.video-card');

      fireEvent.click(videoCards[0]);
      let modal = container.querySelector('.video-modal');
      expect(modal.textContent).toContain('Bloquer sur Android');

      fireEvent.click(container.querySelector('.close-btn'));
      fireEvent.click(videoCards[1]);
      modal = container.querySelector('.video-modal');
      expect(modal.textContent).toContain('Bloquer sur iPhone');
    });

    it('should update modal content when switching videos', () => {
      const { container } = render(<VideosSection />);
      const videoCards = container.querySelectorAll('.video-card');

      fireEvent.click(videoCards[2]);
      const modal = container.querySelector('.video-modal');
      expect(modal.textContent).toContain('Signaler un Scam');
    });
  });

  describe('Content Verification', () => {
    it('should display all 6 videos initially', () => {
      const { container } = render(<VideosSection />);
      expect(screen.getByText(/Bloquer sur Android/)).toBeTruthy();
      expect(screen.getByText(/Bloquer sur iPhone/)).toBeTruthy();
      expect(screen.getByText(/Signaler un Scam/)).toBeTruthy();
      expect(screen.getByText(/Récupération après Fraude/)).toBeTruthy();
      expect(screen.getByText(/Bloquer sur WhatsApp/)).toBeTruthy();
      expect(screen.getByText(/Arnaques les Plus Courantes/)).toBeTruthy();
    });

    it('should have correct category counts', () => {
      const { container } = render(<VideosSection />);
      const appsButton = Array.from(container.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent === 'Apps');

      fireEvent.click(appsButton);
      const videoCards = container.querySelectorAll('.video-card');
      expect(videoCards.length).toBe(1);
    });
  });

  describe('Memoization', () => {
    it('should be memoized for performance', () => {
      const { rerender } = render(<VideosSection />);
      rerender(<VideosSection />);

      const videoCards = document.querySelectorAll('.video-card');
      expect(videoCards.length).toBe(6);
    });
  });

  describe('Modal Info Section', () => {
    it('should display modal-info container', () => {
      const { container } = render(<VideosSection />);
      const card = container.querySelector('.video-card');

      fireEvent.click(card);
      expect(container.querySelector('.modal-info')).toBeTruthy();
    });

    it('should display video meta information', () => {
      const { container } = render(<VideosSection />);
      const card = container.querySelector('.video-card');

      fireEvent.click(card);
      expect(container.querySelector('.video-meta')).toBeTruthy();
    });
  });

  describe('Filter Button Accessibility', () => {
    it('should have text content visible on filter buttons', () => {
      const { container } = render(<VideosSection />);
      const buttons = container.querySelectorAll('.video-filters .filter-btn');
      const buttonTexts = Array.from(buttons).map(btn => btn.textContent);
      expect(buttonTexts).toContain('Tous');
      expect(buttonTexts).toContain('Blocage');
      expect(buttonTexts).toContain('Signalement');
    });

    it('should allow multiple clicks to change filters', () => {
      const { container } = render(<VideosSection />);

      const blocageButton = Array.from(container.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent === 'Blocage');
      fireEvent.click(blocageButton);
      let videos = container.querySelectorAll('.video-card');
      expect(videos.length).toBe(2);

      const educationButton = Array.from(container.querySelectorAll('.filter-btn'))
        .find(btn => btn.textContent === 'Éducation');
      fireEvent.click(educationButton);
      videos = container.querySelectorAll('.video-card');
      expect(videos.length).toBe(1);
    });
  });
});
