import { useState, useCallback, useEffect } from 'react';
import { DEFAULTS } from '../constants';

/**
 * Hook personnalisé pour gérer la synthèse et la reconnaissance vocale
 */
export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  // Synthèse vocale (Text-to-Speech)
  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Arrêter la lecture précédente
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = DEFAULTS.LANG;
      utterance.rate = DEFAULTS.SPEECH_RATE;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Arrêter la synthèse en cours
  const cancelSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Reconnaissance vocale (Speech-to-Text)
  const startListening = useCallback((onResult, onError) => {
    if (!('webkitSpeechRecognition' in window)) {
      if (onError) onError("La dictée vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = DEFAULTS.LANG;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, []);

  return {
    isListening,
    isSupported,
    speak,
    cancelSpeech,
    startListening
  };
};