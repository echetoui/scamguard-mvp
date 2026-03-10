/**
 * AuthCallback - Handles OAuth callback from Cognito Hosted UI
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuth, setUserId } from '../utils/authStorage';
import './AuthCallback.css';

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
    <div className="auth-callback-container">
      {status === 'processing' && (
        <>
          <div className="auth-spinner" />
          <p className="auth-status-text">
            Connexion en cours...
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="auth-success-icon">
            <span className="auth-success-mark">✓</span>
          </div>
          <p className="auth-status-text">
            Connexion réussie ! Redirection...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="auth-error-icon">
            <span className="auth-error-mark">✗</span>
          </div>
          <p className="auth-error-text">
            Erreur de connexion. Redirection...
          </p>
        </>
      )}
    </div>
  );
};

export default AuthCallback;