import { Card, Badge } from '@/design-system';
import './GuardianSummary.css';

/**
 * GuardianSummary Component
 * Compact family widget showing member count and threat status
 *
 * @component
 * @param {Object} familyData - { familyName, members, threats }
 * @param {boolean} loading - Loading state
 * @param {function} onViewFamily - Callback to navigate to family tab
 * @returns {JSX.Element|null} Guardian summary card or null if no family
 */
export default function GuardianSummary({ familyData, loading, onViewFamily }) {
  // Return null if no family data or still loading
  if (loading || (!familyData.familyName && familyData.members.length === 0)) {
    return null;
  }

  const hasThreat = familyData.threats && familyData.threats.length > 0;

  return (
    <div className="guardian-summary">
      <Card variant="outlined">
        <div className="guardian-summary-header">
          <h3>👨‍👩‍👧‍👦 Ma Famille</h3>
          {hasThreat && (
            <Badge variant="filled" color="error" size="small">
              ⚠️ {familyData.threats.length} menace{familyData.threats.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <p className="guardian-summary-count">
          {familyData.members.length} membre{familyData.members.length !== 1 ? 's' : ''} protégé{familyData.members.length !== 1 ? 's' : ''}
        </p>
        {!hasThreat && (
          <p className="guardian-summary-safe">✅ Aucune menace récente</p>
        )}
        <button className="guardian-summary-link" onClick={onViewFamily}>
          Voir Famille →
        </button>
      </Card>
    </div>
  );
}
