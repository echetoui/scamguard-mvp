/**
 * QuizModule Component
 * Phase 1 Sprint 3 - Interactive Learning Quizzes (Enhanced)
 *
 * Interactive quiz system for scam awareness training
 * Supports multiple quiz modules with progress tracking
 */

import React, { useState, useCallback } from 'react';
import '../styles/QuizModule.css';

// Quiz modules with 10 questions each
const QUIZ_MODULES = {
  phishing: {
    id: 'phishing',
    title: 'Phishing & Arnaques Numériques',
    icon: '🛡️',
    questions: [
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
        question: 'Comment vérifier si une adresse email est celle d\'un arnaqueur?',
        options: [
          { text: 'Regarder attentivement l\'adresse pour des variations subtiles', correct: true, feedback: '✅ Correct! Les arnaqueurs utilisent des adresses similaires (ex: gogle@... au lieu de google@...).' },
          { text: 'Si c\'est en HTML, c\'est sûr', correct: false, feedback: '❌ Non, le format n\'indique pas la légitimité.' },
          { text: 'Vérifier si elle finit par .com', correct: false, feedback: '❌ N\'importe qui peut avoir une adresse .com.' },
        ],
        category: 'Phishing Email',
        difficulty: 'Moyen',
      },
      {
        id: 5,
        question: 'Vous recevez un email prétendant être de PayPal vous demandant de "vérifier votre compte". Que faites-vous?',
        options: [
          { text: 'Je clique le lien dans l\'email', correct: false, feedback: '❌ Mauvais! C\'est une technique classique de phishing.' },
          { text: 'Je vais directement sur paypal.com sans cliquer sur le lien', correct: true, feedback: '✅ Correct! Allez toujours directement sur le site officiel.' },
          { text: 'Je réponds à l\'email avec mes identifiants', correct: false, feedback: '❌ Jamais! Les entreprises légitimes ne demandent jamais les identifiants par email.' },
        ],
        category: 'Phishing Email',
        difficulty: 'Facile',
      },
      {
        id: 6,
        question: 'Quel est un bon indicateur qu\'un lien est malveillant?',
        options: [
          { text: 'L\'URL réelle est différente du texte affiché du lien', correct: true, feedback: '✅ Exact! Survolez les liens pour voir l\'URL réelle.' },
          { text: 'Le lien contient des tirets', correct: false, feedback: '❌ Non, les tirets sont normaux dans les URLs.' },
          { text: 'Le lien utilise un sous-domaine', correct: false, feedback: '❌ Les sous-domaines sont courants et normaux.' },
        ],
        category: 'Phishing Email',
        difficulty: 'Moyen',
      },
      {
        id: 7,
        question: 'Une demande d\'argent immédiat via un formulaire en ligne est généralement...',
        options: [
          { text: 'Une arnaque', correct: true, feedback: '✅ Correct! Les transactions légitimes n\'exigent jamais l\'argent ainsi.' },
          { text: 'Une vérification de sécurité normale', correct: false, feedback: '❌ Non, les banques vérifient différemment.' },
          { text: 'Un frais obligatoire', correct: false, feedback: '❌ Faux, c\'est une tactique d\'arnaque.' },
        ],
        category: 'Phishing Bancaire',
        difficulty: 'Facile',
      },
      {
        id: 8,
        question: 'Qu\'est-ce qu\'un "formulaire de phishing"?',
        options: [
          { text: 'Un formulaire faux qui ressemble à un site légitime pour voler des données', correct: true, feedback: '✅ Correct! Ils capturent les identifiants et données personnelles.' },
          { text: 'Un formulaire sur un site sécurisé', correct: false, feedback: '❌ Non, c\'est souvent un formulaire sur un site malveillant.' },
          { text: 'Un formulaire que vous remplissez à la banque', correct: false, feedback: '❌ Ce n\'est pas la même chose.' },
        ],
        category: 'Phishing Email',
        difficulty: 'Moyen',
      },
      {
        id: 9,
        question: 'Si vous cliquez accidentellement sur un lien malveillant, que devez-vous faire?',
        options: [
          { text: 'Rien, tant que vous ne saisissez pas de données', correct: true, feedback: '✅ Correct! Fermez simplement la page sans entrer d\'informations.' },
          { text: 'Appeler immédiatement votre banque en panique', correct: false, feedback: '❌ Pas nécessaire si vous n\'avez pas saisi de données.' },
          { text: 'Réinitialiser votre ordinateur', correct: false, feedback: '❌ Ce n\'est pas nécessaire dans la plupart des cas.' },
        ],
        category: 'Phishing Bancaire',
        difficulty: 'Facile',
      },
      {
        id: 10,
        question: 'Qu\'est-ce qu\'un "compromis de compte" et comment le prévenir?',
        options: [
          { text: 'Quand quelqu\'un accède à votre compte; utilisez des mots de passe uniques et forts', correct: true, feedback: '✅ Correct! Les mots de passe forts et différents pour chaque site sont essentiels.' },
          { text: 'Quand votre email est supprimé', correct: false, feedback: '❌ Ce n\'est pas un compromis de compte.' },
          { text: 'Quand votre téléphone est perdu', correct: false, feedback: '❌ C\'est une situation différente.' },
        ],
        category: 'Phishing Email',
        difficulty: 'Moyen',
      },
    ],
  },
  telephone: {
    id: 'telephone',
    title: 'Arnaques Téléphoniques',
    icon: '📞',
    questions: [
      {
        id: 11,
        question: 'Un "appel du faux support technique" vise généralement à...',
        options: [
          { text: 'Vous faire croire que votre ordinateur a un problème', correct: true, feedback: '✅ Exact! Ils utilisent la peur pour prendre contrôle de votre ordinateur.' },
          { text: 'Vérifier la qualité de votre téléphone', correct: false, feedback: '❌ Non, c\'est une tactique d\'arnaque.' },
          { text: 'Vous proposer une assurance', correct: false, feedback: '❌ Ce n\'est pas l\'objectif principal.' },
        ],
        category: 'Faux Support',
        difficulty: 'Facile',
      },
      {
        id: 12,
        question: 'Si quelqu\'un appelle en disant être de votre banque, que faites-vous?',
        options: [
          { text: 'Raccrochez et appelez votre banque au numéro officiel', correct: true, feedback: '✅ Correct! Les vrais banquiers ne vous appellent jamais pour les identifiants.' },
          { text: 'Donnez votre numéro de compte', correct: false, feedback: '❌ Jamais! C\'est une technique d\'arnaque.' },
          { text: 'Restez en ligne pour vérifier', correct: false, feedback: '❌ L\'arnaqueur pourrait vous garder en ligne.' },
        ],
        category: 'Arnaque Bancaire',
        difficulty: 'Facile',
      },
      {
        id: 13,
        question: 'Qu\'est-ce qu\'un "spoofing d\'appel"?',
        options: [
          { text: 'Quand quelqu\'un masque son vrai numéro en affichant un autre', correct: true, feedback: '✅ Correct! Cela rend difficile l\'identification du vrai appelant.' },
          { text: 'Un appel où la personne change sa voix', correct: false, feedback: '❌ Ce n\'est pas la bonne définition.' },
          { text: 'Un appel de blague sans importance', correct: false, feedback: '❌ C\'est plus grave que cela.' },
        ],
        category: 'Appel Suspect',
        difficulty: 'Moyen',
      },
      {
        id: 14,
        question: 'Un appel prétend que vous avez gagné un prix. Votre réaction?',
        options: [
          { text: 'Demander des détails et vérifier indépendamment', correct: true, feedback: '✅ Correct! Vérifiez les prix légitimes directement.' },
          { text: 'Donner votre numéro de carte bancaire', correct: false, feedback: '❌ Jamais pour un prix non vérifié!' },
          { text: 'Appeler un numéro que l\'appelant vous donne', correct: false, feedback: '❌ C\'est toujours le même arnaqueur.' },
        ],
        category: 'Arnaque au Prix',
        difficulty: 'Facile',
      },
      {
        id: 15,
        question: 'Comment vérifier si un appel prétendant être de votre opérateur est légitime?',
        options: [
          { text: 'Raccrochez et appelez l\'opérateur au numéro officiel', correct: true, feedback: '✅ Correct! C\'est la seule façon sûre de vérifier.' },
          { text: 'Demandez des informations personnelles pour "vérifier"', correct: false, feedback: '❌ Les arnaqueurs demandent, ne vérifient pas.' },
          { text: 'Acceptez de payer pour une "vérification"', correct: false, feedback: '❌ C\'est une arnaque classique.' },
        ],
        category: 'Appel Suspect',
        difficulty: 'Moyen',
      },
      {
        id: 16,
        question: 'Un appel urgent vous demandant d\'envoyer de l\'argent rapidement est...',
        options: [
          { text: 'Presque certainement une arnaque', correct: true, feedback: '✅ Correct! L\'urgence est une tactique classique d\'arnaque.' },
          { text: 'Un besoin d\'urgence légitime', correct: false, feedback: '❌ Les vrais amis/famille vous contacteraient différemment.' },
          { text: 'Une vérification de sécurité', correct: false, feedback: '❌ Les banques ne demandent jamais l\'argent ainsi.' },
        ],
        category: 'Arnaque à l\'Urgence',
        difficulty: 'Facile',
      },
      {
        id: 17,
        question: 'Qu\'est-ce qu\'une "arnaque au faux parent"?',
        options: [
          { text: 'Quelqu\'un prétend être un proche et demande de l\'argent en urgence', correct: true, feedback: '✅ Exact! Ils visent les personnes âgées notamment.' },
          { text: 'Un appel de votre vrai parent', correct: false, feedback: '❌ Ce n\'est pas une arnaque si c\'est réel.' },
          { text: 'Un appel de votre école', correct: false, feedback: '❌ Ce n\'est pas une arnaque téléphonique.' },
        ],
        category: 'Arnaque au Parent',
        difficulty: 'Moyen',
      },
      {
        id: 18,
        question: 'Un appel dit que vous devez payer des taxes immédiatement. Que faites-vous?',
        options: [
          { text: 'Raccrochez et contactez l\'administration directement', correct: true, feedback: '✅ Correct! Les agences officielles ne menacent jamais par téléphone.' },
          { text: 'Payez immédiatement pour éviter des problèmes', correct: false, feedback: '❌ C\'est l\'objectif de l\'arnaqueur.' },
          { text: 'Donnez vos coordonnées bancaires', correct: false, feedback: '❌ Jamais!' },
        ],
        category: 'Arnaque aux Impôts',
        difficulty: 'Facile',
      },
      {
        id: 19,
        question: 'Comment protéger quelqu\'un d\'âge avancé des arnaques téléphoniques?',
        options: [
          { text: 'Lui enseigner à raccrocher et vérifier via des numéros officiels', correct: true, feedback: '✅ Correct! L\'éducation est la meilleure prévention.' },
          { text: 'Lui interdire de répondre au téléphone', correct: false, feedback: '❌ Ce n\'est pas pratique.' },
          { text: 'Ne rien faire, il apprendra seul', correct: false, feedback: '❌ L\'aide active est importante.' },
        ],
        category: 'Protection Personnes Âgées',
        difficulty: 'Moyen',
      },
      {
        id: 20,
        question: 'Un appel prétend venir de votre service bancaire avec un numéro qui ressemble au vrai. Que faites-vous?',
        options: [
          { text: 'Raccrochez immédiatement sans donner d\'informations', correct: true, feedback: '✅ Correct! Le spoofing rend difficile l\'identification réelle.' },
          { text: 'Donnez vos données pour que "ils vérifient"', correct: false, feedback: '❌ Non! Les vraies banques ne demandent jamais cela.' },
          { text: 'Suivez les instructions du numéro dans l\'appel', correct: false, feedback: '❌ C\'est un arnaqueur.' },
        ],
        category: 'Arnaque Bancaire',
        difficulty: 'Facile',
      },
    ],
  },
  online: {
    id: 'online',
    title: 'Arnaques en Ligne',
    icon: '🛒',
    questions: [
      {
        id: 21,
        question: 'Comment vérifier si un site de shopping est sécurisé?',
        options: [
          { text: 'Regarder le cadenas et "https://" dans l\'URL', correct: true, feedback: '✅ Correct! HTTPS et un cadenas indiquent une connexion sécurisée.' },
          { text: 'Vérifier si le site a beaucoup de publicités', correct: false, feedback: '❌ Les pubs ne prouvent pas la sécurité.' },
          { text: 'Demander à un ami s\'il connaît le site', correct: false, feedback: '❌ Vérifiez directement, ne faites pas confiance aux rumeurs.' },
        ],
        category: 'Shopping en Ligne',
        difficulty: 'Facile',
      },
      {
        id: 22,
        question: 'Un site offre un produit à un prix anormalement bas. Que pensez-vous?',
        options: [
          { text: 'C\'est probablement une arnaque ou un site contrefait', correct: true, feedback: '✅ Correct! Les prix trop bas sont souvent des signaux d\'alerte.' },
          { text: 'C\'est une bonne affaire à profiter', correct: false, feedback: '❌ Trop bon pour être vrai, généralement c\'est une arnaque.' },
          { text: 'C\'est un site de fin d\'inventaire', correct: false, feedback: '❌ Vérifiez toujours l\'authenticité d\'abord.' },
        ],
        category: 'Shopping en Ligne',
        difficulty: 'Facile',
      },
      {
        id: 23,
        question: 'Qu\'est-ce qu\'une "arnaque au produit contrefait"?',
        options: [
          { text: 'Recevoir un faux produit au lieu de l\'original achetéé', correct: true, feedback: '✅ Exact! Les contrefaçons sont courants en ligne.' },
          { text: 'Acheter un produit qui ne fonctionne pas bien', correct: false, feedback: '❌ Ce n\'est pas une arnaque volontaire.' },
          { text: 'Un produit que vous trouvez en magasin', correct: false, feedback: '❌ Les contrefaçons sont surtout un problème en ligne.' },
        ],
        category: 'Produits Contrefaits',
        difficulty: 'Moyen',
      },
      {
        id: 24,
        question: 'Comment protéger votre mot de passe en ligne?',
        options: [
          { text: 'Utilisez des mots de passe uniques et forts pour chaque site', correct: true, feedback: '✅ Correct! C\'est la meilleure prévention.' },
          { text: 'Utilisez le même mot de passe partout pour faciliter la mémorisation', correct: false, feedback: '❌ C\'est dangereux! Une violation expose tous vos comptes.' },
          { text: 'Écrire vos mots de passe sur un papier collant', correct: false, feedback: '❌ Utilisez un gestionnaire de mots de passe à la place.' },
        ],
        category: 'Sécurité en Ligne',
        difficulty: 'Moyen',
      },
      {
        id: 25,
        question: 'Un site vous demande de partager votre numéro de sécurité sociale. Que faites-vous?',
        options: [
          { text: 'Refusez et quittez le site immédiatement', correct: true, feedback: '✅ Correct! Les sites légitimes de shopping ne demandent JAMAIS cela.' },
          { text: 'Donnez-le si le site semble professionnel', correct: false, feedback: '❌ Non! C\'est une information très sensible.' },
          { text: 'Téléphonez au site pour confirmer', correct: false, feedback: '❌ Quittez plutôt le site.' },
        ],
        category: 'Shopping en Ligne',
        difficulty: 'Facile',
      },
      {
        id: 26,
        question: 'Qu\'est-ce qu\'une "arnaque à l\'hameçonnage de compte"?',
        options: [
          { text: 'Essayer de voler votre mot de passe via des emails ou messages faux', correct: true, feedback: '✅ Correct! C\'est l\'une des arnaques les plus courantes en ligne.' },
          { text: 'Quelqu\'un qui vous demande vos informations en personne', correct: false, feedback: '❌ Ce n\'est pas en ligne.' },
          { text: 'Un email promotionnel normal', correct: false, feedback: '❌ L\'hameçonnage est malveillant.' },
        ],
        category: 'Arnaques de Compte',
        difficulty: 'Moyen',
      },
      {
        id: 27,
        question: 'Un site de vente d\'occasion vous demande de payer d\'avance sans protection. Que faites-vous?',
        options: [
          { text: 'Refusez et utilisez plutôt un site avec protection de l\'acheteur', correct: true, feedback: '✅ Correct! La protection de l\'acheteur est importante.' },
          { text: 'Payez immédiatement pour avoir une bonne affaire', correct: false, feedback: '❌ Vous risquez de perdre votre argent.' },
          { text: 'Envoyez vos coordonnées bancaires pour sécuriser la transaction', correct: false, feedback: '❌ Non! Utilisez plutôt des services sécurisés.' },
        ],
        category: 'Shopping en Ligne',
        difficulty: 'Facile',
      },
      {
        id: 28,
        question: 'Comment reconnaître un site d\'arnaque à l\'identité visuelle?',
        options: [
          { text: 'La copie est presque parfaite mais l\'URL est légèrement différente', correct: true, feedback: '✅ Exact! Vérifiez toujours l\'URL complète et comparez-la.' },
          { text: 'Le site a un mauvais design visible', correct: false, feedback: '❌ Certains arnaqueurs copient bien le design.' },
          { text: 'Le site a une charte graphique moderne', correct: false, feedback: '❌ Cela ne signifie pas qu\'il est légitime.' },
        ],
        category: 'Usurpation d\'Identité',
        difficulty: 'Moyen',
      },
      {
        id: 29,
        question: 'Qu\'est-ce qu\'un "formulaire de création de compte" de phishing?',
        options: [
          { text: 'Un faux formulaire qui capture vos identifiants lors du "créage de compte"', correct: true, feedback: '✅ Correct! Ils ressemblent aux vrais sites mais visent à voler vos données.' },
          { text: 'Un vrai formulaire sur un site officiel', correct: false, feedback: '❌ Non, c\'est un faux formulaire.' },
          { text: 'Un formulaire qui exige de payer immédiatement', correct: false, feedback: '❌ C\'est une arnaques de paiement, pas un formulaire de phishing.' },
        ],
        category: 'Arnaques de Compte',
        difficulty: 'Moyen',
      },
      {
        id: 30,
        question: 'Après avoir acheté en ligne, vous recevez un email suspect sur la livraison. Que faites-vous?',
        options: [
          { text: 'Vérifiez directement sur le site du vendeur ou son application officielle', correct: true, feedback: '✅ Correct! Ne cliquez pas sur les liens dans des emails suspects.' },
          { text: 'Cliquez le lien de "suivi" dans l\'email', correct: false, feedback: '❌ C\'est peut-être un lien malveillant.' },
          { text: 'Répondez à l\'email avec vos informations de paiement', correct: false, feedback: '❌ Jamais! Les vendeurs légitimes ne demandent cela par email.' },
        ],
        category: 'Shopping en Ligne',
        difficulty: 'Facile',
      },
    ],
  },
};

export default function QuizModule({ moduleId = null, onComplete, onBack })  {
  // Get questions for the selected module
  const currentModule = moduleId ? QUIZ_MODULES[moduleId] : null;
  const QUIZ_QUESTIONS = currentModule ? currentModule.questions : [];

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const currentQuestion = QUIZ_QUESTIONS[currentQuizIndex];
  const isQuizComplete = answers.length === QUIZ_QUESTIONS.length;

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
      // Phase 4.0.5: Calculate final score and call onComplete callback
      const correct = newAnswers.filter((a) => a.isCorrect).length;
      const finalScore = Math.round((correct / newAnswers.length) * 100);
      const passed = finalScore >= 70;
      setShowResults(true);
      if (onComplete) onComplete(finalScore, passed);
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
