import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { apiService } from './services/api';
import { useSpeech } from './hooks/useSpeech';

// --- Mocks ---

// Mock du service API pour éviter les vrais appels réseau
jest.mock('./services/api');

// Mock du hook useSpeech pour éviter les erreurs liées à l'API Web Speech non dispo dans JSDOM
jest.mock('./hooks/useSpeech');

// Mock useAuth pour simuler un utilisateur connecté
jest.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn()
  })
}));

// Mock de window.scrollTo (non implémenté dans JSDOM)
window.scrollTo = jest.fn();

describe('App Integration Test - Parcours Complet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Pour gérer les setTimeout de la voix
    localStorage.clear();

    // Configuration par défaut du mock useSpeech
    useSpeech.mockReturnValue({
      speak: jest.fn(),
      cancelSpeech: jest.fn(),
      startListening: jest.fn(),
      isListening: false,
      isSupported: true
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Flux complet : Accueil -> Scénario -> Résultat -> Accueil', async () => {
    // 1. Préparation des données simulées (Mocks)
    const mockScenario = {
      title: 'Arnaque SMS',
      content: 'Cliquez ici pour gagner un iPhone.'
    };

    const mockResult = {
      detection: { score: 95 },
      coaching: {
        feedback: 'Excellent réflexe ! Vous avez repéré le lien suspect.',
        xp_earned: 20
      }
    };

    // On dit à Jest quoi retourner quand l'app appelle l'API
    apiService.generateScenario.mockResolvedValue(mockScenario);
    apiService.analyzeMessage.mockResolvedValue(mockResult);

    // 2. Rendu de l'application
    await act(async () => {
      render(<App />);
    });

    // VÉRIFICATION : On est bien sur l'accueil
    expect(screen.getByText(/Prêt à vous protéger/i)).toBeInTheDocument();

    // 3. ACTION : L'utilisateur clique sur "M'entraîner"
    const trainButton = screen.getByText(/M'entraîner avec un faux scénario/i);
    
    await act(async () => {
      fireEvent.click(trainButton);
    });

    // Vérifier que l'API a été appelée
    expect(apiService.generateScenario).toHaveBeenCalled();

    // Avancer le temps pour déclencher la lecture vocale (setTimeout 500ms)
    act(() => { jest.runAllTimers(); });

    // VÉRIFICATION : On est sur la vue Scénario (attente asynchrone)
    await waitFor(() => {
      expect(screen.getByText('Arnaque SMS')).toBeInTheDocument();
    });
    expect(screen.getByText('Cliquez ici pour gagner un iPhone.')).toBeInTheDocument();

    // 4. ACTION : L'utilisateur tape sa réponse
    const textArea = screen.getByLabelText(/Que faites-vous face à ce message/i);
    fireEvent.change(textArea, { target: { value: 'Je ne clique pas et je supprime.' } });

    // 5. ACTION : L'utilisateur valide
    const submitButton = screen.getByText(/Valider ma réponse/i);
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Vérifier que l'analyse a été lancée avec les bonnes données
    expect(apiService.analyzeMessage).toHaveBeenCalledWith(
      expect.any(String), // userId (peu importe la valeur exacte)
      mockScenario,
      'Je ne clique pas et je supprime.',
      null // pas d'image
    );

    // Avancer le temps pour la lecture du résultat
    act(() => { jest.runAllTimers(); });

    // VÉRIFICATION : On est sur la vue Résultat
    await waitFor(() => {
      expect(screen.getByText(/Résultat de l'analyse/i)).toBeInTheDocument();
    });

    expect(screen.getByText('95/100')).toBeInTheDocument();
    expect(screen.getByText('Excellent réflexe ! Vous avez repéré le lien suspect.')).toBeInTheDocument();

    // 6. ACTION : Retour à l'accueil
    const homeButton = screen.getByText(/Retour à l'accueil/i);
    fireEvent.click(homeButton);

    // VÉRIFICATION : Retour case départ
    expect(screen.getByText(/Prêt à vous protéger/i)).toBeInTheDocument();
  });

  test('Flux complet : Accueil -> Détection -> Résultat', async () => {
    const mockResult = {
      detection: { score: 20 },
      coaching: {
        feedback: 'Attention, ceci est une arnaque connue.',
        xp_earned: 10
      }
    };

    apiService.analyzeMessage.mockResolvedValue(mockResult);

    await act(async () => {
      render(<App />);
    });

    // 1. Aller sur la page de détection
    const detectButton = screen.getByText(/Analyser un message suspect reçu/i);
    fireEvent.click(detectButton);

    await waitFor(() => {
      expect(screen.getByText(/Analyse de message/i)).toBeInTheDocument();
    });

    // 2. Remplir la description
    const textArea = screen.getByPlaceholderText(/Ou décrivez ce qui vous semble bizarre/i);
    fireEvent.change(textArea, { target: { value: 'Message bizarre de la banque.' } });

    // 3. Lancer l'analyse
    const submitButton = screen.getByText(/Lancer l'analyse/i);
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Vérifier l'appel API
    expect(apiService.analyzeMessage).toHaveBeenCalledWith(
      expect.any(String),
      null, // pas de scénario
      'Message bizarre de la banque.',
      null // pas d'image
    );

    act(() => { jest.runAllTimers(); });

    // 4. Vérifier le résultat
    await waitFor(() => {
      expect(screen.getByText('20/100')).toBeInTheDocument();
    });
  });

  test('Affiche le LoadingSpinner pendant le chargement', async () => {
    // On retarde la réponse de l'API pour voir le spinner
    apiService.generateScenario.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ title: 'Test', content: 'Test' }), 500);
    }));

    await act(async () => {
      render(<App />);
    });

    const trainButton = screen.getByText(/M'entraîner avec un faux scénario/i);
    fireEvent.click(trainButton);

    // Vérifie la présence du spinner
    expect(screen.getByText('Analyse en cours...')).toBeInTheDocument();

    act(() => { jest.runAllTimers(); });

    await waitFor(() => {
      expect(screen.queryByText('Analyse en cours...')).not.toBeInTheDocument();
    });
  });
});