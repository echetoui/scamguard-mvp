import React from 'react';
import Card from '../../Card';
import { LIMITS } from '../../constants';
import UserProfile from '../UserProfile';

const HistoryView = ({ history, user, onLogout }) => {
  return (
    <div className="history-view fade-in">
      {user && <UserProfile user={user} onLogout={onLogout} />}
      <h2>📜 Historique</h2>
      {history.length === 0 ? (
        <Card><p className="text-center">Aucune analyse pour le moment.</p></Card>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <div className={`history-score ${item.score > LIMITS.SCORE_THRESHOLD ? 'good' : 'bad'}`}>
                {item.score}
              </div>
              <div className="history-details">
                <span className="history-date">{item.date}</span>
                <p>{item.summary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;