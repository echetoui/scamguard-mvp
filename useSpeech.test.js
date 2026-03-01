import { renderHook, act } from '@testing-library/react';
import { useSpeech } from './useSpeech';

// Mock des constantes pour éviter les dépendances externes
jest.mock('../constants', () => ({
  DEFAULTS: {
    LANG: 'fr-FR',
    SPEECH_RATE: 0.9,
  },
}));

describe('useSpeech Hook', () => {
  let mockSpeechSynthesis;
  let mockSpeechRecognition;
  let mockUtteranceInstance;

  beforeEach(() => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();

    // 1. Mock SpeechSynthesis (Synthèse vocale)
    mockSpeechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
    };
    global.speechSynthesis = mockSpeechSynthesis;

    // Mock du constructeur SpeechSynthesisUtterance
    mockUtteranceInstance = {};
    global.SpeechSynthesisUtterance = jest.fn(() => mockUtteranceInstance);

    // 2. Mock SpeechRecognition (Reconnaissance vocale)
    mockSpeechRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      lang: '',
      interimResults: false,
      onstart: null,
      onresult: null,
      onerror: null,
      onend: null,
    };
    global.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
  });

  afterEach(() => {
    // Nettoyage de l'environnement global
    delete global.speechSynthesis;
    delete global.SpeechSynthesisUtterance;
    delete global.webkitSpeechRecognition;
  });

  test('initializes with isSupported=true if APIs exist', () => {
    const { result } = renderHook(() => useSpeech());
    expect(result.current.isSupported).toBe(true);
  });

  test('initializes with isSupported=false if APIs are missing', () => {
    delete global.webkitSpeechRecognition;
    const { result } = renderHook(() => useSpeech());
    expect(result.current.isSupported).toBe(false);
  });

  test('speak() calls speechSynthesis with correct parameters', () => {
    const { result } = renderHook(() => useSpeech());
    const text = 'Bonjour test';

    act(() => {
      result.current.speak(text);
    });

    // Vérifie qu'on annule d'abord toute parole en cours
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    // Vérifie la création de l'objet Utterance
    expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith(text);
    // Vérifie la configuration de la langue et vitesse
    expect(mockUtteranceInstance.lang).toBe('fr-FR');
    expect(mockUtteranceInstance.rate).toBe(0.9);
    // Vérifie l'appel final à speak
    expect(mockSpeechSynthesis.speak).toHaveBeenCalledWith(mockUtteranceInstance);
  });

  test('cancelSpeech() calls speechSynthesis.cancel', () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.cancelSpeech();
    });

    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });

  test('startListening() initializes recognition and handles results', () => {
    const { result } = renderHook(() => useSpeech());
    const onResultMock = jest.fn();

    act(() => {
      result.current.startListening(onResultMock);
    });

    // Vérifie l'initialisation
    expect(global.webkitSpeechRecognition).toHaveBeenCalled();
    expect(mockSpeechRecognition.lang).toBe('fr-FR');
    expect(mockSpeechRecognition.start).toHaveBeenCalled();

    // Simule le démarrage (onstart)
    act(() => {
      if (mockSpeechRecognition.onstart) mockSpeechRecognition.onstart();
    });
    expect(result.current.isListening).toBe(true);

    // Simule un résultat (onresult)
    const mockEvent = {
      results: [[{ transcript: 'Texte dicté' }]]
    };
    act(() => {
      if (mockSpeechRecognition.onresult) mockSpeechRecognition.onresult(mockEvent);
    });

    // Vérifie que le callback est appelé et que l'écoute s'arrête
    expect(onResultMock).toHaveBeenCalledWith('Texte dicté');
    expect(result.current.isListening).toBe(false);
  });

  test('startListening() calls onError if API is missing', () => {
    delete global.webkitSpeechRecognition;
    const { result } = renderHook(() => useSpeech());
    const onErrorMock = jest.fn();

    act(() => {
      result.current.startListening(jest.fn(), onErrorMock);
    });

    expect(onErrorMock).toHaveBeenCalledWith(expect.stringContaining("pas supportée"));
  });
});