/**
 * Consent Manager Utility
 *
 * Handles localStorage persistence for user consent
 * Provides functions to get, set, and clear consent
 *
 * Usage:
 *   import { getConsent, setConsent } from './consentManager';
 *
 *   // Check if user has consented
 *   if (!getConsent()) {
 *     showConsentBanner();
 *   }
 *
 *   // Save consent
 *   setConsent(true);
 *
 *   // Clear consent (e.g., when user logs out)
 *   clearConsent();
 */

const CONSENT_KEY = 'scamguard-user-consent';
const CONSENT_VERSION = 1;
const CONSENT_DATA_KEY = 'scamguard-consent-data';

/**
 * Get user consent status from localStorage
 *
 * @returns {boolean} True if user has consented, false otherwise
 */
export function getConsent() {
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent === 'true';
  } catch (error) {
    console.warn('Error reading consent from localStorage:', error);
    return false;
  }
}

/**
 * Set user consent status in localStorage
 *
 * @param {boolean} consented - Whether user has consented
 */
export function setConsent(consented) {
  try {
    localStorage.setItem(CONSENT_KEY, String(consented));

    // Also store timestamp and version for audit trail
    const consentData = {
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
      consented: consented
    };
    localStorage.setItem(CONSENT_DATA_KEY, JSON.stringify(consentData));

    console.log('User consent saved:', consentData);
  } catch (error) {
    console.error('Error saving consent to localStorage:', error);
    // Fail silently - don't block the app if localStorage is unavailable
  }
}

/**
 * Clear user consent from localStorage
 * Used when user explicitly withdraws consent or logs out
 */
export function clearConsent() {
  try {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(CONSENT_DATA_KEY);
    console.log('User consent cleared');
  } catch (error) {
    console.error('Error clearing consent from localStorage:', error);
  }
}

/**
 * Get full consent data including timestamp
 *
 * @returns {object|null} Consent data object or null if not consented
 */
export function getConsentData() {
  try {
    const data = localStorage.getItem(CONSENT_DATA_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.warn('Error reading consent data from localStorage:', error);
    return null;
  }
}

/**
 * Check if user has consented after a certain date
 * Useful for re-consent flows after policy updates
 *
 * @param {string} afterDate - ISO date string (e.g., '2026-01-01T00:00:00Z')
 * @returns {boolean} True if user consented after the given date
 */
export function hasConsentedAfter(afterDate) {
  try {
    const consentData = getConsentData();
    if (!consentData || !consentData.timestamp) {
      return false;
    }
    const consentTime = new Date(consentData.timestamp);
    const afterTime = new Date(afterDate);
    return consentTime > afterTime;
  } catch (error) {
    console.warn('Error checking consent date:', error);
    return false;
  }
}

/**
 * Get consent version (for tracking policy version)
 *
 * @returns {number|null} Version number or null if not consented
 */
export function getConsentVersion() {
  try {
    const consentData = getConsentData();
    return consentData ? consentData.version : null;
  } catch (error) {
    console.warn('Error reading consent version:', error);
    return null;
  }
}

/**
 * Check if user needs to re-consent (e.g., policy was updated)
 *
 * @param {number} currentVersion - Current version of consent policy
 * @returns {boolean} True if user consented to older version
 */
export function needsReConsent(currentVersion) {
  try {
    const consentedVersion = getConsentVersion();
    return consentedVersion === null || consentedVersion < currentVersion;
  } catch (error) {
    console.warn('Error checking if re-consent needed:', error);
    return true; // Default to requiring consent if error
  }
}

/**
 * Initialize consent system
 * Call this on app startup to set up listeners
 */
export function initializeConsent() {
  // Check if localStorage is available
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
  } catch (error) {
    console.warn('localStorage is not available:', error);
  }

  // Listen for storage changes (e.g., from other tabs)
  window.addEventListener('storage', (event) => {
    if (event.key === CONSENT_KEY) {
      console.log('Consent changed in another tab:', event.newValue);
    }
  });
}

/**
 * Export consent data for GDPR/Loi 25 compliance
 *
 * @returns {object} All consent-related data
 */
export function exportConsentData() {
  try {
    return {
      consent: getConsent(),
      consentData: getConsentData(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Error exporting consent data:', error);
    return null;
  }
}

/**
 * Privacy-preserving consent check
 * Returns consent status without storing anything in localStorage
 * Useful for checking without modifying state
 *
 * @returns {boolean} Current consent status
 */
export function quickCheckConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'true';
  } catch (error) {
    return false;
  }
}
