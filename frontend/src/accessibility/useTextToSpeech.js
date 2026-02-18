/**
 * Text-to-Speech (TTS) React Hook
 * Phase 3.2.2 - Voice Assistance for Seniors
 *
 * Provides natural speech synthesis for accessibility
 * Respects user language preferences and audio settings
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useTextToSpeech - React hook for Text-to-Speech functionality
 *
 * Features:
 * - Multiple language support (French, English)
 * - Adjustable speech rate and pitch
 * - Pause/resume functionality
 * - Cancel current speech
 * - Automatic queue management
 *
 * @param {object} options - Configuration options
 * @param {string} options.language - Language code (fr, en)
 * @param {number} options.rate - Speech rate (0.5-2.0, default 1.0)
 * @param {number} options.pitch - Speech pitch (0.5-2.0, default 1.0)
 * @param {number} options.volume - Volume (0-1, default 1.0)
 * @param {boolean} options.autoPlay - Auto-play on text change
 * @returns {object} TTS control object
 */
export const useTextToSpeech = (options = {}) => {
  const {
    language = 'fr-CA',        // Quebec French by default
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    autoPlay = false,
  } = options;

  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);
  const synthesisRef = useRef(null);

  // Get Web Speech API instance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  /**
   * Speak text
   * @param {string} text - Text to speak
   * @param {object} overrideOptions - Override options for this utterance
   */
  const speak = useCallback(
    (text, overrideOptions = {}) => {
      if (!isSupported || !synthesisRef.current || !text) return;

      // Cancel current speech
      synthesisRef.current.cancel();

      try {
        const utterance = new SpeechSynthesisUtterance(text);

        // Use provided language code
        utterance.lang = overrideOptions.language || language;

        // Set voice properties
        utterance.rate = overrideOptions.rate ?? rate;
        utterance.pitch = overrideOptions.pitch ?? pitch;
        utterance.volume = overrideOptions.volume ?? volume;

        // Set event handlers
        utterance.onstart = () => {
          setIsLoading(false);
          setIsSpeaking(true);
          setIsPaused(false);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error);
          setIsSpeaking(false);
          setIsPaused(false);
        };

        utterance.onpause = () => {
          setIsPaused(true);
        };

        utterance.onresume = () => {
          setIsPaused(false);
        };

        utteranceRef.current = utterance;

        // Speak the text
        setIsLoading(true);
        synthesisRef.current.speak(utterance);
      } catch (error) {
        console.error('Error speaking text:', error);
        setIsLoading(false);
      }
    },
    [isSupported, language, rate, pitch, volume]
  );

  /**
   * Pause current speech
   */
  const pause = useCallback(() => {
    if (!isSupported || !synthesisRef.current) return;
    synthesisRef.current.pause();
    setIsPaused(true);
  }, [isSupported]);

  /**
   * Resume paused speech
   */
  const resume = useCallback(() => {
    if (!isSupported || !synthesisRef.current) return;
    synthesisRef.current.resume();
    setIsPaused(false);
  }, [isSupported]);

  /**
   * Cancel current speech
   */
  const cancel = useCallback(() => {
    if (!isSupported || !synthesisRef.current) return;
    synthesisRef.current.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  /**
   * Get available voices for language
   */
  const getVoices = useCallback(() => {
    if (!isSupported || !synthesisRef.current) return [];
    return synthesisRef.current.getVoices().filter(voice =>
      voice.lang.startsWith(language.split('-')[0])
    );
  }, [isSupported, language]);

  /**
   * Set voice for language
   */
  const setVoice = useCallback(
    (voiceIndex = 0) => {
      if (!utteranceRef.current) return;
      const voices = getVoices();
      if (voices[voiceIndex]) {
        utteranceRef.current.voice = voices[voiceIndex];
      }
    },
    [getVoices]
  );

  return {
    speak,
    pause,
    resume,
    cancel,
    getVoices,
    setVoice,
    isSupported,
    isLoading,
    isSpeaking,
    isPaused,
  };
};

/**
 * Hook to announce content changes to screen readers
 * Uses aria-live regions and TTS
 *
 * @param {string} announcement - Text to announce
 * @param {object} options - TTS options
 */
export const useAnnouncement = (announcement, options = {}) => {
  const tts = useTextToSpeech(options);
  const announceRef = useRef(null);

  const announce = useCallback(
    (text, priority = 'polite') => {
      // Create or update aria-live region
      if (!announceRef.current) {
        const div = document.createElement('div');
        div.setAttribute('aria-live', priority);
        div.setAttribute('aria-atomic', 'true');
        div.className = 'sr-only';
        document.body.appendChild(div);
        announceRef.current = div;
      }

      // Update aria-live text
      announceRef.current.textContent = text;
      announceRef.current.setAttribute('aria-live', priority);

      // Also speak (if TTS enabled)
      if (options.useTTS !== false) {
        tts.speak(text);
      }
    },
    [tts, options]
  );

  // Announce initial text
  useEffect(() => {
    if (announcement) {
      announce(announcement);
    }
  }, [announcement, announce]);

  return announce;
};

/**
 * Hook for context-aware announcements
 * Announces UI changes with appropriate priority
 *
 * @param {object} state - State to monitor for changes
 * @param {Function} getMessage - Function to generate announcement
 * @param {object} options - TTS options
 */
export const useStateAnnouncement = (state, getMessage, options = {}) => {
  const announce = useAnnouncement('', options);
  const prevStateRef = useRef(state);

  useEffect(() => {
    // Check if state changed
    if (state !== prevStateRef.current) {
      const message = getMessage(state, prevStateRef.current);
      if (message) {
        announce(message, 'polite');
      }
      prevStateRef.current = state;
    }
  }, [state, getMessage, announce]);
};

/**
 * Advanced TTS hook with queue management
 * Handles multiple announcements without overlapping
 *
 * @param {object} options - Configuration options
 */
export const useTextToSpeechQueue = (options = {}) => {
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const tts = useTextToSpeech(options);

  // Process queue
  useEffect(() => {
    if (queue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    const currentItem = queue[0];

    // Speak and wait for completion
    const handleEnd = () => {
      // Remove from queue and process next
      setQueue(prev => prev.slice(1));
      setIsProcessing(false);
    };

    // Create utterance with end handler
    const utterance = new SpeechSynthesisUtterance(currentItem.text);
    utterance.onend = handleEnd;
    utterance.lang = currentItem.language || options.language || 'fr-CA';
    utterance.rate = currentItem.rate ?? options.rate ?? 1.0;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.speak(utterance);
    }
  }, [queue, isProcessing, options]);

  /**
   * Add text to queue
   */
  const addToQueue = useCallback((text, priority = 'normal', itemOptions = {}) => {
    setQueue(prev => {
      if (priority === 'high') {
        // Add to front of queue
        return [{ text, ...itemOptions }, ...prev];
      }
      // Add to end
      return [...prev, { text, ...itemOptions }];
    });
  }, []);

  /**
   * Clear queue
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
    tts.cancel();
  }, [tts]);

  return {
    addToQueue,
    clearQueue,
    queue,
    isProcessing,
    queueLength: queue.length,
  };
};

export default useTextToSpeech;
