import React, { useState } from 'react';
import Button from '../Button';
import Card from '../Card';
import { apiService } from '../services/api';

const AuthScreen = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'verify'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    code: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Styles inline pour garantir l'accessibilité (hauteur 60px) sans dépendre du CSS global
  const inputStyle = {
    width: '100%',
    minHeight: '60px',
    padding: '12px 16px',
    fontSize: '18px',
    border: '2px solid #ccc',
    borderRadius: '8px',
    marginBottom: '16px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '18px',
    color: 'var(--color-text-main)'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const response = await apiService.login(formData.email, formData.password);
        if (onLoginSuccess) onLoginSuccess(response);
      } else if (mode === 'signup') {
        await apiService.signup(formData.email, formData.password);
        setMode('verify');
        setSuccessMsg('Compte créé ! Un code a été envoyé à votre courriel.');
      } else if (mode === 'verify') {
        await apiService.verify(formData.email, formData.code);
        setMode('login');
        setSuccessMsg('Courriel vérifié avec succès ! Vous pouvez vous connecter.');
        setFormData(prev => ({ ...prev, code: '' }));
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setSuccessMsg(null);
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="auth-screen fade-in">
      <Card title={mode === 'login' ? 'Connexion' : (mode === 'signup' ? 'Créer un compte' : 'Vérification')}>
        
        {error && (
          <div style={{ 
            backgroundColor: 'var(--color-danger-bg)', 
            color: 'var(--color-danger)', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            borderLeft: '6px solid var(--color-danger)',
            fontWeight: 'bold'
          }} role="alert">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div style={{ 
            backgroundColor: 'var(--color-success-bg)', 
            color: 'var(--color-success)', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            borderLeft: '6px solid var(--color-success)',
            fontWeight: 'bold'
          }} role="status">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode !== 'verify' && (
            <>
              <div>
                <label htmlFor="email" style={labelStyle}>Courriel</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={inputStyle}
                  required
                  placeholder="exemple@courriel.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" style={labelStyle}>Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={inputStyle}
                  required
                  placeholder="Votre mot de passe"
                  autoComplete={mode === 'login' ? "current-password" : "new-password"}
                />
              </div>
            </>
          )}

          {mode === 'verify' && (
            <div>
              <p style={{marginBottom: '16px'}}>Entrez le code reçu à <strong>{formData.email}</strong></p>
              <label htmlFor="code" style={labelStyle}>Code de vérification</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                style={inputStyle}
                required
                placeholder="Ex: 123456"
                maxLength="6"
                autoComplete="one-time-code"
              />
            </div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            disabled={isLoading}
            style={{ marginTop: '10px' }}
          >
            {isLoading ? 'Chargement...' : (
              mode === 'login' ? 'Se connecter' : (
                mode === 'signup' ? "M'inscrire" : 'Vérifier le code'
              )
            )}
          </Button>
        </form>

        {mode !== 'verify' && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Button 
              variant="outline" 
              onClick={toggleMode}
              type="button"
            >
              {mode === 'login' ? "Je n'ai pas de compte" : "J'ai déjà un compte"}
            </Button>
          </div>
        )}
        
        {mode === 'verify' && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
             <Button 
              variant="outline" 
              onClick={() => setMode('signup')}
              type="button"
            >
              Retour
            </Button>
          </div>
        )}

      </Card>
    </div>
  );
};

export default AuthScreen;