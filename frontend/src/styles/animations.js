/**
 * Animation Utilities
 * Phase 3.1.4 - Accessible Motion Design
 *
 * React hooks and utilities for managing animations
 * while respecting user motion preferences.
 */

import { useState, useEffect, useRef } from 'react';

/* ============ MOTION PREFERENCE DETECTION ============ */

/**
 * Detects if user prefers reduced motion
 * Returns true if prefers-reduced-motion: reduce is set
 * @returns {boolean}
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * React hook to detect and subscribe to reduced motion preference
 * @returns {boolean}
 */
export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(() =>
    prefersReducedMotion()
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e) => {
      setReducedMotion(e.matches);
    };

    // Listen to changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return reducedMotion;
};

/* ============ ANIMATION STATE MANAGEMENT ============ */

/**
 * Hook to manage animation state with automatic cleanup
 * @param {number} duration - Animation duration in ms
 * @param {boolean} shouldAnimate - Whether to animate (respects reduced motion)
 * @returns {object} { isAnimating, start, stop }
 */
export const useAnimation = (duration = 300, shouldAnimate = true) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const reducedMotion = useReducedMotion();

  const effectiveDuration = reducedMotion ? 0 : duration;

  const start = () => {
    if (!shouldAnimate) return;
    setIsAnimating(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, effectiveDuration);
  };

  const stop = () => {
    setIsAnimating(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isAnimating, start, stop };
};

/**
 * Hook for staggered animations (multiple elements animating in sequence)
 * @param {number} itemCount - Number of items to stagger
 * @param {number} staggerDelay - Delay between each item (ms)
 * @returns {object} { getItemDelay, getTotalDuration }
 */
export const useStaggerAnimation = (itemCount = 1, staggerDelay = 50) => {
  const reducedMotion = useReducedMotion();
  const effectiveDelay = reducedMotion ? 0 : staggerDelay;

  const getItemDelay = (index) => `${index * effectiveDelay}ms`;
  const getTotalDuration = () => (itemCount - 1) * effectiveDelay;

  return { getItemDelay, getTotalDuration };
};

/* ============ ANIMATION CLASS MANAGEMENT ============ */

/**
 * Add animation class and remove after completion
 * @param {HTMLElement} element - DOM element to animate
 * @param {string} animationClass - Animation class name
 * @param {number} duration - Duration in ms
 * @returns {Promise} Resolves when animation completes
 */
export const animateElement = (element, animationClass, duration = 300) => {
  return new Promise((resolve) => {
    const reducedMotion = prefersReducedMotion();
    const effectiveDuration = reducedMotion ? 0 : duration;

    element.classList.add(animationClass);

    setTimeout(() => {
      element.classList.remove(animationClass);
      resolve();
    }, effectiveDuration);
  });
};

/**
 * React hook to trigger animation on element
 * @param {React.RefObject} elementRef - Ref to element to animate
 * @param {string} animationClass - Animation class
 * @param {number} duration - Duration in ms
 * @returns {object} { animate }
 */
export const useElementAnimation = (elementRef, animationClass, duration = 300) => {
  const reducedMotion = useReducedMotion();

  const animate = () => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const effectiveDuration = reducedMotion ? 0 : duration;

    element.classList.add(animationClass);

    setTimeout(() => {
      element.classList.remove(animationClass);
    }, effectiveDuration);
  };

  return { animate };
};

/* ============ TRANSITION UTILITIES ============ */

/**
 * Get inline transition style
 * @param {string} properties - Properties to transition (e.g., 'all', 'background-color')
 * @param {number} duration - Duration in ms
 * @param {boolean} respectReducedMotion - Whether to respect reduced motion preference
 * @returns {object} Inline style object
 */
export const transitionStyle = (
  properties = 'all',
  duration = 300,
  respectReducedMotion = true
) => {
  const shouldDisable = respectReducedMotion && prefersReducedMotion();

  return {
    transition: shouldDisable
      ? 'none'
      : `${properties} ${duration}ms ease-in-out`,
  };
};

/**
 * React hook for transition styles
 * @param {string} properties - Properties to transition
 * @param {number} duration - Duration in ms
 * @returns {object} Transition style object
 */
export const useTransition = (properties = 'all', duration = 300) => {
  const reducedMotion = useReducedMotion();

  return {
    transition: reducedMotion
      ? 'none'
      : `${properties} ${duration}ms ease-in-out`,
  };
};

/* ============ FADE ANIMATION HOOK ============ */

/**
 * Hook for fade in/out animations
 * @param {number} initialOpacity - Starting opacity (0-1)
 * @param {number} duration - Animation duration in ms
 * @returns {object} { opacity, fadeIn, fadeOut }
 */
export const useFadeAnimation = (initialOpacity = 0, duration = 300) => {
  const [opacity, setOpacity] = useState(initialOpacity);
  const reducedMotion = useReducedMotion();
  const effectiveDuration = reducedMotion ? 0 : duration;

  const fadeIn = () => {
    if (effectiveDuration === 0) {
      setOpacity(1);
    } else {
      setOpacity(1);
    }
  };

  const fadeOut = () => {
    if (effectiveDuration === 0) {
      setOpacity(0);
    } else {
      setOpacity(0);
    }
  };

  return {
    opacity,
    style: {
      opacity,
      transition: reducedMotion
        ? 'none'
        : `opacity ${effectiveDuration}ms ease-in-out`,
    },
    fadeIn,
    fadeOut,
  };
};

/* ============ SLIDE ANIMATION HOOK ============ */

/**
 * Hook for slide animations
 * @param {string} direction - 'up', 'down', 'left', 'right'
 * @param {number} distance - Slide distance in px
 * @param {number} duration - Animation duration in ms
 * @returns {object} Transform style and control functions
 */
export const useSlideAnimation = (
  direction = 'up',
  distance = 20,
  duration = 300
) => {
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `translateY(${distance}px)`;
        case 'down':
          return `translateY(-${distance}px)`;
        case 'left':
          return `translateX(${distance}px)`;
        case 'right':
          return `translateX(-${distance}px)`;
        default:
          return 'none';
      }
    }
    return 'none';
  };

  return {
    style: {
      opacity: isVisible ? 1 : 0,
      transform: getTransform(),
      transition: reducedMotion
        ? 'none'
        : `all ${duration}ms ease-in-out`,
    },
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    isVisible,
  };
};

/* ============ SCALE ANIMATION HOOK ============ */

/**
 * Hook for scale animations (e.g., modal open/close)
 * @param {number} fromScale - Starting scale (e.g., 0.9)
 * @param {number} toScale - Ending scale (e.g., 1)
 * @param {number} duration - Animation duration in ms
 * @returns {object} Scale style and control functions
 */
export const useScaleAnimation = (
  fromScale = 0.9,
  toScale = 1,
  duration = 300
) => {
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  return {
    style: {
      opacity: isVisible ? 1 : 0,
      transform: `scale(${isVisible ? toScale : fromScale})`,
      transition: reducedMotion
        ? 'none'
        : `all ${duration}ms ease-in-out`,
    },
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    isVisible,
  };
};

/* ============ SHAKE ANIMATION HOOK ============ */

/**
 * Hook for shake animation (e.g., form errors)
 * @param {number} duration - Animation duration in ms
 * @returns {object} { shake, isShaking }
 */
export const useShakeAnimation = (duration = 400) => {
  const [isShaking, setIsShaking] = useState(false);
  const reducedMotion = useReducedMotion();
  const timeoutRef = useRef(null);

  const shake = () => {
    if (reducedMotion) return; // Don't shake if user prefers reduced motion

    setIsShaking(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsShaking(false);
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    shake,
    isShaking,
    className: isShaking ? 'shake' : '',
  };
};

/* ============ SCROLL ANIMATION HOOK ============ */

/**
 * Hook for animations triggered on scroll (Intersection Observer)
 * @param {React.RefObject} ref - Ref to element to observe
 * @param {object} options - Intersection Observer options
 * @returns {boolean} Whether element is visible
 */
export const useScrollAnimation = (
  ref,
  options = { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }
) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isVisible;
};

/* ============ DEBOUNCED ANIMATION ============ */

/**
 * Hook for debounced animations to prevent animation spam
 * @param {Function} callback - Animation callback
 * @param {number} delay - Debounce delay in ms
 * @returns {Function} Debounced animation function
 */
export const useDebouncedAnimation = (callback, delay = 300) => {
  const timeoutRef = useRef(null);

  const debouncedAnimate = (...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedAnimate;
};

/* ============ ANIMATION TIMING UTILITIES ============ */

/**
 * Get animation duration considering user preferences
 * Extends duration for seniors or those with reduced motion
 * @param {number} baseDuration - Base duration in ms
 * @param {boolean} isSenior - Whether user is senior
 * @returns {number}
 */
export const getAnimationDuration = (baseDuration = 300, isSenior = false) => {
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    return 0; // Instant for reduced motion
  }

  if (isSenior) {
    return baseDuration * 1.3; // 30% longer for seniors
  }

  return baseDuration;
};

/**
 * React hook for adaptive animation duration
 * @param {number} baseDuration - Base duration in ms
 * @param {boolean} isSenior - Whether user is senior
 * @returns {number}
 */
export const useAnimationDuration = (baseDuration = 300, isSenior = false) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return 0;
  }

  return isSenior ? baseDuration * 1.3 : baseDuration;
};

/* ============ CLASS NAME UTILITIES ============ */

/**
 * Dynamically build animation class names respecting reduced motion
 * @param {string} baseClass - Base animation class
 * @param {boolean} shouldAnimate - Whether animation should play
 * @returns {string}
 */
export const getAnimationClassName = (baseClass, shouldAnimate = true) => {
  const reducedMotion = prefersReducedMotion();

  if (!shouldAnimate || reducedMotion) {
    return '';
  }

  return baseClass;
};

/**
 * React hook for animation class names
 * @param {string} baseClass - Base animation class
 * @param {boolean} shouldAnimate - Whether animation should play
 * @returns {string}
 */
export const useAnimationClassName = (baseClass, shouldAnimate = true) => {
  const reducedMotion = useReducedMotion();

  if (!shouldAnimate || reducedMotion) {
    return '';
  }

  return baseClass;
};

/* ============ EXPORT DEFAULT ============ */

export const animationUtils = {
  prefersReducedMotion,
  useReducedMotion,
  useAnimation,
  useStaggerAnimation,
  animateElement,
  useElementAnimation,
  transitionStyle,
  useTransition,
  useFadeAnimation,
  useSlideAnimation,
  useScaleAnimation,
  useShakeAnimation,
  useScrollAnimation,
  useDebouncedAnimation,
  getAnimationDuration,
  useAnimationDuration,
  getAnimationClassName,
  useAnimationClassName,
};

export default animationUtils;
