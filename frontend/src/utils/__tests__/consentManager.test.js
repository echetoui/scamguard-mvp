/**
 * Consent Manager Utility Tests
 *
 * Tests for localStorage persistence and consent management
 */

import {
  getConsent,
  setConsent,
  clearConsent,
  getConsentData,
  hasConsentedAfter,
  getConsentVersion,
  needsReConsent,
  initializeConsent,
  exportConsentData,
  quickCheckConsent
} from '../consentManager';

describe('consentManager Utility', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getConsent', () => {
    it('should return false if consent is not set', () => {
      expect(getConsent()).toBe(false);
    });

    it('should return true if consent is set to true', () => {
      localStorage.setItem('scamguard-user-consent', 'true');
      expect(getConsent()).toBe(true);
    });

    it('should return false if consent is set to false', () => {
      localStorage.setItem('scamguard-user-consent', 'false');
      expect(getConsent()).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(getConsent()).toBe(false);

      Storage.prototype.getItem.mockRestore();
    });
  });

  describe('setConsent', () => {
    it('should set consent to true', () => {
      setConsent(true);
      expect(getConsent()).toBe(true);
    });

    it('should set consent to false', () => {
      setConsent(false);
      expect(getConsent()).toBe(false);
    });

    it('should store consent data with timestamp', () => {
      setConsent(true);
      const data = getConsentData();

      expect(data).not.toBeNull();
      expect(data.consented).toBe(true);
      expect(data.timestamp).toBeDefined();
      expect(data.version).toBe(1);
    });

    it('should handle localStorage errors gracefully', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw error
      setConsent(true);

      Storage.prototype.setItem.mockRestore();
    });
  });

  describe('clearConsent', () => {
    it('should clear consent from localStorage', () => {
      setConsent(true);
      expect(getConsent()).toBe(true);

      clearConsent();
      expect(getConsent()).toBe(false);
    });

    it('should clear consent data', () => {
      setConsent(true);
      expect(getConsentData()).not.toBeNull();

      clearConsent();
      expect(getConsentData()).toBeNull();
    });
  });

  describe('getConsentData', () => {
    it('should return null if consent is not set', () => {
      expect(getConsentData()).toBeNull();
    });

    it('should return consent data object', () => {
      setConsent(true);
      const data = getConsentData();

      expect(data).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.version).toBe(1);
      expect(data.consented).toBe(true);
    });

    it('should return valid JSON', () => {
      setConsent(true);
      const data = getConsentData();

      expect(typeof data).toBe('object');
      expect(typeof data.timestamp).toBe('string');
      expect(typeof data.version).toBe('number');
    });
  });

  describe('hasConsentedAfter', () => {
    it('should return false if consent is not set', () => {
      expect(hasConsentedAfter('2020-01-01T00:00:00Z')).toBe(false);
    });

    it('should return true if user consented after the given date', () => {
      setConsent(true);
      const afterDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      expect(hasConsentedAfter(afterDate.toISOString())).toBe(true);
    });

    it('should return false if user consented before the given date', () => {
      setConsent(true);
      // Mock the consent timestamp
      localStorage.setItem('scamguard-consent-data', JSON.stringify({
        timestamp: '2020-01-01T00:00:00Z',
        version: 1,
        consented: true
      }));

      const afterDate = new Date(Date.now()).toISOString();
      expect(hasConsentedAfter(afterDate)).toBe(false);
    });
  });

  describe('getConsentVersion', () => {
    it('should return null if consent is not set', () => {
      expect(getConsentVersion()).toBeNull();
    });

    it('should return version number', () => {
      setConsent(true);
      expect(getConsentVersion()).toBe(1);
    });
  });

  describe('needsReConsent', () => {
    it('should return true if user has not consented', () => {
      expect(needsReConsent(1)).toBe(true);
    });

    it('should return false if user consented to current version', () => {
      setConsent(true);
      expect(needsReConsent(1)).toBe(false);
    });

    it('should return true if current version is higher than consented version', () => {
      setConsent(true);
      expect(needsReConsent(2)).toBe(true);
    });

    it('should return false if user consented to newer version', () => {
      // Manually set consent data with higher version
      localStorage.setItem('scamguard-consent-data', JSON.stringify({
        timestamp: new Date().toISOString(),
        version: 2,
        consented: true
      }));
      localStorage.setItem('scamguard-user-consent', 'true');

      expect(needsReConsent(1)).toBe(false);
    });
  });

  describe('initializeConsent', () => {
    it('should not throw error', () => {
      expect(() => initializeConsent()).not.toThrow();
    });

    it('should test localStorage availability', () => {
      jest.spyOn(Storage.prototype, 'setItem');
      initializeConsent();
      expect(Storage.prototype.setItem).toHaveBeenCalled();
      Storage.prototype.setItem.mockRestore();
    });

    it('should set up storage event listener', () => {
      jest.spyOn(window, 'addEventListener');
      initializeConsent();
      expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
      window.addEventListener.mockRestore();
    });
  });

  describe('exportConsentData', () => {
    it('should export current consent status', () => {
      setConsent(true);
      const exported = exportConsentData();

      expect(exported.consent).toBe(true);
      expect(exported.timestamp).toBeDefined();
    });

    it('should include consent data', () => {
      setConsent(true);
      const exported = exportConsentData();

      expect(exported.consentData).toBeDefined();
      expect(exported.consentData.version).toBe(1);
    });

    it('should return null if consent data is invalid', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage error');
      });

      const exported = exportConsentData();
      expect(exported).toBeNull();

      Storage.prototype.getItem.mockRestore();
    });
  });

  describe('quickCheckConsent', () => {
    it('should return false if consent is not set', () => {
      expect(quickCheckConsent()).toBe(false);
    });

    it('should return true if consent is true', () => {
      localStorage.setItem('scamguard-user-consent', 'true');
      expect(quickCheckConsent()).toBe(true);
    });

    it('should not modify localStorage', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      quickCheckConsent();

      expect(getItemSpy).toHaveBeenCalled();
      expect(setItemSpy).not.toHaveBeenCalled();

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });

    it('should handle errors silently', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage error');
      });

      expect(quickCheckConsent()).toBe(false);

      Storage.prototype.getItem.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete user consent flow', () => {
      // Initial state
      expect(getConsent()).toBe(false);

      // User provides consent
      setConsent(true);
      expect(getConsent()).toBe(true);
      expect(getConsentData()).not.toBeNull();

      // Check needs re-consent
      expect(needsReConsent(1)).toBe(false);
      expect(needsReConsent(2)).toBe(true);

      // Clear consent (e.g., logout)
      clearConsent();
      expect(getConsent()).toBe(false);
    });

    it('should maintain consent across getConsent calls', () => {
      setConsent(true);

      // Multiple calls should return consistent value
      expect(getConsent()).toBe(true);
      expect(getConsent()).toBe(true);
      expect(getConsent()).toBe(true);
    });

    it('should track consent timestamp accurately', (done) => {
      const beforeTime = new Date();

      setConsent(true);

      const afterTime = new Date();
      const data = getConsentData();
      const consentTime = new Date(data.timestamp);

      // Consent time should be between before and after
      expect(consentTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(consentTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 100); // +100ms for timing

      done();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => setConsent(true)).not.toThrow();

      Storage.prototype.setItem.mockRestore();
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('scamguard-consent-data', 'invalid json {');

      // Should handle gracefully
      expect(() => getConsentData()).not.toThrow();
      expect(getConsentData()).toBeNull();
    });

    it('should handle missing localStorage keys', () => {
      localStorage.setItem('scamguard-user-consent', 'true');
      // Don't set consent data

      const data = getConsentData();
      expect(data).toBeNull();
    });
  });
});
