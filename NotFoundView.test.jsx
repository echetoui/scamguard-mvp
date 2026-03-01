import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotFoundView from './NotFoundView';

// Mock des composants enfants pour isoler le test
jest.mock('../../Card', () => {
  return ({ children, title }) => (
    <div data-testid="mock-card">
      <h1>{title}</h1>
      {children}
    </div>
  );
});

jest.mock('../../Button', () => {
  return ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  );
});

describe('NotFoundView Component', () => {
  test('affiche le message d\'erreur et le titre', () => {
    render(<NotFoundView onHome={jest.fn()} />);
    
    // Vérifie le titre (passé au Card)
    expect(screen.getByText('Page introuvable')).toBeInTheDocument();
    
    // Vérifie le contenu
    expect(screen.getByText('Oups !')).toBeInTheDocument();
    expect(screen.getByText(/Nous ne trouvons pas la page/i)).toBeInTheDocument();
  });

  test('affiche le bouton de retour', () => {
    render(<NotFoundView onHome={jest.fn()} />);
    
    expect(screen.getByText("Retour à l'accueil")).toBeInTheDocument();
  });

  test('appelle la fonction onHome au clic sur le bouton', () => {
    const onHomeMock = jest.fn();
    render(<NotFoundView onHome={onHomeMock} />);
    
    const button = screen.getByText("Retour à l'accueil");
    fireEvent.click(button);
    
    expect(onHomeMock).toHaveBeenCalledTimes(1);
  });
});