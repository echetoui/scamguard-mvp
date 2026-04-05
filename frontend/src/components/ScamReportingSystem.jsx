/**
 * ScamReportingSystem Component (Phase 5B)
 * 
 * Senior-First Design:
 * - Stepper clair (3 étapes simples)
 * - Grandes zones de clic (règle des 60px)
 * - Typographie lisible (Cormorant Garamond / Lora)
 * - Zone de glisser-déposer / upload de capture d'écran
 */

import React, { useState, useRef } from 'react';
import useScamReport from '../hooks/useScamReport';
import './ScamReportingSystem.css';
import '../styles/utility-classes.css';

export default function ScamReportingSystem() {
  const { submitReport, isLoading, error } = useScamReport();
  const [currentStep, setCurrentStep] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    scamType: '',
    description: '',
    screenshot: null,
    screenshotName: '',
    rawFile: null
  });
  
  const fileInputRef = useRef(null);

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        screenshot: URL.createObjectURL(file),
        screenshotName: file.name,
        rawFile: file
      }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await submitReport(formData);
    
    if (result.success) {
      setSuccessMessage("Signalement envoyé avec succès ! L'équipe ScamGuard analyse ce message. Merci de protéger la communauté.");
      // Réinitialisation après succès
      setTimeout(() => {
        setCurrentStep(1);
        setFormData({ scamType: '', description: '', screenshot: null, screenshotName: '', rawFile: null });
        setSuccessMessage('');
      }, 5000);
    }
  };

  return (
    <main className="reporting-main" role="main">
      <div className="reporting-container">
        <header className="reporting-header">
          <h1>Signaler un message suspect</h1>
          <p>Aidez la communauté en signalant les arnaques que vous recevez.</p>
        </header>

        {/* Stepper Progress */}
        <nav aria-label="Progression du signalement" className="stepper">
          <ol className="stepper-list">
            <li className={`stepper-item ${currentStep >= 1 ? 'active' : ''}`} aria-current={currentStep === 1 ? 'step' : undefined}>
              <span className="step-circle">1</span>
              <span className="step-label">Détails</span>
            </li>
            <li className="stepper-separator" aria-hidden="true"></li>
            <li className={`stepper-item ${currentStep >= 2 ? 'active' : ''}`} aria-current={currentStep === 2 ? 'step' : undefined}>
              <span className="step-circle">2</span>
              <span className="step-label">Preuve</span>
            </li>
            <li className="stepper-separator" aria-hidden="true"></li>
            <li className={`stepper-item ${currentStep >= 3 ? 'active' : ''}`} aria-current={currentStep === 3 ? 'step' : undefined}>
              <span className="step-circle">3</span>
              <span className="step-label">Validation</span>
            </li>
          </ol>
        </nav>

        {/* Step 1: Details */}
        {currentStep === 1 && (
          <section className="step-content animate-fade-in" aria-labelledby="step1-heading">
            <h2 id="step1-heading">De quel type d'arnaque s'agit-il ?</h2>
            <div className="form-group">
              <label htmlFor="scamType">Type de message</label>
              <select 
                id="scamType" 
                name="scamType" 
                className="form-input" 
                value={formData.scamType} 
                onChange={handleChange}
              >
                <option value="">Sélectionnez une option...</option>
                <option value="sms">SMS (Texto)</option>
                <option value="email">Courriel (Email)</option>
                <option value="call">Appel téléphonique</option>
                <option value="social">Réseaux sociaux (Facebook, etc.)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="description">Que disait le message ? (Optionnel)</label>
              <textarea 
                id="description" 
                name="description" 
                className="form-input textarea" 
                placeholder="Ex: Ils m'ont demandé de cliquer sur un lien pour un colis..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </section>
        )}

        {/* Step 2: Proof (Upload) */}
        {currentStep === 2 && (
          <section className="step-content animate-fade-in" aria-labelledby="step2-heading">
            <h2 id="step2-heading">Ajouter une capture d'écran</h2>
            <p className="step-instruction">Une photo nous aide à mieux analyser et bloquer cette arnaque pour les autres.</p>
            
            <div 
              className="upload-area" 
              onClick={triggerFileInput}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerFileInput()}
              aria-label="Cliquez pour ajouter une capture d'écran ou une photo"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="visually-hidden" 
                tabIndex="-1"
              />
              <div className="upload-icon">📸</div>
              <span className="upload-text">
                {formData.screenshotName ? formData.screenshotName : "Prendre une photo ou choisir un fichier"}
              </span>
            </div>
            
            {formData.screenshot && (
              <div className="image-preview">
                <p>Aperçu de votre image :</p>
                <img src={formData.screenshot} alt="Aperçu du signalement" />
              </div>
            )}
          </section>
        )}

        {/* Step 3: Validation */}
        {currentStep === 3 && (
          <section className="step-content animate-fade-in" aria-labelledby="step3-heading">
            <h2 id="step3-heading">Résumé de votre signalement</h2>
            <div className="summary-card">
              <p><strong>Type :</strong> {formData.scamType || 'Non spécifié'}</p>
              <p><strong>Description :</strong> {formData.description || 'Aucune description fournie'}</p>
              <p><strong>Preuve :</strong> {formData.screenshotName ? '✅ Image jointe' : '❌ Aucune image'}</p>
            </div>
            <div className="privacy-notice">
              <span className="icon">🔒</span>
              <p>Vos informations personnelles seront masquées et protégées avant l'analyse.</p>
            </div>
          </section>
        )}
        
        {/* Feedbacks */}
        {error && (
          <div className="error-message mt-xl" role="alert">⚠️ {error}</div>
        )}
        {successMessage && (
          <div className="success-msg mt-xl" role="alert">✅ {successMessage}</div>
        )}

        {/* Navigation Buttons */}
        <footer className="reporting-actions">
          {currentStep > 1 && (
            <button type="button" className="btn-secondary" onClick={handlePrev}>
              Retour
            </button>
          )}
          {currentStep < 3 ? (
            <button type="button" className="btn-primary" onClick={handleNext} disabled={currentStep === 1 && !formData.scamType}>
              Suivant
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={handleSubmit} disabled={isLoading || successMessage}>
              {isLoading ? '⏳ Envoi en cours...' : '🛡️ Soumettre le signalement'}
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}