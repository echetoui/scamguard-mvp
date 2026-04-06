import React, { useState } from 'react';
import PhoneInputScreen from './PhoneInputScreen';
import OTPVerificationScreen from './OTPVerificationScreen';

export default function AuthFlow({ onLoginSuccess }) {
  const [step, setStep] = useState('PHONE_INPUT'); // 'PHONE_INPUT' | 'OTP_VERIFICATION'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. L'utilisateur soumet son numéro
  const handleRequestCode = async (phone) => {
    setErrorMsg('');
    try {
      // Use relative path for Vite proxy, or env var for custom API URL
      const API_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(`${API_URL}/auth/request-sms-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du code");
      }

      setPhoneNumber(phone);
      setStep('OTP_VERIFICATION'); // Bascule vers l'écran du code
    } catch (error) {
      console.error("Erreur API:", error);
      setErrorMsg("Impossible d'envoyer le code. Le serveur backend est-il démarré ?");
    }
  };

  // 2. L'utilisateur soumet (ou auto-remplit) le code à 4 chiffres
  const handleVerifyCode = async (code) => {
    setErrorMsg('');
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(`${API_URL}/auth/verify-sms-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, code }),
      });

      if (!response.ok) {
        throw new Error("Code invalide ou expiré");
      }

      const data = await response.json();
      // Si succès, on passe le token et les infos utilisateur au contexte global (useAuth)
      const user = {
        user_id: data.data.user_id,
        phone_number: data.data.phone_number,
      };
      onLoginSuccess(user, data.data.token); 
    } catch (error) {
      console.error("Erreur API:", error);
      setErrorMsg("Le code saisi n'est pas valide ou a expiré.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {step === 'PHONE_INPUT' ? (
        <PhoneInputScreen onRequestCode={handleRequestCode} errorMsg={errorMsg} />
      ) : (
        <OTPVerificationScreen
          phoneNumber={phoneNumber}
          onVerifySuccess={handleVerifyCode}
          errorMsg={errorMsg}
        />
      )}
    </div>
  );
}