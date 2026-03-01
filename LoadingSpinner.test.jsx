import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('affiche le message par défaut', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  test('affiche un message personnalisé', () => {
    const customMessage = "Analyse en cours...";
    render(<LoadingSpinner message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('possède les attributs d\'accessibilité corrects', () => {
    render(<LoadingSpinner />);
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});