/**
 * Leaderboard Component
 * Phase 2 Sprint 6 - Enhanced Quizzes & Gamification
 *
 * Displays top scores for a quiz module
 */

import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../utils/quizStorage';
import '../styles/Leaderboard.css';

export default function Leaderboard({ moduleId, moduleName, moduleIcon }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    setEntries(getLeaderboard(moduleId));
  }, [moduleId]);

  const getMedalEmoji = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `${rank + 1}.`;
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty === 'debutant') return '#4CAF50'; // Green
    if (difficulty === 'intermediaire') return '#F57C00'; // Orange
    if (difficulty === 'expert') return '#D32F2F'; // Red
    return '#999';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="leaderboard" role="complementary">
      <h3 className="leaderboard-title">{moduleIcon} Vos Meilleurs Scores</h3>

      {entries.length === 0 ? (
        <p className="leaderboard-empty">
          Aucun score encore. Commencez un quiz!
        </p>
      ) : (
        <div className="leaderboard-list" role="list">
          {entries.map((entry, index) => (
            <div
              key={index}
              className="leaderboard-entry"
              role="listitem"
              aria-label={`Rang ${index + 1}: ${entry.score}% en ${entry.difficulty}`}
            >
              <span className="entry-rank">{getMedalEmoji(index)}</span>

              <div className="entry-details">
                <span className="entry-score">{entry.score}%</span>

                <span
                  className="entry-difficulty"
                  style={{
                    backgroundColor: getDifficultyColor(entry.difficulty),
                  }}
                >
                  {entry.difficulty === 'debutant' && 'Débutant'}
                  {entry.difficulty === 'intermediaire' && 'Intermédiaire'}
                  {entry.difficulty === 'expert' && 'Expert'}
                </span>
              </div>

              <div className="entry-meta">
                <span className="entry-date">{entry.date}</span>
                <span className="entry-duration">{formatDuration(entry.durationSec)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
