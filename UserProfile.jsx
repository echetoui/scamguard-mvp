import React from 'react';
import Card from '../Card';
import Button from '../Button';

const UserProfile = ({ user, onLogout }) => {
  if (!user) return null;

  return (
    <Card title="Mon Profil" className="user-profile">
      <div style={{ marginBottom: '20px', fontSize: '18px' }}>
        <p style={{ margin: '0 0 10px 0' }}><strong>Compte connecté :</strong></p>
        <p style={{ margin: '0', color: 'var(--color-primary)', fontWeight: 'bold' }}>{user.email}</p>
      </div>
      
      <Button variant="outline" onClick={onLogout} style={{ minHeight: '50px' }}>
        Se déconnecter
      </Button>
    </Card>
  );
};

export default UserProfile;