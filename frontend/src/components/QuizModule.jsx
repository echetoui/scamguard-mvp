/**
 * QuizModule Component
 * Phase 4.0.3 - Interactive Learning Quizzes
 *
 * Interactive quiz system for scam awareness training
 */

import React, { useState, useCallback } from 'react';
import '../styles/QuizModule.css';

// Sample quiz questions - can be expanded
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'Vous recevez un SMS disant "Compte bancaire bloqué. Cliquez ici". Que faites-vous?',
    options: [
      { text: 'Je clique le lien immédiatement', correct: false, feedback: '❌ Mauvais! Les vrais banques ne demandent jamais via SMS.' },
      { text: 'J\'appelle ma banque directement', correct: true, feedback: '✅ Correct! Vérifiez toujours par le numéro officiel de la banque.' },
      { text: 'Je partage le message', correct: false, feedback: '❌ Non! Ne partagez jamais ces messages suspects.' },
    ],
    category: 'Phishing Bancaire',
    difficulty: 'Facile',
  },
  {
    id: 2,
    question: 'Quel est le signe principal d\'un email phishing?',
    options: [
      { text: 'Une demande urgente d\'informations personnelles', correct: true, feedback: '✅ Exact! Les arnaqueurs créent l\'urgence.' },
      { text: 'Un design professionnel', correct: false, feedback: '❌ Faux, les arnaqueurs copient aussi les designs.' },
      { text: 'Un lien court', correct: false, feedback: '❌ Non, ce n\'est pas spécifique aux emails suspects.' },
    ],
    category: 'Phishing Email',
    difficulty: 'Moyen',
  },
  {
    id: 3,
    question: 'Vous gagnez une loterie que vous n\'aviez pas jouée. Que faites-vous?',
    options: [
      { text: 'Je paie les frais pour recevoir mon prix', correct: false, feedback: '❌ Arnaque classique! Ne payez jamais les frais.' },
      { text: 'Je supprime le message', correct: true, feedback: '✅ Correct! C\'est une arnaque au loterie fictive.' },
      { text: 'Je donne mes coordonnées bancaires', correct: false, feedback: '❌ Jamais! C\'est un vol d\'identité.' },
    ],
    category: 'Faux Loteries',
    difficulty: 'Facile',
  },
  {
    id: 4,
    question: 'Comment vérifier si un site est sécurisé pour le shopping?',
    options: [
      { text: 'Regarder le cadenas et "https://" dans l\'URL', correct: true, feedback: '✅ Correct! Vérifiez toujours le protocole sécurisé.' },
      { text: 'Vérifier si le site a des publicités', correct: false, feedback: '❌ Les pubs ne prouvent pas la légitimité.' },
      { text: 'Demander à un ami', correct: false, feedback: '❌ Vérifiez directement, ne faites pas confiance aux rumeurs.' },
    ],
    category: 'Achats en Ligne',
    difficulty: 'Moyen',
  },
  {
    id: 5,
    question: 'Qu\'est-ce qu\'un code PIN et quand le donneriez-vous?',
    options: [
      { text: 'Jamais! Même pas à la banque ou à la police', correct: true, feedback: '✅ Exact! Votre PIN est ultra-secret.' },
      { text: 'Je le donne si quelqu\'un prétend être de la banque', correct: false, feedback: '❌ Non! Les vrais banquiers ne demandent JAMAIS le PIN.' },
      { text: 'Je le partage avec la famille', correct: false, feedback: '❌ Mauvais, gardez-le secret!' },
    ],
    category: 'Sécurité Bancaire',
    difficulty: 'Facile',
  },
];

export default function QuizModule({ onComplete }) {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const currentQuestion = QUIZ_QUESTIONS[currentQuizIndex];
  const isQuizComplete = answers.length === QUIZ_QUESTIONS.length;

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
      // Phase 4.0.5: Calculate final score and call onComplete callback
      const correct = newAnswers.filter((a) => a.isCorrect).length;
      const finalScore = Math.round((correct / newAnswers.length) * 100);
      const passed = finalScore >= 70;
      setShowResults(true);
      if (onComplete) onComplete(finalScore, passed);
    }
  }, [selectedAnswer, currentQuestion, currentQuizIndex, answers, onComplete]);

  const handleRestartQuiz = useCallback(() => {
    setCurrentQuizIndex(0);
    setAnswers([]);
    setShowResults(false);
    setSelectedAnswer(null);
  }, []);

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
      <div className="quiz-results">
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

          <button onClick={handleRestartQuiz} className="btn-restart">
            🔄 Recommencer le Quiz
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
          <div className="progress-bar">
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
              </label>
            ))}
          </div>

          {selectedAnswer !== null && (
            <div className="feedback-box">
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
