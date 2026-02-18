/**
 * Speech Recognition React Hook
 * Phase 3.2.2 - Voice Commands for Seniors
 *
 * Provides continuous speech recognition for voice commands
 * Respects user language preferences and privacy settings
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useSpeechRecognition - React hook for Web Speech API
 *
 * Features:
 * - Continuous voice input recognition
 * - Interim and final transcripts
 * - Multiple language support
 * - Voice command processing
 * - Confidence scoring
 *
 * @param {object} options - Configuration options
 * @param {string} options.language - Language code (fr-CA, en-US)
 * @param {boolean} options.continuous - Keep recognizing (default true)
 * @param {boolean} options.interimResults - Show interim results (default true)
 * @param {Function} options.onResult - Callback for results
 * @param {Function} options.onError - Callback for errors
 * @returns {object} Speech recognition control
 */
export const useSpeechRecognition = (options = {}) => {
  const {
    language = 'fr-CA',
    continuous = true,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognition;
  });

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  const recognizerRef = useRef(null);

  // Initialize recognizer
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configuration
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      let bestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          final += transcript + ' ';
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
          }
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
      if (final) {
        setTranscript(prev => prev + final);
        setConfidence(bestConfidence);

        // Call onResult callback
        if (onResult) {
          onResult({
            transcript: final.trim(),
            confidence: bestConfidence,
            isFinal: true,
          });
        }
      }
    };

    recognition.onerror = (event) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      setError(errorMessage);

      if (onError) {
        onError(event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognizerRef.current = recognition;

    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
    };
  }, [isSupported, language, continuous, interimResults, onResult, onError]);

  /**
   * Start listening
   */
  const start = useCallback(() => {
    if (!isSupported || !recognizerRef.current) return;
    try {
      recognizerRef.current.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
    }
  }, [isSupported]);

  /**
   * Stop listening
   */
  const stop = useCallback(() => {
    if (!isSupported || !recognizerRef.current) return;
    recognizerRef.current.stop();
  }, [isSupported]);

  /**
   * Abort listening
   */
  const abort = useCallback(() => {
    if (!isSupported || !recognizerRef.current) return;
    recognizerRef.current.abort();
  }, [isSupported]);

  /**
   * Clear transcript
   */
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
  }, []);

  /**
   * Set language
   */
  const setLanguage = useCallback((lang) => {
    if (!recognizerRef.current) return;
    recognizerRef.current.lang = lang;
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    confidence,
    error,
    start,
    stop,
    abort,
    clearTranscript,
    setLanguage,
  };
};

/**
 * Hook for voice command processing
 * Maps voice input to application commands
 *
 * @param {object} commands - Command mappings
 * @param {object} options - Recognition options
 */
export const useVoiceCommands = (commands = {}, options = {}) => {
  const [executedCommand, setExecutedCommand] = useState(null);
  const [commandError, setCommandError] = useState(null);

  const handleResult = useCallback(
    (result) => {
      const text = result.transcript.toLowerCase().trim();

      // Find matching command
      let matchedCommand = null;
      let highestConfidence = 0;

      for (const [key, config] of Object.entries(commands)) {
        // Check exact match
        if (text === key.toLowerCase()) {
          matchedCommand = key;
          highestConfidence = result.confidence;
          break;
        }

        // Check partial matches
        for (const phrase of config.phrases || []) {
          if (text.includes(phrase.toLowerCase())) {
            if (result.confidence > highestConfidence) {
              matchedCommand = key;
              highestConfidence = result.confidence;
            }
          }
        }
      }

      if (matchedCommand && commands[matchedCommand]) {
        try {
          // Execute command
          commands[matchedCommand].action();
          setExecutedCommand(matchedCommand);
          setCommandError(null);

          // Provide feedback
          if (commands[matchedCommand].feedback) {
            console.log(commands[matchedCommand].feedback);
          }
        } catch (error) {
          setCommandError(`Error executing command: ${error.message}`);
        }
      } else if (result.confidence > 0.5) {
        // High confidence but no match
        setCommandError(`Command not recognized: "${result.transcript}"`);
      }
    },
    [commands]
  );

  const speechRec = useSpeechRecognition({
    ...options,
    onResult: handleResult,
  });

  return {
    ...speechRec,
    executedCommand,
    commandError,
    availableCommands: Object.keys(commands),
  };
};

/**
 * Hook for dictation mode (continuous text input)
 * Collects multiple utterances into single text block
 *
 * @param {object} options - Recognition options
 */
export const useDictation = (options = {}) => {
  const [fullText, setFullText] = useState('');
  const [isActive, setIsActive] = useState(false);

  const handleResult = useCallback((result) => {
    setFullText(prev => prev + ' ' + result.transcript);
  }, []);

  const speechRec = useSpeechRecognition({
    ...options,
    continuous: true,
    onResult: handleResult,
  });

  /**
   * Start dictation
   */
  const startDictation = useCallback(() => {
    setIsActive(true);
    setFullText('');
    speechRec.start();
  }, [speechRec]);

  /**
   * Stop dictation
   */
  const stopDictation = useCallback(() => {
    setIsActive(false);
    speechRec.stop();
  }, [speechRec]);

  /**
   * Clear dictated text
   */
  const clearText = useCallback(() => {
    setFullText('');
    speechRec.clearTranscript();
  }, [speechRec]);

  /**
   * Insert text at cursor (for form inputs)
   */
  const insertIntoInput = useCallback((inputElement) => {
    if (!inputElement) return;

    const cursorPos = inputElement.selectionStart;
    const textBefore = inputElement.value.substring(0, cursorPos);
    const textAfter = inputElement.value.substring(cursorPos);

    inputElement.value = textBefore + ' ' + fullText + textAfter;

    // Trigger change event
    const event = new Event('input', { bubbles: true });
    inputElement.dispatchEvent(event);

    clearText();
  }, [fullText, clearText]);

  return {
    ...speechRec,
    fullText,
    isActive,
    startDictation,
    stopDictation,
    clearText,
    insertIntoInput,
  };
};

export default useSpeechRecognition;
