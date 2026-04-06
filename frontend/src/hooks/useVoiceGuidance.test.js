import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceGuidance } from './useVoiceGuidance';

describe('useVoiceGuidance Hook', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with false by default', () => {
    const { result } = renderHook(() => useVoiceGuidance());
    expect(result.current.isVoiceGuidanceEnabled).toBe(false);
  });

  it('should initialize with value from localStorage', () => {
    localStorage.setItem('voiceGuidance', 'true');
    const { result } = renderHook(() => useVoiceGuidance());
    expect(result.current.isVoiceGuidanceEnabled).toBe(true);
  });

  it('should toggle from false to true', () => {
    const { result } = renderHook(() => useVoiceGuidance());

    act(() => {
      result.current.toggleVoiceGuidance();
    });

    expect(result.current.isVoiceGuidanceEnabled).toBe(true);
    expect(localStorage.getItem('voiceGuidance')).toBe('true');
  });

  it('should toggle from true to false', () => {
    localStorage.setItem('voiceGuidance', 'true');
    const { result } = renderHook(() => useVoiceGuidance());

    act(() => {
      result.current.toggleVoiceGuidance();
    });

    expect(result.current.isVoiceGuidanceEnabled).toBe(false);
    expect(localStorage.getItem('voiceGuidance')).toBe('false');
  });
});
