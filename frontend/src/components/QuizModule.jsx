/**
 * QuizModule Component
 * Phase 2 Sprint 6 - Enhanced Quizzes & Gamification
 *
 * Interactive quiz system for scam awareness training
 * Supports multiple quiz modules with difficulty levels and timing
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { QUIZ_MODULES } from '../data/quizModules';
import '../styles/QuizModule.css';

export default function QuizModule({ moduleId = null, difficultyFilter = 'intermediaire', onComplete, onBack, speak, isVoiceGuidanceEnabled })  {
  // Get questions for the selected module
  const currentModule = moduleId ? QUIZ_MODULES[moduleId] : null;
  const allQuestions = currentModule ? currentModule.questions : [];

  // Filter questions by difficulty
  const QUIZ_QUESTIONS = useMemo(() => {
    if (!allQuestions.length) return [];

    if (difficultyFilter === 'debutant') {
      return allQuestions.filter(q => q.difficulty === 'Facile');
    } else if (difficultyFilter === 'intermediaire') {
      return allQuestions.filter(q => q.difficulty === 'Facile' || q.difficulty === 'Moyen');
    } else if (difficultyFilter === 'expert') {
      return allQuestions.filter(q => q.difficulty === 'Moyen' || q.difficulty === 'Difficile');
    }
    return allQuestions;
  }, [allQuestions, difficultyFilter]);

  // Timer tracking
  const startTimeRef = useRef(null);

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
  }, []);

  const currentQuestion = QUIZ_QUESTIONS[currentQuizIndex];
  const isQuizComplete = answers.length === QUIZ_QUESTIONS.length;

  useEffect(() => {
    if (isVoiceGuidanceEnabled && currentQuestion) {
      speak(currentQuestion.question);
    }
  }, [currentQuestion, isVoiceGuidanceEnabled, speak]);

  // If no moduleId provided, return null (QuizAcademie will handle module selection)
  if (!currentModule) {
    return null;
  }

  const handleSelectAnswer = useCallback((optionIndex) => {
    setSelectedAnswer(optionIndex);
  }, []);

  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer === null) return;

    const isCorrect = currentQuestion.options[selectedAnswer].correct;
    const newAnswers = [...answers, { questionId: currentQuestion.id, isCorrect }];
    setAnswers(newAnswers);

    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Calculate final score and duration, then call onComplete callback
      const correct = newAnswers.filter((a) => a.isCorrect).length;
      const finalScore = Math.round((correct / newAnswers.length) * 100);
      const passed = finalScore >= 70;
      const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
      setShowResults(true);
      if (onComplete) onComplete(finalScore, passed, durationSec);
    }
  }, [selectedAnswer, currentQuestion, currentQuizIndex, answers, onComplete]);

  const handleBackToAcademie = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  const calculateScore = useCallback(() => {
    const correct = answers.filter((a) => a.isCorrect).length;
    return Math.round((correct / answers.length) * 100);
  }, [answers]);

  const calculateXpEarned = useCallback(() => {
    const score = calculateScore();
    return Math.round((score / 100) * 100); // 0-100 XP based on score
  }, [calculateScore]);

  if (showResults && isQuizComplete) {
    const score = calculateScore();
    const xp = calculateXpEarned();
    const passed = score >= 70;

    return (
      <div className="quiz-results" role="alert" aria-live="assertive">
        <div className="results-header">
          <h2 className="results-title">🎉 Quiz Terminé!</h2>
        </div>

        <div className="results-content">
          <div className={`score-circle ${passed ? 'passed' : 'failed'}`}>
            <span className="score-value">{score}%</span>
          </div>

          <p className={`results-message ${passed ? 'success' : 'improve'}`}>
            {passed
              ? '✅ Excellent! Vous maîtrisez bien ce sujet!'
              : '⚠️ Continuez votre apprentissage pour améliorer votre score.'}
          </p>

          <div className="results-stats">
            <div className="result-stat">
              <span className="stat-label">Questions Correctes</span>
              <span className="stat-value">
                {answers.filter((a) => a.isCorrect).length}/{answers.length}
              </span>
            </div>

            <div className="result-stat">
              <span className="stat-label">Points Gagnés</span>
              <span className="stat-value">🎖️ {xp} XP</span>
            </div>
          </div>

          {/* Phase 4.0.5: Show credits earned badge */}
          <div className="quiz-credits-badge">
            🎁 +{passed ? 20 : 5} crédits gagnés!
          </div>

          <button onClick={handleBackToAcademie} className="btn-restart">
            ← Retour à l'Académie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-module">
      <div className="quiz-header">
        <h2 className="quiz-title">🎓 Quiz Interactif</h2>
        <div className="quiz-progress">
          <span className="progress-text">
            Question {currentQuizIndex + 1}/{QUIZ_QUESTIONS.length}
          </span>
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={((currentQuizIndex + 1) / QUIZ_QUESTIONS.length) * 100}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression du quiz"
          >
            <div
              className="progress-fill"
              style={{
                width: `${((currentQuizIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="quiz-content">
        <div className="question-card">
          <div className="question-meta">
            <span className="question-category">{currentQuestion.category}</span>
            <span className="question-difficulty">{currentQuestion.difficulty}</span>
          </div>

          <h3 className="question-text">{currentQuestion.question}</h3>

          <div className="options-list">
            {currentQuestion.options.map((option, index) => (
              <label key={index} className="option-item">
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={selectedAnswer === index}
                  onChange={() => handleSelectAnswer(index)}
                  className="option-input"
                />
                <span className="option-text">{option.text}</span>
                <button onClick={() => speak(option.text)} className="speak-option-btn">🔊</button>
              </label>
            ))}
          </div>

          {selectedAnswer !== null && (
            <div className="feedback-box" role="alert" aria-live="polite">
              <p className="feedback-text">
                {currentQuestion.options[selectedAnswer].feedback}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="quiz-footer">
        <button
          onClick={handleSubmitAnswer}
          disabled={selectedAnswer === null}
          className="btn-next"
        >
          {currentQuizIndex === QUIZ_QUESTIONS.length - 1
            ? '✅ Terminer'
            : 'Suivant →'}
        </button>
      </div>
    </div>
  );
}
