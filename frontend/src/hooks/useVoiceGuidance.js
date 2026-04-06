import { useState, useEffect } from 'react';

export const useVoiceGuidance = () => {
  const [isVoiceGuidanceEnabled, setIsVoiceGuidanceEnabled] = useState(
    () => localStorage.getItem('voiceGuidance') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('voiceGuidance', isVoiceGuidanceEnabled);
  }, [isVoiceGuidanceEnabled]);

  const toggleVoiceGuidance = () => {
    setIsVoiceGuidanceEnabled((prev) => !prev);
  };

  return { isVoiceGuidanceEnabled, toggleVoiceGuidance };
};
