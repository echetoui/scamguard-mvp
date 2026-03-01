import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from './ErrorBoundary';

// Mock des composants enfants pour isoler le test
jest.mock('./Card', () => {
  return ({ children, title }) => (
    <div data-testid="mock-card">
      <h1>{title}</h1>
      {children}
    </div>
  );
});

jest.mock('./Button', () => {
  return ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  );
});

// Composant qui plante volontairement
const Bomb = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Kaboom');
  }
  return <div>Tout va bien</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // Empêcher les logs d'erreur de React dans la console pendant les tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('affiche les enfants quand il n\'y a pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Tout va bien')).toBeInTheDocument();
  });

  test('affiche l\'interface de repli quand une erreur survient', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    // Vérifie que le titre de la carte d'erreur est présent
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    
    // Vérifie le message d'aide
    expect(screen.getByText(/L'application a rencontré un problème inattendu/i)).toBeInTheDocument();
    
    // Vérifie la présence du bouton de rechargement
    expect(screen.getByText('Recharger l\'application')).toBeInTheDocument();
  });

  test('recharge la page au clic sur le bouton', () => {
    // Mock de window.location.reload
    const reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: reloadMock }
    });

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    const button = screen.getByText('Recharger l\'application');
    fireEvent.click(button);

    expect(reloadMock).toHaveBeenCalled();
  });
});