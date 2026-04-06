/**
 * Design System Demo Page
 * Showcases all new Figma-synced components
 */

import React, { useState } from 'react';
import RiskScore from './RiskScore';
import ThreatCard from './ThreatCard';
import SMSMessage from './SMSMessage';
import QuizCard from './QuizCard';
import './DesignSystemDemo.css';

export default function DesignSystemDemo() {
  const [quizAnswers, setQuizAnswers] = useState({});

  const quizOptions = [
    { id: 'a', text: 'This is clearly a phishing email', correct: true },
    { id: 'b', text: 'This looks legitimate, safe to click', correct: false },
    { id: 'c', text: 'I need more information to decide', correct: false }
  ];

  const handleQuizAnswer = (questionId, id, correct) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: { id, correct }
    }));
    console.log(`Question ${questionId}: Selected ${id}, Correct: ${correct}`);
  };

  return (
    <div className="design-system-demo">
      {/* Header */}
      <header className="demo-header">
        <h1>🎨 ScamGuard Design System</h1>
        <p>Material Design 3 Components - Figma Synced</p>
      </header>

      {/* Risk Score Section */}
      <section className="demo-section">
        <h2>Risk Score Component</h2>
        <p className="demo-description">Visual risk assessment with color-coded severity</p>
        
        <div className="demo-grid">
          <div className="demo-item">
            <h3>Safe Level</h3>
            <RiskScore level="safe" score={15} label="Bank Login" animated={true} />
          </div>
          
          <div className="demo-item">
            <h3>Moderate Level</h3>
            <RiskScore level="moderate" score={55} label="Unknown Sender" animated={true} />
          </div>
          
          <div className="demo-item">
            <h3>Danger Level</h3>
            <RiskScore level="danger" score={92} label="Phishing Link" animated={true} />
          </div>
        </div>
      </section>

      {/* Threat Card Section */}
      <section className="demo-section">
        <h2>Threat Card Component</h2>
        <p className="demo-description">Display threat information with severity-based styling</p>
        
        <div className="demo-grid">
          <ThreatCard
            severity="low"
            title="Unusual Login Attempt"
            description="Login from an unfamiliar location or device detected."
            icon="📍"
            onAction={() => alert('Learn more: Unusual login')}
          />
          
          <ThreatCard
            severity="medium"
            title="Suspicious Email"
            description="Email contains common phishing patterns and suspicious links."
            icon="📧"
            onAction={() => alert('Learn more: Suspicious email')}
          />
          
          <ThreatCard
            severity="danger"
            title="Confirmed Malware"
            description="File contains known malicious signature. Do not open."
            icon="⚠️"
            onAction={() => alert('Learn more: Malware detected')}
          />
        </div>
      </section>

      {/* SMS Message Section */}
      <section className="demo-section">
        <h2>SMS Message Component</h2>
        <p className="demo-description">SMS verdict display with color-coded background</p>
        
        <div className="demo-grid">
          <SMSMessage
            verdict="scam"
            message="Verify your account: bit.ly/verify123 Click now or lose access!"
            sender="+1234567890"
            onReport={() => alert('Report submitted: Scam SMS')}
          />
          
          <SMSMessage
            verdict="legitimate"
            message="Your appointment with Dr. Smith is confirmed for tomorrow at 2:00 PM."
            sender="Dr. Smith's Office"
            onReport={() => alert('Report submitted: Legitimate SMS')}
          />
          
          <SMSMessage
            verdict="suspicious"
            message="Confirm your payment details for account verification."
            sender="Bank Support"
            onReport={() => alert('Report submitted: Suspicious SMS')}
          />
        </div>
      </section>

      {/* Quiz Card Section */}
      <section className="demo-section">
        <h2>Quiz Card Component</h2>
        <p className="demo-description">Interactive quiz questions with answer validation</p>
        
        <div className="demo-quiz">
          <QuizCard
            question="Which of these emails is a phishing attempt?"
            options={quizOptions}
            onAnswer={(id, correct) => handleQuizAnswer('q1', id, correct)}
            category="Email Security"
            number={1}
          />
          
          <div className="quiz-feedback">
            {quizAnswers.q1 && (
              <div className={`feedback ${quizAnswers.q1.correct ? 'correct' : 'incorrect'}`}>
                {quizAnswers.q1.correct 
                  ? '✅ Correct! Phishing emails often create urgency.' 
                  : '❌ Incorrect. Try again!'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="demo-section features">
        <h2>Design System Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">♿</span>
            <h3>WCAG AAA</h3>
            <p>Full accessibility compliance with 7:1 contrast ratios</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">📱</span>
            <h3>Responsive</h3>
            <p>Works perfectly on mobile, tablet, and desktop</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">🎨</span>
            <h3>Material Design 3</h3>
            <p>Synced colors, tokens, and typography from Figma</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">✨</span>
            <h3>Animations</h3>
            <p>Smooth transitions with reduced motion support</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">🌓</span>
            <h3>Dark Mode</h3>
            <p>Complete inverted color palette support</p>
          </div>
          
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Production Ready</h3>
            <p>Battle-tested with comprehensive unit tests</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="demo-footer">
        <p>All components follow MD3 guidelines and ScamGuard brand colors</p>
        <p>Primary: #005FAF | Secondary: #1B6B3A | Error: #BA1A1A</p>
      </footer>
    </div>
  );
}
