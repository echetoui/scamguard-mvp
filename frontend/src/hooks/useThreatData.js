import { useMemo } from 'react';
import { THREAT_SCENARIOS } from '../data/scenarios/index.js';

/**
 * useThreatData Hook
 * Provides threat data and filtered threats based on user profile
 *
 * @param {Object} userProfile - User profile object with preferredInstitutions
 * @returns {Object} { threats, matchedThreats }
 */
export default function useThreatData(userProfile = null) {
  const threats = useMemo(() => THREAT_SCENARIOS, []);

  const matchedThreats = useMemo(() => {
    if (!userProfile?.preferredInstitutions?.length) {
      // Return top 5 high-level threats if no profile institutions
      return threats.filter(t => t.threat_level === 'high').slice(0, 5);
    }
    // Return threats matching user's preferred institutions
    return threats.filter(t =>
      userProfile.preferredInstitutions.some(inst =>
        t.institution.toLowerCase().includes(inst.toLowerCase())
      )
    );
  }, [threats, userProfile]);

  return { threats, matchedThreats };
}
