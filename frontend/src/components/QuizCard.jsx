/**
 * QuizCard Component - ScamGuard Design System
 * Figma Component: Quiz Card / Question
 *
 * Displays a quiz question with multiple choice answers
 */

import React, { useState } from 'react';
import './QuizCard.css';

/**
 * @param {object} props
 * @param {string} props.question - Quiz question
 * @param {Array<{id: string, text: string, correct?: boolean}>} props.options - Answer options
 * @param {function} props.onAnswer - Callback when answer selected
 * @param {string} [props.category] - Quiz category/topic
 * @param {number} [props.number] - Question number
 */
const QuizCard = ({
  question,
  options,
  onAnswer,
  category,
  number
}) => {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (id) => {
    if (answered) return;
    setSelected(id);
    const option = options.find(o => o.id === id);
    onAnswer?.(id, option?.correct);
    setAnswered(true);
  };

  return (
    <div className="quiz-card" role="article">
      {category && number && (
        <div className="quiz-card__header">
          <span className="quiz-card__category">{category}</span>
          <span className="quiz-card__number">Question {number}</span>
        </div>
      )}

      <h3 className="quiz-card__question">{question}</h3>

      <div className="quiz-card__options">
        {options.map(option => (
          <button
            key={option.id}
            className={`quiz-card__option ${
              selected === option.id ? 'quiz-card__option--selected' : ''
            } ${
              answered && option.correct ? 'quiz-card__option--correct' : ''
            } ${
              answered && selected === option.id && !option.correct
                ? 'quiz-card__option--incorrect'
                : ''
            }`}
            onClick={() => handleSelect(option.id)}
            disabled={answered}
            aria-label={`Option: ${option.text}`}
          >
            <span className="quiz-card__option-text">{option.text}</span>
            {answered && option.id === selected && (
              <span className="quiz-card__option-result">
                {option.correct ? '✓' : '✗'}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizCard;
