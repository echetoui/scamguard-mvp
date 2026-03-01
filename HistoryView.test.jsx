import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoryView from './HistoryView';

// Mock des composants enfants pour isoler le test de la vue
jest.mock('../../Card', () => {
  return ({ children }) => <div data-testid="mock-card">{children}</div>;
});

// Mock des constantes pour contrôler le seuil de score
jest.mock('../../constants', () => ({
  LIMITS: {
    SCORE_THRESHOLD: 50
  }
}));

describe('HistoryView Component', () => {
  test('affiche le message vide quand l\'historique est vide', () => {
    render(<HistoryView history={[]} />);
    
    // Vérifie la présence du titre
    expect(screen.getByText(/Historique/i)).toBeInTheDocument();
    
    // Vérifie le message d'état vide
    expect(screen.getByText(/Aucune analyse pour le moment/i)).toBeInTheDocument();
  });

  test('affiche la liste des analyses quand l\'historique contient des données', () => {
    const mockHistory = [
      {
        id: 101,
        score: 85,
        date: '22/02/2026',
        summary: 'Message sécuritaire détecté.'
      },
      {
        id: 102,
        score: 20,
        date: '21/02/2026',
        summary: 'Arnaque probable détectée.'
      }
    ];

    render(<HistoryView history={mockHistory} />);

    // Le message vide ne doit pas être présent
    expect(screen.queryByText(/Aucune analyse pour le moment/i)).not.toBeInTheDocument();

    // Vérifie que les éléments sont bien affichés
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('22/02/2026')).toBeInTheDocument();
    expect(screen.getByText('Message sécuritaire détecté.')).toBeInTheDocument();

    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('21/02/2026')).toBeInTheDocument();
    expect(screen.getByText('Arnaque probable détectée.')).toBeInTheDocument();
  });

  test('applique les classes CSS correctes (good/bad) selon le score', () => {
    const mockHistory = [
      { id: 1, score: 90, date: '-', summary: '-' }, // Score > 50 (Bon)
      { id: 2, score: 10, date: '-', summary: '-' }  // Score <= 50 (Mauvais)
    ];

    render(<HistoryView history={mockHistory} />);

    // Vérifie la classe 'good' pour le score élevé
    const goodScoreEl = screen.getByText('90').closest('.history-score');
    expect(goodScoreEl).toHaveClass('good');

    // Vérifie la classe 'bad' pour le score faible
    const badScoreEl = screen.getByText('10').closest('.history-score');
    expect(badScoreEl).toHaveClass('bad');
  });
});