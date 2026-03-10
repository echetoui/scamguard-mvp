/**
 * AuthCallback - Handles OAuth callback from Cognito Hosted UI
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuth, setUserId } from '../utils/authStorage';

const AuthCallback = () => {
  const [status, setStatus] = useState('processing');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          setStatus('error');
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          setStatus('error');
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        // Exchange code for tokens
        const tokenResponse = await fetch(`${process.env.REACT_APP_COGNITO_HOSTED_UI_URL}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.REACT_APP_COGNITO_CLIENT_ID,
            code: code,
            redirect_uri: window.location.origin + '/auth/callback',
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Token exchange failed');
        }

        const tokens = await tokenResponse.json();

        // Store tokens
        setAuth({
          id_token: tokens.id_token,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
        });

        // Extract user info from ID token
        const idTokenPayload = JSON.parse(atob(tokens.id_token.split('.')[1]));
        setUserId(idTokenPayload.sub);

        setStatus('success');
        
        // Redirect to dashboard
        setTimeout(() => navigate('/dashboard'), 1000);

      } catch (error) {
        console.error('Callback handling error:', error);
        setStatus('error');
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'Lora, serif',
      background: '#FFF9F3'
    }}>
      {status === 'processing' && (
        <>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #D4A574',
            borderTop: '3px solid #C85A2A',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }} />
          <p style={{ color: '#7A9B7F', fontSize: '1.1rem' }}>
            Connexion en cours...
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#7A9B7F',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <span style={{ color: 'white', fontSize: '1.5rem' }}>✓</span>
          </div>
          <p style={{ color: '#7A9B7F', fontSize: '1.1rem' }}>
            Connexion réussie ! Redirection...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#C85A2A',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <span style={{ color: 'white', fontSize: '1.5rem' }}>✗</span>
          </div>
          <p style={{ color: '#C85A2A', fontSize: '1.1rem' }}>
            Erreur de connexion. Redirection...
          </p>
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;