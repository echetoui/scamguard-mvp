/**
 * Leaderboard Component
 * Phase 2 Sprint 6 - Enhanced Quizzes & Gamification
 *
 * Displays top 10 scores for a quiz module
 */

import React, { useMemo } from 'react';
import { getLeaderboard } from '../utils/quizStorage';
import '../styles/Leaderboard.css';

const DIFFICULTY_LABELS = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  expert: 'Expert',
};

const getRankMedal = (position) => {
  if (position === 0) return '🥇';
  if (position === 1) return '🥈';
  if (position === 2) return '🥉';
  return `${position + 1}.`;
};

const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
};

export default function Leaderboard({ moduleId, title = 'Tableau des scores' }) {
  const entries = useMemo(() => getLeaderboard(moduleId), [moduleId]);

  if (!entries || entries.length === 0) {
    return (
      <div className="leaderboard" role="region" aria-label="Tableau des scores">
        <h3 className="leaderboard-title">🏆 {title}</h3>
        <p className="leaderboard-empty">Aucun score enregistré. Commencez un quiz!</p>
      </div>
    );
  }

  return (
    <div className="leaderboard" role="region" aria-label="Tableau des scores">
      <h3 className="leaderboard-title">🏆 {title}</h3>
      <ol className="leaderboard-list">
        {entries.map((entry, index) => (
          <li key={`${entry.score}-${entry.durationSec}-${index}`} className="leaderboard-entry">
            <span className="entry-rank">{getRankMedal(index)}</span>
            <div className="entry-details">
              <span className="entry-score">{entry.score}%</span>
              <span className={`entry-difficulty difficulty-${entry.difficulty}`}>
                {DIFFICULTY_LABELS[entry.difficulty] || entry.difficulty}
              </span>
            </div>
            <div className="entry-meta">
              <span className="entry-duration">{formatDuration(entry.durationSec)}</span>
              <span className="entry-date">{entry.date}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
